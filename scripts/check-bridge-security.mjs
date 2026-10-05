#!/usr/bin/env node
/**
 * **桥接来源校验**的验收（#273 P2 / D9 通信安全）。
 *
 * ## 为什么必须有这一条（架构文档的原话）
 *
 * > **WebSocket 握手不受浏览器同源策略约束**——任意网页都能向 `ws://127.0.0.1:<port>` 发起连接。
 * > …… **必须进 CI**——长连接一旦被连上就是持续通道。
 * > （`packages/editor/docs/ARCHITECTURE.md` §7「D9 通信安全」）
 *
 * ## 判据：**负例为主**，但正例一条都不能少
 *
 * "正常请求能过"单独存在时，把校验整个删掉也照样绿；反过来只验负例，
 * 又可能把校验做成"全站拒绝"从而把编辑器自己的通道也掐断。所以两向都验：
 *
 * | 方向 | 判据 |
 * |---|---|
 * | 正例 | 本机 Host + 无 Origin（**页面自己的同源 GET**）能过；本机 `Origin` 换一种写法也能过 |
 * | 负例 | 跨源 `Origin` / `Origin: null` / 非本机 `Host`（DNS rebinding）/ 端口不符 → **全部 403** |
 * | 范围 | 校验**只覆盖桥接前缀**：静态资源照常返回（否则"安全"会变成"打不开编辑器"） |
 *
 * WebSocket 握手用的是**同一个判据函数**（`bridgeSocket.mjs` 里调 `checkBridgeRequest`）——
 * 起 vite dev server 才能真连 WS，成本太高；这里用一条**接线自证**钉住它，
 * 判据本身由 `packages/editor/test/bridgeSecurity.spec.ts` 的 8 条单测覆盖。
 *
 * 用法：
 *   node scripts/check-bridge-security.mjs
 *
 * 退出码：0 全部通过；1 有失败。
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { WebSocket } from 'ws';

const here = import.meta.dirname;
const SERVE = resolve(here, '..', 'packages', 'editor', 'bin', 'serve.mjs');
const SOCKET = resolve(here, '..', 'packages', 'editor', 'bridge', 'bridgeSocket.mjs');
const PREFIX = '/__editor-bridge';

let total = 0;
let failed = 0;

/**
 * 记一条判据。
 *
 * @param {string} title 判据
 * @param {boolean} condition 是否通过
 * @param {string} [detail] 附加说明
 */
function check(title, condition, detail = '')
{
    total++;
    if (condition) console.log(`  PASS  ${title}${detail ? ` — ${detail}` : ''}`);
    else { failed++; console.log(`  FAIL  ${title}${detail ? ` — ${detail}` : ''}`); }
}

/**
 * 发一个请求（**用 `node:http` 而不是 `fetch`**：`fetch` 不允许改 `Host` 头，
 * 而 Host 正是这里要验的东西之一）。
 *
 * @param {{ base: string, path: string, method?: string, body?: string, headers?: Record<string, string> }} input 请求参数
 * @returns {Promise<{ status: number, body: string }>} 响应
 */
function send({ base, path, method = 'GET', body = null, headers = {} })
{
    const url = new URL(path, base);

    return new Promise((resolve_) =>
    {
        const req = httpRequest({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers,
        }, (res) =>
        {
            let text = '';

            res.on('data', (chunk) => { text += chunk; });
            res.on('end', () => resolve_({ status: res.statusCode ?? 0, body: text }));
        });

        req.on('error', (error) => resolve_({ status: 0, body: error.message }));
        if (body !== null) req.write(body);
        req.end();
    });
}

/** GET 简写 */
function get(input)
{
    return send({ ...input, method: 'GET' });
}

/** POST 简写（JSON 体） */
function post(input)
{
    return send({
        ...input,
        method: 'POST',
        body: input.body ?? '{}',
        headers: { 'Content-Type': 'application/json', ...(input.headers ?? {}) },
    });
}

/**
 * 试连一个 WebSocket。
 *
 * @param {string} url 地址
 * @returns {Promise<string>} `'连上'` / `'拒绝'` / 其他（超时、错误摘要）
 */
function wsProbe(url)
{
    return new Promise((resolve_) =>
    {
        const ws = new WebSocket(url);
        const timer = setTimeout(() => { ws.terminate?.(); resolve_('超时'); }, 5000);

        ws.on('open', () => { clearTimeout(timer); ws.close(); resolve_('连上'); });
        // 服务端不是 101 而是 403 时，`ws` 走这个事件（而不是 connect 失败）
        ws.on('unexpected-response', (_req, res) => { clearTimeout(timer); resolve_(res.statusCode === 403 ? '拒绝' : `HTTP ${res.statusCode}`); });
        ws.on('error', (error) => { clearTimeout(timer); resolve_(/403/.test(error.message) ? '拒绝' : `错误：${error.message}`); });
    });
}

console.log('[桥接来源校验] #273 P2 / D9：跨源网页与 DNS rebinding 都连不上本机桥接');

// ---------- 起一个真宿主（静态服务 + 中继） ----------
const dir = mkdtempSync(join(tmpdir(), 'feng3d-bridge-security-'));
const root = join(dir, 'static');

mkdirSync(root, { recursive: true });
writeFileSync(join(root, 'index.html'), '<html><body>编辑器</body></html>', 'utf8');

const host = spawn(process.execPath, [SERVE, '--port', '0', '--root', root], {
    stdio: ['ignore', 'pipe', 'pipe'],
});
let hostLog = '';

host.stdout.on('data', (chunk) => { hostLog += chunk; });
host.stderr.on('data', (chunk) => { hostLog += chunk; });

const base = await new Promise((resolve_) =>
{
    const deadline = Date.now() + 25000;
    const tick = setInterval(() =>
    {
        const matched = /已启动：(http:\/\/127\.0\.0\.1:\d+\/)/.exec(hostLog);

        if (matched) { clearInterval(tick); resolve_(matched[1].replace(/\/$/, '')); }
        else if (Date.now() > deadline) { clearInterval(tick); resolve_(''); }
    }, 100);
});

if (!base)
{
    console.error(`宿主没起来：\n${hostLog}`);
    process.exit(1);
}

const port = Number(new URL(base).port);

try
{
    // ---------- 正例：页面自己的请求必须能过 ----------
    const plain = await get({ base, path: `${PREFIX}/ping` });

    check('本机 Host + 无 Origin（**页面自己的同源 GET**）→ 放行',
        plain.status === 200 && plain.body.includes('feng3d-editor-bridge'), `${plain.status} ${plain.body.slice(0, 60)}`);

    const localOrigin = await get({
        base,
        path: `${PREFIX}/ping`,
        headers: { Origin: `http://localhost:${port}` },
    });

    check('本机 `Origin`（换一种写法：localhost）→ 放行', localOrigin.status === 200, String(localOrigin.status));

    // ---------- 负例：跨源网页 ----------
    const crossOrigin = await get({
        base,
        path: `${PREFIX}/call`,
        headers: { Origin: 'http://evil.example' },
    });

    check('★ **跨源 `Origin` 被拒**（恶意网页这一路）',
        crossOrigin.status === 403 && crossOrigin.body.includes('Origin 非本机'),
        `${crossOrigin.status} ${crossOrigin.body.slice(0, 70)}`);

    const nullOrigin = await get({ base, path: `${PREFIX}/ping`, headers: { Origin: 'null' } });

    check('★ `Origin: null` 被拒（sandbox iframe / file:// 伪装）',
        nullOrigin.status === 403, `${nullOrigin.status} ${nullOrigin.body.slice(0, 60)}`);

    // ---------- 负例：DNS rebinding ----------
    const rebind = await get({ base, path: `${PREFIX}/ping`, headers: { Host: `evil.example:${port}` } });

    check('★ 非本机 `Host` 被拒（**DNS rebinding**：攻击者域名解析到 127.0.0.1）',
        rebind.status === 403 && rebind.body.includes('DNS rebinding'),
        `${rebind.status} ${rebind.body.slice(0, 70)}`);

    const wrongPort = await get({ base, path: `${PREFIX}/ping`, headers: { Host: `127.0.0.1:${port + 1}` } });

    check('端口不符被拒（Host 与 Origin 都查）', wrongPort.status === 403, `${wrongPort.status}`);

    // ---------- 范围：只覆盖桥接前缀 ----------
    const staticWithBadHost = await get({ base, path: '/', headers: { Host: `evil.example:${port}` } });

    check('校验**只覆盖桥接前缀**：静态资源照常返回（否则"安全"变成"打不开编辑器"）',
        staticWithBadHost.status === 200 && staticWithBadHost.body.includes('编辑器'),
        `${staticWithBadHost.status}`);

    // ---------- 一次性 token（#273 P2 / D9 第二步） ----------
    // 服务端生成的 token 打在自己的启动日志里（给本地工具用；浏览器里的攻击者读不到 stdout）
    // 只吃 base64url 字符：日志里 token 后面紧跟的是中文括号，`\S+` 会把说明文字也吞进去
    const tokenMatched = /桥接一次性 token：([A-Za-z0-9_-]+)/.exec(hostLog);
    const token = tokenMatched?.[1] ?? '';

    check('宿主生成了**一次性 token**（并随 `bootScript` 注入页面）', !!tokenMatched,
        token ? `${token.slice(0, 8)}…` : '启动日志里没有');

    const pendingPath = `${PREFIX}/pending?clientId=probe`;
    const noToken = await get({ base, path: pendingPath });
    const badToken = await get({ base, path: pendingPath, headers: { 'x-editor-bridge-token': 'wrong-token' } });
    const goodToken = await get({ base, path: pendingPath, headers: { 'x-editor-bridge-token': token } });

    check('★ 页面侧端点**缺 token 被拒**（`GET /pending`）',
        noToken.status === 403 && noToken.body.includes('缺少一次性 token'),
        `${noToken.status} ${noToken.body.slice(0, 56)}`);
    check('★ 页面侧端点 **token 不匹配被拒**',
        badToken.status === 403 && badToken.body.includes('token 不匹配'), `${badToken.status}`);
    check('页面侧端点**带对 token 能过**（正面判据：否则"全拒"也算通过）',
        goodToken.status === 200, `${goodToken.status} ${goodToken.body.slice(0, 40)}`);

    // **范围**：探针与调用方端点不要求 token —— CLI / MCP / 15 个 e2e 脚本因此零改动
    const pingNoToken = await get({ base, path: `${PREFIX}/ping` });
    // 带一个真方法名：`/call` 会校验 `method` 字段（空体会回 400「缺少 method」，那是服务端**正确**行为）
    const callNoToken = await post({
        base,
        path: `${PREFIX}/call`,
        body: JSON.stringify({ method: 'scene.summary', params: {} }),
    });

    check('探针 `/ping` 不要求 token（AI 客户端靠它判断"有没有页面"）',
        pingNoToken.status === 200, `${pingNoToken.status}`);
    check('★ 调用方端点 `/call` 不要求 token（**CLI / MCP / e2e 零改动**）',
        callNoToken.status === 200 && !!callNoToken.body, `${callNoToken.status} ${callNoToken.body.slice(0, 40)}`);

    // ---------- WebSocket 握手（D9 的核心：握手**不受同源策略约束**） ----------
    const wsBase = `${base.replace(/^http/, 'ws')}${PREFIX}/ws`;
    const wsRefused = await wsProbe(`${wsBase}?token=wrong-token`);
    const wsMissing = await wsProbe(wsBase);
    const wsAccepted = await wsProbe(`${wsBase}?token=${encodeURIComponent(token)}`);

    check('★ WS 握手**缺 token 被拒**', wsMissing === '拒绝', wsMissing);
    check('★ WS 握手 **token 不匹配被拒**', wsRefused === '拒绝', wsRefused);
    check('WS 握手**带对 token 连得上**（正面判据）', wsAccepted === '连上', wsAccepted);

    // ---------- 接线自证：WS 握手共用同一判据 ----------
    const socketSource = readFileSync(SOCKET, 'utf8');

    check('★ WebSocket 握手接了**同一个判据**（接线自证：`bridgeSocket.mjs` 里调 `checkBridgeRequest`）',
        /checkBridgeRequest\(\{\s*headers:\s*req\.headers/.test(socketSource),
        'WS 握手不受同源策略约束，判据本身由 test/bridgeSecurity.spec.ts 的 8 条覆盖');
}
finally
{
    host.kill();
    rmSync(dir, { recursive: true, force: true });
}

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 桥接来源校验未通过——长连接一旦被连上就是持续通道，这一条不能只在文档里成立。');
    process.exit(1);
}

console.log('✅ 桥接来源校验通过：跨源与 DNS rebinding 都被拒，页面自己的请求照常');
