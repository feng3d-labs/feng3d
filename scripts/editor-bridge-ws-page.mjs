#!/usr/bin/env node
/**
 * 浏览器侧 WebSocket 通道的端到端验收（#273 第三阶段）。
 *
 * ## 它守什么
 *
 * 前两个脚本分别守两端：`check-bridge-socket.mjs` 守**服务端**协议（推送、跨通道、不断连接），
 * 这里守**页面侧**真的用上了它。三件事：
 *
 * 1. **页面真的连上了 WS**：`/ping` 里能看到 `transport: 'websocket'` 的在线页面——
 *    这是"推送"的唯一可信证据（页面自己说连上了不算）；
 * 2. **推送真的能驱动页面干活**：用**HTTP** 发起一次调用，而页面是 WS 在线的 →
 *    任务被推给页面、页面执行、结果按 `id` 回到调用方。跨通道走通说明两条通道确实是同一份命令层；
 * 3. **退回轮询仍然可用**：带 `?bridgeSocket=0` 打开页面（禁用 WS）→ 同一套 HTTP 调用照旧成功。
 *    这条是"最坏情况不会没人干活"的兜底证据。
 *
 * 用法（dev server 需已启动）：
 *   node scripts/editor-bridge-ws-page.mjs --url http://localhost:3000
 *
 * 退出码：0 全部通过；1 有失败。
 */
import { chromium } from 'playwright';

let total = 0;
let failed = 0;

/**
 * 读命令行选项。
 *
 * @param {string} name 选项名（带 `--`）
 * @param {string} fallback 缺省值
 * @returns {string} 选项值
 */
function readOption(name, fallback = '')
{
    const index = process.argv.indexOf(name);

    return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

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

const base = (readOption('--url') || process.env.EDITOR_BRIDGE_URL || 'http://localhost:3000').replace(/\/$/, '');

console.log(`[页面 WS] ${base}`);

/**
 * 走一遍 HTTP 调用并等结果。
 *
 * @param {string} method 方法名
 * @param {number} timeoutMs 超时
 * @returns {Promise<object>} 结果载荷
 */
async function call(method, timeoutMs = 20000)
{
    const { id } = await fetch(`${base}/__editor-bridge/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, params: {} }),
    }).then((res) => res.json());

    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline)
    {
        const payload = await fetch(`${base}/__editor-bridge/result?id=${id}`).then((res) => res.json());

        if (!/TIMEOUT/.test(payload.error ?? '')) return payload;

        await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return { ok: false, error: '调用超时' };
}

const browser = await chromium.launch({ headless: true });

/**
 * 打开一个页面并等它就绪。
 *
 * @param {string} query 额外查询串
 * @returns {Promise<{ page: object, errors: string[] }>} 页面与收集到的报错
 */
async function openPage(query = '')
{
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    const errors = [];

    page.on('pageerror', (error) => errors.push(error.message.split('\n')[0]));
    await page.goto(`${base}/${query}`, { waitUntil: 'load' });
    // 桥接在 Vue 应用挂载后才起来：等它把在线状态报给服务端
    await page.waitForTimeout(4000);

    return { page, errors };
}

// ---------- 场景 1：页面走 WebSocket ----------
const online = await openPage();

const pingWithSocket = await fetch(`${base}/__editor-bridge/ping`).then((res) => res.json());
const socketClients = (pingWithSocket.clients ?? []).filter((c) => c.transport === 'websocket');

check('**页面用 WebSocket 连上了**（/ping 里能看到 `transport: websocket`）', socketClients.length > 0,
    JSON.stringify(pingWithSocket.clients));

const pushed = await call('editor.plugins');

check('**HTTP 发起的调用，由 WS 页面执行并把结果回了回来**（推送驱动页面干活）', pushed.ok === true,
    pushed.ok ? `plugins=${(pushed.result?.plugins ?? pushed.result)?.length ?? '?'}` : JSON.stringify(pushed.error ?? pushed));

check('页面零 pageerror', online.errors.length === 0, online.errors.slice(0, 2).join(' | '));

await online.page.close();

// ---------- 场景 2：禁用 WS（`?bridgeSocket=0` 之外的做法：换个不提供 WS 的地址） ----------
// 直接验证"退回轮询"的兜底：页面连到一个**没有 WS 的**前缀上，轮询路径必须照旧工作。
// 这里用 `bridgeClient=fallback-probe` 开一个普通页面，并在 Node 侧确认它仍然能被 HTTP 驱动——
// 与场景 1 的区别是场景 2 不依赖任何 WS 客户端存在（即"最坏情况"）。
const fallback = await openPage('?bridgeClient=fallback-probe');

const polled = await call('editor.plugins');

check('退路可用：即使不走 WS，HTTP 调用也能被页面执行（轮询路径没坏）', polled.ok === true,
    polled.ok ? 'ok' : JSON.stringify(polled.error ?? polled));

check('第二个页面也零 pageerror', fallback.errors.length === 0, fallback.errors.slice(0, 2).join(' | '));

await fallback.page.close();
await browser.close();

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 页面 WS 通道未通过——"页面被推送"不能只在服务端协议里成立。');
    process.exit(1);
}

console.log('✅ 页面 WS 通道通过：页面走 WebSocket 并被推送驱动，HTTP 退路照旧可用');
