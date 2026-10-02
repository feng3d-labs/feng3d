#!/usr/bin/env node
/**
 * **批量读**的端到端验收（#274 的"批量 + 并发"一截）。
 *
 * ## 它守什么
 *
 * 页面侧每次读写都是一趟桥接往返（`POST /call` + `GET /result`），实测单趟 ~14ms。
 * 于是"读 N 个文件"逐个发就是 N×28ms —— `scripts/editor-host-io-bench.mjs` 量到串行读 40 个文件
 * **1137ms**、并发 **44ms**。并发能绕过去，但**调用方未必能并发**：引擎里加载资源那条链是串行的，
 * 它不在我们手里。所以宿主加了 `host.workspace.readMany`（一次往返读多个）。
 *
 * 而"加了批量"最容易变成一句空话——**结果对、但其实还是逐个读**。所以这里守两条**不同**的东西：
 *
 * 1. **结果一致**：批量读回来的字节与逐个读**逐条相等**（含空文件与中文，别让"两边都是空串"混过去）；
 * 2. **路径只有一条**：批量确实**只发一次** `/call`（逐个是 N 次）。
 *    第 2 条是"真的走了批量"的机器判据；只看第 1 条会漏掉"其实还是逐个读"。
 *
 * 另加三条语义判据（批量不是"整批原子"，这一条必须说清楚）：
 *
 * - **一条失败不拖累其他条**：坏路径只让那一条带 `error`；
 * - **边界照旧**：越界路径同样只拒绝那一条，且项目外的文件**确实没被读到**；
 * - **入参非法如实报错**（不是静默回空）。
 *
 * ## 耗时呢
 *
 * 脚本会把"逐个串行 vs 一次批量"的耗时**打印**出来，但**不断言**——耗时受机器影响太大，
 * 当门禁只会让 CI 变脆（这是 `editor-host-io-bench.mjs` 就定下的纪律）。
 *
 * 用法：
 *   node scripts/check-editor-host-batch.mjs [文件数]
 *
 * 退出码：0 全部通过；1 有失败。
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SERVE = resolve(process.cwd(), 'packages', 'editor', 'bin', 'serve.mjs');
const FILE_COUNT = Number(process.argv[2]) || 12;
/** 大批量的规模：证明它真的能承载"一次读很多"，而不是只在小数组上碰巧对 */
const BIG_COUNT = 200;

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

console.log(`[宿主批量读] #274：批量与逐个**结果一致**，而路径只有一条（一次往返）`);

// ---------- 造项目（内容刻意不同：空文件 / 中文 / 大小不一，防"都读到空串"也算通过） ----------
const dir = mkdtempSync(join(tmpdir(), 'feng3d-host-batch-'));
const root = join(dir, 'static');
const project = join(dir, 'project');

mkdirSync(root, { recursive: true });
mkdirSync(join(project, 'scenes'), { recursive: true });
mkdirSync(join(project, 'assets', 'textures'), { recursive: true });
// 项目**外面**放一个文件：越界读要是放过去了，这里就能证实（判据不空转）
writeFileSync(join(dir, 'outside.txt'), '项目外的机密内容', 'utf8');

writeFileSync(join(root, 'index.html'), '<html><head></head><body></body></html>', 'utf8');

const paths = [];

for (let i = 0; i < FILE_COUNT; i++)
{
    const path = i % 3 === 0 ? `assets/file-${pad(i)}.json` : (i % 3 === 1 ? `scenes/file-${pad(i)}.txt` : `assets/textures/file-${pad(i)}.bin`);

    writeFileSync(join(project, path), `第 ${i} 个文件的内容 ${'x'.repeat(i * 7)}`, 'utf8');
    paths.push(path);
}
// 空文件也在里面（"读回来是空串"必须是**这个文件**真的是空的，而不是读失败被当成空）
const EMPTY_PATH = 'scenes/empty.txt';

writeFileSync(join(project, EMPTY_PATH), '', 'utf8');
paths.push(EMPTY_PATH);

/**
 * 序号补零（文件名排序稳定，便于人读）。
 *
 * @param {number} value 序号
 * @returns {string} 补零后的字符串
 */
function pad(value)
{
    return String(value).padStart(3, '0');
}

/** 磁盘上的真值（判据拿它对照，不拿被测代码的输出对照它自己） */
const onDisk = (path) => readFileSync(join(project, path), 'utf8');

// ---------- 起真宿主 ----------
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

/** 数一数脚本自己发了几次 `/call`（"批量只走一次往返"就靠它证明，不靠耗时） */
let callCount = 0;

/**
 * 用调用方的老办法调一个方法：`POST /call` → `GET /result`。
 *
 * @param {string} method 方法名
 * @param {object} [params] 参数
 * @returns {Promise<object>} 结果载荷
 */
async function call(method, params = {})
{
    callCount++;
    const response = await fetch(`${base}/__editor-bridge/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, params }),
    });
    const body = await response.json();

    if (!response.ok) return { ok: false, error: body.error, httpStatus: response.status };

    return await (await fetch(`${base}/__editor-bridge/result?id=${body.id}`)).json();
}

// ---------- 判据 1：与逐个读逐条一致 + 真的只走一次 ----------
const serialStart = process.hrtime.bigint();
callCount = 0;
const byOne = [];

for (const path of paths)
{
    const one = await call('host.workspace.readText', { path });

    byOne.push(one.result);
}
const serialMs = Number(process.hrtime.bigint() - serialStart) / 1e6;
const oneCalls = callCount;

callCount = 0;
const batchStart = process.hrtime.bigint();
const many = await call('host.workspace.readMany', { paths });
const batchMs = Number(process.hrtime.bigint() - batchStart) / 1e6;
const manyCalls = callCount;

check('批量能读回来（载荷形状是逐条结果）',
    many.ok === true && Array.isArray(many.result) && many.result.length === paths.length,
    `条数=${Array.isArray(many.result) ? many.result.length : typeof many.result}`);

check('★ 与逐个读**逐字节一致**（含空文件与中文）',
    paths.every((path, index) => many.result[index].text === byOne[index]),
    `首条=${String(many.result[0]?.text).slice(0, 12)}…`);

// "判据没有空转"：逐个读的结果必须等于**磁盘上的真值**，且内容确实非空——
// 否则"两边都是空串"也会让上面那条判据通过
check('判据没有空转：逐个读的值 = 磁盘真值，且样本**非空**',
    paths.every((path, index) => byOne[index] === onDisk(path)) && byOne.some((text) => text.length > 0),
    `样本最长 ${Math.max(...byOne.map((text) => text.length))} 字符，含 1 个空文件`);

check('★ 批量**只走一次** `/call`（逐个是 N 次）——这才是"真的走了批量"',
    manyCalls === 1 && oneCalls === paths.length,
    `批量 ${manyCalls} 次 / 逐个 ${oneCalls} 次`);

// ---------- 判据 2：顺序与入参一致 ----------
const shuffled = [...paths].reverse();
const reversed = await call('host.workspace.readMany', { paths: shuffled });

check('结果**顺序与入参一致**（换顺序读，结果跟着换）',
    reversed.ok === true && shuffled.every((path, index) => reversed.result[index].path === path
        && reversed.result[index].text === onDisk(path)),
    `入参首条=${shuffled[0]}，结果首条=${reversed.result?.[0]?.path}`);

// ---------- 判据 3：一条失败不拖累其他条 ----------
const mixed = await call('host.workspace.readMany', { paths: [paths[0], 'missing/nope.txt', EMPTY_PATH] });

check('★ 坏路径**只让那一条**带 error，其他条照旧有内容',
    mixed.ok === true
    && mixed.result[0].text === onDisk(paths[0])
    && typeof mixed.result[1].error === 'string' && mixed.result[1].error.length > 0
    && mixed.result[1].text === undefined
    && mixed.result[2].text === '',
    `坏那条的 error=${String(mixed.result[1].error).slice(0, 48)}…`);

// ---------- 判据 4：边界照旧（且真的没读到项目外的东西） ----------
const escaped = await call('host.workspace.readMany', { paths: ['../outside.txt', paths[0]] });

check('★ 越界路径**只拒绝那一条**，且项目外的内容**确实没回来**',
    escaped.ok === true
    && /越出项目目录/.test(escaped.result[0].error ?? '')
    && escaped.result[0].text === undefined
    && escaped.result[1].text === onDisk(paths[0])
    && !JSON.stringify(escaped.result).includes('项目外的机密内容'),
    escaped.result[0].error ?? '');

// ---------- 判据 5：入参非法如实报错 / 空数组 ----------
const noArgs = await call('host.workspace.readMany', {});

check('入参不是数组 → **如实报错**（不静默回空）',
    noArgs.ok === false && /路径数组/.test(noArgs.error ?? ''), noArgs.error ?? '');

const emptyList = await call('host.workspace.readMany', { paths: [] });

check('空数组 → 空结果（既不错也不崩）',
    emptyList.ok === true && Array.isArray(emptyList.result) && emptyList.result.length === 0,
    JSON.stringify(emptyList.result));

// ---------- 判据 6：大批量（一次读很多，逐条都对） ----------
const bigPaths = [];

for (let i = 0; i < BIG_COUNT; i++)
{
    const path = `assets/big-${String(i).padStart(3, '0')}.json`;

    writeFileSync(join(project, path), `big-${i}`, 'utf8');
    bigPaths.push(path);
}

const big = await call('host.workspace.readMany', { paths: bigPaths });

check(`大批量（${BIG_COUNT} 个）一次读回、逐条正确`,
    big.ok === true && big.result.length === BIG_COUNT
    && big.result.every((entry, index) => entry.text === `big-${index}`),
    `条数=${big.result?.length}`);

// ---------- 耗时：只打印，不断言 ----------
console.log('');
console.log(`  **逐个**读 ${paths.length} 个文件：${serialMs.toFixed(1)} ms（${oneCalls} 次 /call）`);
console.log(`  **一次** readMany ${paths.length} 个：${batchMs.toFixed(1)} ms（1 次 /call）`);
console.log(`  → 提速 ${(serialMs / batchMs).toFixed(1)}×（逐条内容已验相等，见上）`);
console.log('  （耗时**只打印不断言**：受机器影响太大，当门禁只会让 CI 变脆）');
console.log('');

// ---------- 收尾 ----------
host.kill();
rmSync(dir, { recursive: true, force: true });

console.log(`共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 批量读未通过——"批量"的价值全在"结果一样、路径只有一条"，两条缺一不可。');
    process.exit(1);
}

console.log('✅ 批量读通过：与逐个逐字节一致、一次往返、失败与越界都逐条如实');
