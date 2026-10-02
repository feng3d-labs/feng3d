#!/usr/bin/env node
/**
 * 桥接 **WebSocket 通道**的协议级验收（#273 第二阶段）。
 *
 * ## 它守的三件事
 *
 * 1. **推送，而不是轮询**：页面连上后，调用方一发起调用，页面就**立刻收到**任务推送——
 *    不需要它去问（HTTP 通道靠每秒 10 次的长轮询，这条通道的意义就在这儿）；
 * 2. **两条通道共用同一份命令层**：`HTTP 调用 → WS 页面响应` 与 `WS 调用 → HTTP 页面取任务`
 *    都能跑通。若各写一份实现，这种交叉用例立刻会露馅；
 * 3. **坏输入不断连接**：一条坏帧只回错误，页面不该因此掉线。
 *
 * 另有：定向投递（`target`）、`ping/pong` 探活、以及**HTTP 通道照旧可用**（现有 15 个
 * `scripts/editor-*.mjs` 零改动的前提）。
 *
 * 用法：
 *   node scripts/check-bridge-socket.mjs
 *
 * 退出码：0 全部通过；1 有失败。
 */
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { WebSocket } from 'ws';

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
 * 连一个 WebSocket 客户端（带"等某条消息"的便利）。
 *
 * @param {string} url 地址
 * @returns {Promise<object>} 客户端句柄
 */
async function connect(url)
{
    const ws = new WebSocket(url);
    const messages = [];
    const waiters = [];

    ws.on('message', (raw) =>
    {
        let parsed;

        try
        {
            parsed = JSON.parse(raw.toString());
        }
        catch
        {
            return;
        }

        messages.push(parsed);
        for (const waiter of [...waiters]) waiter(parsed);
    });

    await new Promise((resolve_, reject) =>
    {
        ws.once('open', resolve_);
        ws.once('error', reject);
    });

    return {
        ws,
        messages,

        /**
         * 发一条消息。
         *
         * @param {object} message 消息
         */
        send(message)
        {
            ws.send(JSON.stringify(message));
        },

        /**
         * 等一条满足条件的消息（先看已收到的）。
         *
         * @param {(m: object) => boolean} predicate 条件
         * @param {number} timeoutMs 超时
         * @returns {Promise<object>} 命中的消息
         */
        async wait(predicate, timeoutMs = 8000)
        {
            const existing = messages.find(predicate);

            if (existing) return existing;

            return await new Promise((resolve_, reject) =>
            {
                const timer = setTimeout(() => reject(new Error(`等待消息超时（${timeoutMs}ms）`)), timeoutMs);
                const onMessage = (message) =>
                {
                    if (!predicate(message)) return;

                    clearTimeout(timer);
                    waiters.splice(waiters.indexOf(onMessage), 1);
                    resolve_(message);
                };

                waiters.push(onMessage);
            });
        },

        /** 关闭连接 */
        close()
        {
            ws.close();
        },
    };
}

// ---------- 起真宿主 ----------
const host = spawn(process.execPath, [SERVE, '--port', '0', '--root', resolve(ROOT, 'packages', 'editor')], {
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

const wsUrl = `${base.replace('http://', 'ws://')}/__editor-bridge/ws`;

console.log(`[WebSocket 通道] ${wsUrl}`);

// ---------- 判据 1：页面连上并自报身份 ----------
const page = await connect(wsUrl);

check('页面能连上 WebSocket 通道', page.ws.readyState === WebSocket.OPEN);

// 连上时服务端先发一条 hello-ack（不要求先自报身份）
const ack = page.messages.find((m) => m.type === 'hello-ack')
    ?? await page.wait((m) => m.type === 'hello-ack').catch(() => null);

check('连上即收到 hello-ack', ack !== null);

page.send({ type: 'hello', clientId: 'page-a' });

const ack2 = await page.wait((m) => m.type === 'hello-ack' && m.clientId === 'page-a').catch(() => null);

check('页面自报身份后收到带 clientId 的应答', ack2?.clientId === 'page-a', JSON.stringify(ack2));

// ---------- 判据 2：**推送**而不是轮询 ----------
const caller = await connect(wsUrl);

caller.send({ type: 'call', reqId: 'r1', method: 'scene.getTree', params: {} });

const pushed = await page.wait((m) => m.type === 'task' && m.task.method === 'scene.getTree').catch(() => null);

check('**调用方一发起，页面就被推送到任务**（不是靠页面轮询）', pushed !== null,
    pushed ? `task.id=${pushed.task.id}` : '没收到推送');

// 推送即派发：推出去的任务必须从待执行里取走，否则同一条任务会经 HTTP 轮询再跑一遍
const afterPush = await fetch(`${base}/__editor-bridge/pending?clientId=page-a`).then((res) => res.json());

check('**推送即派发**：被推送过的任务不会在 HTTP 轮询里再出现（否则写操作会跑两遍）',
    !afterPush.requests?.some((r) => r.id === pushed?.task.id),
    JSON.stringify(afterPush.requests?.map((r) => r.id)));

// ---------- 判据 3：页面回结果 → 调用方收到 ----------
page.send({ type: 'result', id: pushed?.task.id, ok: true, result: { nodes: 3 } });

const resultBack = await caller.wait((m) => m.type === 'result' && m.reqId === 'r1').catch(() => null);

check('页面回传后，调用方在 WebSocket 上收到结果', resultBack?.result?.nodes === 3,
    JSON.stringify(resultBack));

// ---------- 判据 4：定向投递 ----------
const pageB = await connect(wsUrl);

pageB.send({ type: 'hello', clientId: 'page-b' });
await new Promise((resolve_) => setTimeout(resolve_, 100));

caller.send({ type: 'call', reqId: 'r2', method: 'onlyForB', target: 'page-b' });

const gotB = await pageB.wait((m) => m.type === 'task' && m.task.method === 'onlyForB').catch(() => null);
const gotA = page.messages.some((m) => m.type === 'task' && m.task.method === 'onlyForB');

check('定向投递：目标页面收到', gotB !== null);
check('定向投递：别的页面**没有**收到', !gotA);

pageB.send({ type: 'result', id: gotB?.task.id, ok: true, result: 'b-done' });
await caller.wait((m) => m.type === 'result' && m.reqId === 'r2');

// ---------- 判据 5：跨通道共用命令层（HTTP 调用 → WS 页面响应） ----------
const httpCall = await fetch(`${base}/__editor-bridge/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: 'fromHttpCaller' }),
}).then((res) => res.json());

const pushedForHttp = await page.wait((m) => m.type === 'task' && m.task.id === httpCall.id).catch(() => null);

check('**HTTP 调用也能推给 WS 页面**（两条通道共用同一份命令层）', pushedForHttp !== null,
    `http id=${httpCall.id}`);

page.send({ type: 'result', id: httpCall.id, ok: true, result: 'answered-over-ws' });

const httpResult = await fetch(`${base}/__editor-bridge/result?id=${httpCall.id}`).then((res) => res.json());

check('WS 页面回的结果，HTTP 调用方取得到（反向也通）', httpResult.result === 'answered-over-ws',
    JSON.stringify(httpResult));

// ---------- 判据 6：HTTP 页面照旧可用（现有工具链零改动的前提） ----------
// 定向投递给"HTTP 轮询页面"（clientId=legacy）：在线的 WS 页面不匹配，任务于是留在
// 待执行队列里——正好用来验证**旧链路没被换掉**（若被 WS 抢走，这条判据就会假失败）
const httpCall2 = await fetch(`${base}/__editor-bridge/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: 'legacyPolling', target: 'legacy' }),
}).then((res) => res.json());

const polled = await fetch(`${base}/__editor-bridge/pending?clientId=legacy`).then((res) => res.json());

check('HTTP 轮询页面照旧能取到任务（旧链路没被换掉）',
    polled.requests?.some((r) => r.id === httpCall2.id), JSON.stringify(polled.requests?.map((r) => r.method)));

await fetch(`${base}/__editor-bridge/result`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: httpCall2.id, ok: true, result: 'legacy-done' }),
});

// ---------- 判据 6b：/ping 能看到 WS 页面 ----------
// 它是"现在有没有页面能干活"的权威答案（CLI / MCP / e2e 都靠它决定要不要投递）
const pingHttp = await fetch(`${base}/__editor-bridge/ping`).then((res) => res.json());

check('`/ping` 能看到 WS 页面（否则调用方会误判"没人接"）',
    pingHttp.clients?.some((c) => c.clientId === 'page-a' && c.transport === 'websocket'),
    JSON.stringify(pingHttp.clients?.map((c) => `${c.clientId}@${c.transport ?? 'http'}`)));

// ---------- 判据 7：探活 ----------
caller.send({ type: 'ping', reqId: 'p' });

const pong = await caller.wait((m) => m.type === 'pong').catch(() => null);

check('ping → pong（带在线页面与待执行数）', pong !== null, JSON.stringify({ clients: pong?.clients?.length, pending: pong?.pending }));

// ---------- 判据 8：坏输入只回错误、不断连接 ----------
page.ws.send('这不是 JSON');

const badJson = await page.wait((m) => m.type === 'error').catch(() => null);

check('坏 JSON 回错误', badJson !== null, badJson?.message);

page.send({ type: 'definitely-not-a-type' });

const badType = await page.wait((m) => m.type === 'error' && /未知消息类型/.test(m.message ?? '')).catch(() => null);

check('未知消息类型回错误', badType !== null);

caller.send({ type: 'ping', reqId: 'p2' });

const stillAlive = await caller.wait((m) => m.type === 'pong' && m !== pong).catch(() => null);

check('坏输入之后连接**仍然可用**（不断连接）', stillAlive !== null);

// ---------- 判据 9：先有调用、后有页面（积压不丢） ----------
caller.send({ type: 'call', reqId: 'r-late', method: 'beforePageJoined', target: 'page-late' });

const late = await connect(wsUrl);

late.send({ type: 'hello', clientId: 'page-late' });

const backlog = await late.wait((m) => m.type === 'tasks' && m.tasks.some((t) => t.method === 'beforePageJoined'))
    .catch(() => null);

check('页面连上时收到**积压**的任务（先有调用、后有页面不能丢）', backlog !== null,
    JSON.stringify(backlog?.tasks?.map((t) => t.method)));

late.send({ type: 'result', id: backlog?.tasks?.[0]?.id, ok: true, result: 'late-done' });

const lateResult = await caller.wait((m) => m.type === 'result' && m.reqId === 'r-late').catch(() => null);

check('积压任务的结果也推得回调用方', lateResult?.result === 'late-done');

late.close();

// ---------- 收尾 ----------
page.close();
pageB.close();
caller.close();
host.kill();

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ WebSocket 通道未通过——"推送"是这条通道存在的理由，不能只在注释里成立。');
    process.exit(1);
}

console.log('✅ WebSocket 通道通过：页面被推送、两条通道共用命令层、旧 HTTP 链路照旧可用');
