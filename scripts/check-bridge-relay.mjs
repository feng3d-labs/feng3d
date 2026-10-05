#!/usr/bin/env node
/**
 * 桥接通道的协议级验收（#273 第一阶段）。
 *
 * ## 它验什么
 *
 * 命令层从 `vitePlugin.mjs` 抽到 `bridge/relay.mjs` 之后，**宿主要能用同一套协议**
 * 给生产产物提供通道（`NODE_HOST.md` §5.4）。这个脚本起一个**真宿主进程**，
 * 然后扮演"调用方"与"编辑器页面"两个角色，把协议走一遍：
 *
 * ```
 * 调用方                宿主（relay）                页面（本脚本扮演）
 *   POST /call  ──────────► 入队
 *                          ◄──────────  GET /pending     取到任务
 *                          ◄──────────  POST /result     回传结果
 *   GET /result?id= ◄────── 唤醒/取出
 * ```
 *
 * 验的是：**同一份实现支撑 dev 与生产**（协议字段一字不改），以及 15 个
 * `scripts/editor-*.mjs` 依赖的那几个语义（派发即移除、定向投递、长轮询唤醒、只读探针）。
 *
 * 用法：
 *   node scripts/check-bridge-relay.mjs
 *
 * 退出码：0 全部通过；1 有失败。
 */
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const SERVE = resolve(ROOT, 'packages', 'editor', 'bin', 'serve.mjs');

let total = 0;
let failed = 0;

/**
 * 记一条判据。
 *
 * @param {string} title 判据
 * @param {boolean} condition 是否通过
 * @param {string} detail 附加说明
 */
function check(title, condition, detail = '')
{
    total++;
    if (condition) console.log(`  PASS  ${title}${detail ? ` — ${detail}` : ''}`);
    else { failed++; console.log(`  FAIL  ${title}${detail ? ` — ${detail}` : ''}`); }
}

/**
 * 起一个宿主进程并等它报出地址。
 *
 * @returns {Promise<{ child: import('node:child_process').ChildProcess, base: string, token: string }>} 进程、地址与一次性 token
 */
async function startHost()
{
    const child = spawn(process.execPath, [SERVE, '--port', '0', '--root', resolve(ROOT, 'packages', 'editor')], {
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';

    child.stdout.on('data', (chunk) => { out += chunk; });

    const base = await new Promise((resolve_) =>
    {
        const deadline = Date.now() + 20000;
        const tick = setInterval(() =>
        {
            const matched = /已启动：(http:\/\/127\.0\.0\.1:\d+\/)/.exec(out);

            if (matched) { clearInterval(tick); resolve_(matched[1]); }
            else if (Date.now() > deadline) { clearInterval(tick); resolve_(''); }
        }, 100);
    });

    // 一次性 token（#273 P2 / D9）：本脚本**扮演页面**，页面侧端点要带它。
    // 从宿主 stdout 里读——真实页面那条路是**注入**（`bootScript`），这里只做等价的事
    return { child, base, token: /桥接一次性 token：([A-Za-z0-9_-]+)/.exec(out)?.[1] ?? '' };
}

const { child, base, token: bridgeToken } = await startHost();

if (!base)
{
    console.error('❌ 宿主没能启动，协议验收无法进行');
    process.exit(1);
}

console.log(`[桥接中继] 宿主 ${base}`);

/**
 * 发一个桥接请求。
 *
 * @param {string} path 路径（含 query）
 * @param {{ method?: string, body?: object }} [options] 选项
 * @returns {Promise<{ status: number, body: any }>} 状态码与响应体
 */
async function request(path, options = {})
{
    const response = await fetch(new URL(path, base), {
        method: options.method ?? 'GET',
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(bridgeToken ? { 'x-editor-bridge-token': bridgeToken } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    return { status: response.status, body: await response.json() };
}

// ---------- 判据 1：只读探针（调用方用它探测服务端端口） ----------
const ping = await request('/__editor-bridge/ping');

check('GET /ping 可用且是只读探针（不派发任务）',
    ping.status === 200 && ping.body.ok === true && ping.body.name === 'feng3d-editor-bridge',
    `name=${ping.body.name}`);
check('ping 报出在线页面与"同名多开"字段', Array.isArray(ping.body.clients) && Array.isArray(ping.body.duplicated));

// ---------- 判据 2：完整往返（调用方 → 页面 → 调用方） ----------
const call = await request('/__editor-bridge/call', { method: 'POST', body: { method: 'editor.info', params: {} } });

check('POST /call 入队并返回 id', call.status === 200 && typeof call.body.id === 'string', `id=${call.body.id}`);

const pending = await request('/__editor-bridge/pending?clientId=relay-check');

check('GET /pending 取到刚入队的任务',
    pending.status === 200 && pending.body.requests.some((r) => r.id === call.body.id && r.method === 'editor.info'),
    `requests=${pending.body.requests.length}`);

const pendingAgain = await request('/__editor-bridge/pending?clientId=relay-check');

check('派发即移除（一次性语义，再取就没了）',
    !pendingAgain.body.requests.some((r) => r.id === call.body.id));

const posted = await request('/__editor-bridge/result', {
    method: 'POST',
    body: { id: call.body.id, ok: true, result: { version: '0.6.0' } },
});

check('POST /result 回传成功', posted.status === 200 && posted.body.received === true);

const got = await request(`/__editor-bridge/result?id=${encodeURIComponent(call.body.id)}`);

check('GET /result 取到页面回传的结果',
    got.status === 200 && got.body.ok === true && got.body.result?.version === '0.6.0',
    JSON.stringify(got.body.result));

// ---------- 判据 3：长轮询会被唤醒（而不是等满 20s） ----------
const slowCall = await request('/__editor-bridge/call', { method: 'POST', body: { method: 'scene.stats' } });
const started = Date.now();
const waiting = request(`/__editor-bridge/result?id=${encodeURIComponent(slowCall.body.id)}`);

// 稍后回传：长轮询应当在这之后很快被唤醒
await new Promise((resolve_) => setTimeout(resolve_, 300));
await request('/__editor-bridge/result', { method: 'POST', body: { id: slowCall.body.id, ok: true, result: { objects: 3 } } });
const woken = await waiting;
const waitedMs = Date.now() - started;

check('长轮询被回传唤醒（不是等满 20s 超时）',
    woken.body.ok === true && woken.body.result?.objects === 3 && waitedMs < 5000,
    `等待 ${waitedMs}ms`);

// ---------- 判据 4：定向投递（target） ----------
const targeted = await request('/__editor-bridge/call', {
    method: 'POST',
    body: { method: 'view.probe', target: 'page-a' },
});

const forB = await request('/__editor-bridge/pending?clientId=page-b');
const forA = await request('/__editor-bridge/pending?clientId=page-a');

check('定向投递：指定 target 的请求不会被别的页面取走',
    !forB.body.requests.some((r) => r.id === targeted.body.id));
check('定向投递：目标页面能取到', forA.body.requests.some((r) => r.id === targeted.body.id));

// ---------- 判据 5：错误路径 ----------
const unknown = await request('/__editor-bridge/not-a-route');
const noMethod = await request('/__editor-bridge/call', { method: 'POST', body: {} });
const noId = await request('/__editor-bridge/result');

check('未知路由回 404（而不是静默当静态文件）', unknown.status === 404, `status=${unknown.status}`);
check('POST /call 缺 method 回 400', noMethod.status === 400, `status=${noMethod.status}`);
check('GET /result 缺 id 回 400', noId.status === 400, `status=${noId.status}`);

// ---------- 判据 6：非桥接请求仍然走静态资源（中继没把静态服务吃掉） ----------
const staticResponse = await fetch(new URL('index.html', base));

check('非桥接路由仍走静态资源（中继只接管自己那一段）',
    staticResponse.status === 200 && (staticResponse.headers.get('content-type') ?? '').includes('text/html'),
    `GET index.html → ${staticResponse.status}`);

// ---------- 收尾 ----------
child.kill();

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 桥接中继协议验收未通过——15 个 editor-*.mjs 都建立在这套协议上，不能让它们悄悄失配。');
    process.exit(1);
}

console.log('✅ 桥接中继协议验收通过：宿主用同一套协议提供通道（dev 与生产一致）');
