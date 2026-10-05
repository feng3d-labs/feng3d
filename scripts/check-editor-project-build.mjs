#!/usr/bin/env node
/**
 * **项目构建宿主方法**的验收（#277 的宿主半：`host.build.*`）。
 *
 * ## 它守什么
 *
 * D12 的形态是"游戏项目 = 标准 npm 工程，构建在编辑器中执行"，而且项目要能**脱离编辑器独立构建**
 * ——所以"**编辑器关着也能构建**"不是锦上添花，是这条决策的地基。这个脚本起真宿主、
 * **不打开任何页面**，直接在项目里跑它自己的 `npm run build`。
 *
 * 判据里最要紧的是**"失败如实"**：非 0 退出码必须原样回来，并带上项目自己的错误输出。
 * 这正是 #271 那三条断链路里"编译失败仍弹「编译完成！」"的教训——同一个坑不该踩第二遍。
 *
 * 另有两条：
 *
 * - **同一项目同时只跑一个**（两个 `npm run build` 一起写 `dist/`，产出没法解释）；
 * - 构建输出**推给页面**（`{type:'event', name:'build/output'}`）——长任务的过程要看得见。
 *
 * 用法：
 *   node scripts/check-editor-project-build.mjs
 *
 * 退出码：0 全部通过；1 有失败。
 */
import { spawn } from 'node:child_process';
// 协议版本**单一来源**（与服务端/页面共用同一个常量）
import { BRIDGE_PROTOCOL_VERSION } from '../packages/editor/bridge/protocol.mjs';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { WebSocket } from 'ws';

const SERVE = resolve(process.cwd(), 'packages', 'editor', 'bin', 'serve.mjs');

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

console.log('[项目构建] #277：编辑器关着也能构建，且**失败如实**');

// ---------- 造一个真项目（自己的 build / boom 脚本） ----------
const dir = mkdtempSync(join(tmpdir(), 'feng3d-project-build-'));
const root = join(dir, 'static');
const project = join(dir, 'project');

mkdirSync(root, { recursive: true });
mkdirSync(project, { recursive: true });
writeFileSync(join(root, 'index.html'), '<html><head></head><body></body></html>', 'utf8');

writeFileSync(join(project, 'build.js'), 'console.log("built-ok");\n', 'utf8');
writeFileSync(join(project, 'boom.js'), 'console.error("炸了");\nprocess.exit(2);\n', 'utf8');
writeFileSync(join(project, 'slow.js'), 'setTimeout(() => console.log("slow-done"), 1500);\n', 'utf8');
// 判"取消"要用一个**跑得够久**的脚本：`slow` 只 1.5 秒，取消时它可能已经自己跑完了，
// 那样判据会时灵时不灵。这个睡 30 秒——只有真被终止才可能提前结束。
writeFileSync(join(project, 'cancel.js'), 'setTimeout(() => console.log("cancel-done"), 30000);\n', 'utf8');
writeFileSync(join(project, 'package.json'), JSON.stringify({
    name: 'demo-project',
    version: '1.0.0',
    scripts: { build: 'node build.js', boom: 'node boom.js', slow: 'node slow.js', cancel: 'node cancel.js' },
}, null, 4), 'utf8');

const host = spawn(process.execPath, [SERVE, '--port', '0', '--root', root, '--project', project], {
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

check('宿主注册了构建类宿主方法', /host\.build\.run/.test(hostLog) && /host\.build\.cancel/.test(hostLog),
    hostLog.split('\n').find((line) => line.includes('宿主方法'))?.trim() ?? '');

/**
 * 调一个宿主方法（调用方的老办法）。
 *
 * @param {string} method 方法名
 * @param {object} [params] 参数
 * @returns {Promise<object>} 结果载荷
 */
async function call(method, params = {})
{
    const response = await fetch(`${base}/__editor-bridge/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, params }),
    });
    const body = await response.json();

    if (!response.ok) return { ok: false, error: body.error };

    return await (await fetch(`${base}/__editor-bridge/result?id=${body.id}`)).json();
}

// ---------- 判据 1：跑得起来、成功如实 ----------
const built = await call('host.build.run', { script: 'build' });

check('**编辑器关着也能构建**（脚本压根没打开页面）', built.ok === true && built.result?.code === 0,
    JSON.stringify(built.result ?? built.error));
check('拿到了项目自己的输出', (built.result?.output ?? []).some((line) => line.includes('built-ok')),
    JSON.stringify(built.result?.output));

// ---------- 判据 2：失败如实（本项目最要紧的一条） ----------
const boom = await call('host.build.run', { script: 'boom' });

check('**失败如实**：非 0 退出码照原样回（不是"跑挂了还说成功"）',
    boom.ok === true && boom.result?.code === 2 && boom.result?.ok === false,
    JSON.stringify(boom.result ?? boom.error));
check('失败时带回项目自己的错误输出', (boom.result?.output ?? []).some((line) => line.includes('炸了')),
    JSON.stringify(boom.result?.output));

// ---------- 判据 3：状态可查 ----------
const status = await call('host.build.status');

check('能查构建状态（空闲）', status.ok === true && status.result?.running === false,
    JSON.stringify(status.result));

// ---------- 判据 3b：同一项目同时只跑一个 ----------
// 两个 `npm run build` 一起写同一个 dist/，产出是没法解释的混合体——宁可直接拒绝
const first = call('host.build.run', { script: 'slow' });
const second = new Promise((resolve_) => setTimeout(resolve_, 500))
    .then(() => call('host.build.run', { script: 'slow' }));
const [firstResult, secondResult] = await Promise.all([first, second]);

check('**同一项目同时只跑一个构建**（第二个被明确拒绝、并说清原因）',
    firstResult.ok === true && firstResult.result?.code === 0
    && secondResult.ok === false && /已有构建在跑/.test(secondResult.error ?? ''),
    `第一个 code=${firstResult.result?.code}；第二个=${secondResult.error ?? secondResult.result?.code}`);

// ---------- 判据 3c：调用方发起的取消真的能停掉构建（#273 长任务） ----------
//
// **判"真的停了"看的是"'run' 的 Promise 何时 settle"**：那个 Promise 等的是子进程的
// 'close' 事件，所以"几秒内 settle 了"就**等价于**"进程真的结束了"——
// 比读日志、比查 'status' 都硬（后者只说明服务自己以为结束了）。
const longRun = call('host.build.run', { script: 'cancel' });

// 等它真的起来（'status.running' 变 true），而不是靠固定 sleep 赌时序
const startedBy = Date.now();

while (!(await call('host.build.status')).result?.running && Date.now() - startedBy < 10000)
{
    await new Promise((resolve_) => setTimeout(resolve_, 100));
}

const cancelResult = await call('host.build.cancel');
const settled = await Promise.race([
    longRun.then(() => 'settled'),
    new Promise((resolve_) => setTimeout(() => resolve_('timeout'), 5000)),
]);
const longResult = settled === 'settled' ? await longRun : null;

check('**取消是调用方发起的**（host.build.cancel 报告取消到了）',
    cancelResult.ok === true && cancelResult.result?.cancelled === true, JSON.stringify(cancelResult));
check('**取消真的停掉了构建**（30 秒的脚本，run 的 Promise 在 5 秒内 settle = 进程真的结束了）',
    settled === 'settled', 'settled=' + settled);
check('结果里标出了"被取消"（与"项目自己报错"区分开）',
    longResult?.result?.cancelled === true && longResult?.result?.code === -2, JSON.stringify(longResult));
check('取消之后状态回到空闲（能再起下一次构建）',
    (await call('host.build.status')).result?.running === false);
check('空闲时取消不会假装成功（cancelled: false）',
    (await call('host.build.cancel')).result?.cancelled === false);

// ---------- 判据 4：构建输出**推给页面** ----------
// 一次性 token（#273 P2 / D9）：下面的 WS 客户端**扮演页面**，所以握手要带上它。
// 从宿主 stdout 里读——真实页面那条路是**注入**（`bootScript`），这里只做等价的事。
const bridgeToken = /桥接一次性 token：([A-Za-z0-9_-]+)/.exec(hostLog)?.[1] ?? '';
const socket = new WebSocket(`${base.replace('http://', 'ws://')}/__editor-bridge/ws?token=${encodeURIComponent(bridgeToken)}`);
const events = [];

socket.on('message', (raw) =>
{
    try
    {
        const message = JSON.parse(raw.toString());

        if (message.type === 'event' && message.name === 'build/output') events.push(message.payload);
    }
    catch { /* 忽略坏帧 */ }
});

await new Promise((resolve_) => { socket.once('open', resolve_); setTimeout(resolve_, 3000); });
socket.send(JSON.stringify({ type: 'hello', clientId: 'build-watcher', apiVersion: BRIDGE_PROTOCOL_VERSION }));
await new Promise((resolve_) => setTimeout(resolve_, 200));

await call('host.build.run', { script: 'build' });

check('**构建输出被推给页面**（长任务过程可见）',
    events.some((payload) => typeof payload?.line === 'string' && payload.line.includes('built-ok')),
    JSON.stringify(events.slice(0, 3)));

// ---------- 收尾 ----------
socket.close();
host.kill();
rmSync(dir, { recursive: true, force: true });

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 项目构建宿主方法未通过——"失败如实"是 #271 的教训，不能在这里重演。');
    process.exit(1);
}

console.log('✅ 项目构建宿主方法通过：编辑器关着能构建、失败如实、输出能推给页面');
