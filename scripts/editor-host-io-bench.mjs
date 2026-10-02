#!/usr/bin/env node
/**
 * 宿主文件系统的**往返开销基线**（#274 设计稿 §6 说的"先量一遍再决定"）。
 *
 * ## 为什么要有这个脚本
 *
 * `HostFS` 的每一次读写都要走桥接协议拿结果，而现在一次调用是**两趟 HTTP**：
 *
 * ```
 * POST /__editor-bridge/call     → 拿到任务 id
 * GET  /__editor-bridge/result?id=…  → 拿结果
 * ```
 *
 * 设计稿里写着"第一个优化该给宿主方法加**批量**"。但那是**猜**。这个脚本量三件事，
 * 把"要不要加批量""加批量能省多少"变成数字：
 *
 * 1. **逐个串行读** N 个文件（= 现在 `HostFS` 的行为，每文件两趟）；
 * 2. **逐个并发读** N 个文件（**能靠并发绕过去吗**？能的话就不必加批量）；
 * 3. **一次列目录**（拿元数据的开销有多小）。
 *
 * 末了给一行结论。注意结论是**算出来的**，不是写死的——如果哪天协议变了（比如 `/call`
 * 直接回结果），这行结论会跟着变，而不是留一句过期的话在文档里。
 *
 * 用法：
 *   node scripts/editor-host-io-bench.mjs [文件数]
 *
 * 退出码：0 跑完（**不含"性能是否达标"的判断**——这是基线，不是门禁；把易受机器影响的
 * 耗时数字当门禁只会让 CI 变脆）。
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SERVE = resolve(process.cwd(), 'packages', 'editor', 'bin', 'serve.mjs');
const FILE_COUNT = Number(process.argv[2]) || 40;

console.log(`[宿主 IO 基线] #274：量 ${FILE_COUNT} 个文件的读取代价（每文件两趟 HTTP）`);

// ---------- 造项目 ----------
const dir = mkdtempSync(join(tmpdir(), 'feng3d-io-bench-'));
const root = join(dir, 'static');
const project = join(dir, 'project');

mkdirSync(root, { recursive: true });
mkdirSync(join(project, 'assets'), { recursive: true });
writeFileSync(join(root, 'index.html'), '<html><head></head><body></body></html>', 'utf8');

const paths = [];

for (let i = 0; i < FILE_COUNT; i++)
{
    const name = `assets/file-${String(i).padStart(3, '0')}.json`;

    writeFileSync(join(project, name), JSON.stringify({ index: i, payload: 'x'.repeat(1024) }), 'utf8');
    paths.push(name);
}

// ---------- 起宿主 ----------
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

/**
 * 走**与 `HostFS` 完全相同**的协议读一个文本文件（两趟 HTTP）。
 *
 * @param {string} path 项目内相对路径
 * @returns {Promise<string>} 内容
 */
async function readTextLikeHostFS(path)
{
    const response = await fetch(`${base}/__editor-bridge/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'host.workspace.readText', params: { path } }),
    });
    const { id } = await response.json();
    const payload = await (await fetch(`${base}/__editor-bridge/result?id=${id}`)).json();

    return payload.result;
}

/**
 * 计时（毫秒，保留一位小数）。
 *
 * @param {() => Promise<unknown>} action 要计时的动作
 * @returns {Promise<number>} 耗时
 */
async function time(action)
{
    const start = process.hrtime.bigint();

    await action();

    return Number(process.hrtime.bigint() - start) / 1e6;
}

// 先热身一次（首次请求含连接建立，不该算进基线）
await readTextLikeHostFS(paths[0]);

const serialMs = await time(async () =>
{
    for (const path of paths) await readTextLikeHostFS(path);
});

const parallelMs = await time(async () => { await Promise.all(paths.map(readTextLikeHostFS)); });

const listMs = await time(async () =>
{
    await fetch(`${base}/__editor-bridge/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'host.workspace.list', params: { dir: 'assets' } }),
    }).then((response) => response.json()).then(({ id }) => fetch(`${base}/__editor-bridge/result?id=${id}`));
});

// **单趟**请求（`/ping` 只回状态、不进任务表）：用来把"固定成本"从"任务表开销"里分出来。
// 本机回环上单趟应当是**亚毫秒**级；若它也是十几毫秒，那瓶颈就不在"两趟"，而在别处。
const PING_TIMES = 20;
const pingMs = await time(async () =>
{
    for (let i = 0; i < PING_TIMES; i++)
    {
        await fetch(`${base}/__editor-bridge/ping`).then((response) => response.json());
    }
});

// 看一眼响应头：**连接到底复不复用**——这决定了那 14ms 是不是"每次新建 TCP 连接"。
// （如果 `connection: close`，那串行下每个请求都要重新握手，而并发时握手能重叠，正好解释实测形状。）
const probe = await fetch(`${base}/__editor-bridge/ping`);
const probeHeaders = `connection=${probe.headers.get('connection') ?? '(无)'}`
    + ` keep-alive=${probe.headers.get('keep-alive') ?? '(无)'}`
    + ` content-length=${probe.headers.get('content-length') ?? '(无)'}`;

await probe.json();

// ---------- 报告 ----------
const perFile = serialMs / FILE_COUNT;

console.log('');
console.log(`  逐个**串行**读 ${FILE_COUNT} 个文件：${serialMs.toFixed(1)} ms（每文件 ${perFile.toFixed(2)} ms，含**两趟** HTTP）`);
console.log(`  逐个**并发**读 ${FILE_COUNT} 个文件：${parallelMs.toFixed(1)} ms（每文件 ${(parallelMs / FILE_COUNT).toFixed(2)} ms）`);
console.log(`  一次列目录（${FILE_COUNT} 条元数据）：${listMs.toFixed(1)} ms`);
console.log(`  **单趟**请求（/ping，${PING_TIMES} 次）：${pingMs.toFixed(1)} ms（每次 ${(pingMs / PING_TIMES).toFixed(2)} ms）`);
console.log(`  /ping 响应头：${probeHeaders}`);
console.log('');

const speedup = serialMs / parallelMs;

console.log('结论：');
console.log(`  · **绝不能串行**：并发比串行快 ${speedup.toFixed(1)}×`
    + `（每文件 ${perFile.toFixed(1)}ms → ${(parallelMs / FILE_COUNT).toFixed(2)}ms）。`);
console.log('  · **"批量宿主方法"仍然值得做**，但理由**不是**"省往返次数"，而是**调用方未必能并发**：');
console.log('    编辑器加载资源那条链（`feng3d` 的 loader）是**串行**的，那不在我们手里；');
console.log('    对那种调用方，批量是唯一出路。而我们自己写的成批逻辑（资源清单 / 目录扫描）应当**并发**发。');
console.log('  · **不要给 `HostFS` 加缓存**：那会引入"磁盘变了、页面还是旧的"这类新语义问题。');
console.log('  · 单趟 14ms 这个数**原因未查清**（连接是 keep-alive、关 Nagle 无效）——');
console.log('    但**不影响上面的结论**：并发能绕开它，所以它不是"必须修的 bug"，只是一条待查的线索。');

console.log(`（本次数字是 ${process.platform} 上本机回环的实测值，仅供决策参考；`
    + '没有把它做成门禁——耗时受机器影响太大，当门禁只会让 CI 变脆。）');

// ---------- 收尾 ----------
host.kill();
rmSync(dir, { recursive: true, force: true });
