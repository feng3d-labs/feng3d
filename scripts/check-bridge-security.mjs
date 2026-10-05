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
 * 发一个 GET（**用 `node:http` 而不是 `fetch`**：`fetch` 不允许改 `Host` 头，
 * 而 Host 正是这里要验的东西之一）。
 *
 * @param {{ base: string, path: string, headers?: Record<string, string> }} input 请求参数
 * @returns {Promise<{ status: number, body: string }>} 响应
 */
function get({ base, path, headers = {} })
{
    const url = new URL(path, base);

    return new Promise((resolve_) =>
    {
        const req = httpRequest({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: 'GET',
            headers,
        }, (res) =>
        {
            let body = '';

            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => resolve_({ status: res.statusCode ?? 0, body }));
        });

        req.on('error', (error) => resolve_({ status: 0, body: error.message }));
        req.end();
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
