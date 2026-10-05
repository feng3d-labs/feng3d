#!/usr/bin/env node
/**
 * **宿主方法**的验收（#272）。
 *
 * ## 它守什么
 *
 * 桥接方法表跑在**页面里**，但"读写项目目录 / 构建 / 开关项目"这类事页面碰不到、也不该碰。
 * 宿主方法就是给这些事用的，而它的价值全在**两句话**上：
 *
 * 1. **不经页面**：**没有页面在跑**也能调通（脚本里根本不打开页面）；
 * 2. **调用方零改动**：还是 `POST /call` → `GET /result` 那套（15 个 `editor-*.mjs` 不用改一行）。
 *
 * 顺带守住三条边界：`host.` 前缀之外的方法照旧投给页面（不会被宿主截胡）、
 * 未知的宿主方法要**报错并列出可用的**（调用方是 AI，它得能自己纠正）、
 * 方法抛错要原样带到调用方（不是 500 也不是静默成功）。
 *
 * 用法：
 *   node scripts/check-editor-host-methods.mjs
 *
 * 退出码：0 全部通过；1 有失败。
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

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

console.log('[宿主方法] #272：调用方直接调宿主，**不经页面**、调用方零改动');

// ---------- 起真宿主（带一个项目；**不打开页面**） ----------
const dir = mkdtempSync(join(tmpdir(), 'feng3d-host-methods-'));
const root = join(dir, 'static');
const project = join(dir, 'project');

mkdirSync(root, { recursive: true });
mkdirSync(join(project, 'scenes'), { recursive: true });
writeFileSync(join(root, 'index.html'), '<html><head></head><body></body></html>', 'utf8');
writeFileSync(join(project, 'scenes', 'default.scene.json'), '{"a":1}', 'utf8');

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
 * 用**调用方的老办法**调一个方法：`POST /call` → `GET /result`。
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

    if (!response.ok) return { ok: false, error: body.error, httpStatus: response.status };

    return await (await fetch(`${base}/__editor-bridge/result?id=${body.id}`)).json();
}

// ---------- 判据 1：宿主方法真的能用（而且没有页面在跑） ----------
check('宿主启动时报出了宿主方法', /宿主方法：\d+ 个/.test(hostLog),
    hostLog.split('\n').find((line) => line.includes('宿主方法'))?.trim() ?? '');

const info = await call('host.workspace.info');

check('**没有页面也能调通宿主方法**（不经页面）', info.ok === true && info.result?.open === true,
    JSON.stringify(info.result ?? info.error));

const list = await call('host.workspace.list', { dir: 'scenes' });

check('宿主方法能列项目目录', list.ok === true && list.result?.some((entry) => entry.path === 'scenes/default.scene.json'),
    JSON.stringify(list.result));

const read = await call('host.workspace.readText', { path: 'scenes/default.scene.json' });

check('宿主方法能读项目文件', read.ok === true && read.result === '{"a":1}');

const write = await call('host.workspace.writeText', { path: 'scenes/new.json', text: '{"b":2}' });

check('宿主方法能写项目文件', write.ok === true
    && readFileSync(join(project, 'scenes', 'new.json'), 'utf8') === '{"b":2}');

// ---------- 判据 2：边界 ----------
const unknown = await call('host.nope.nope');

check('未知宿主方法报错并**列出可用的**（调用方是 AI，得能自己纠正）',
    unknown.httpStatus === 400 && /未知宿主方法/.test(unknown.error ?? '') && /host\.workspace\./.test(unknown.error ?? ''),
    unknown.error ?? '');

// 越界路径由 workspace 自己的边界挡住，错误原样回到调用方
const escape = await call('host.workspace.readText', { path: '../outside.txt' });

check('宿主方法抛的错**原样**回到调用方（不是 500、也不是静默成功）',
    escape.ok === false && /越出项目目录/.test(escape.error ?? ''), escape.error ?? '');

// ---------- 判据 3：为 HostFS 铺路的那几个（#274） ----------
// 页面侧要拿宿主当"文件系统"用，光有 readText / writeText 撑不起来
const madeDir = await call('host.workspace.mkdir', { path: 'assets/textures' });
const isDir = await call('host.workspace.isDirectory', { path: 'assets/textures' });

check('宿主能建目录（递归），也能问"是不是目录"', madeDir.ok === true && isDir.result === true,
    `mkdir=${JSON.stringify(madeDir.result)} isDirectory=${JSON.stringify(isDir.result)}`);

const binary = Buffer.from('二进制内容', 'utf8').toString('base64');
const wroteBinary = await call('host.workspace.writeBinary', { path: 'assets/textures/a.bin', base64: binary });
const readBinary = await call('host.workspace.readBinary', { path: 'assets/textures/a.bin' });

check('宿主能读写二进制（base64 进出，JSON 过得去）',
    wroteBinary.ok === true && readBinary.result === binary, `读回=${String(readBinary.result).slice(0, 16)}…`);

const existsYes = await call('host.workspace.exists', { path: 'assets/textures/a.bin' });
const existsNo = await call('host.workspace.exists', { path: 'assets/nope.bin' });

check('宿主能问存在性（在 / 不在都要如实）',
    existsYes.result === true && existsNo.result === false,
    `有=${existsYes.result} 无=${existsNo.result}`);

const removed = await call('host.workspace.remove', { path: 'assets' });
const existsAfterRemove = await call('host.workspace.exists', { path: 'assets' });

check('宿主能删（**递归**删目录）', removed.result?.removed === true && existsAfterRemove.result === false,
    `removed=${JSON.stringify(removed.result)}`);

// **新方法同样守边界**：能力变多了，边界不能只守老的
const escapeRemove = await call('host.workspace.remove', { path: '../outside' });
const escapeBinary = await call('host.workspace.readBinary', { path: '../outside.bin' });

check('**新方法同样守边界**（删与读二进制都不许越界）',
    escapeRemove.ok === false && /越出项目目录/.test(escapeRemove.error ?? '')
    && escapeBinary.ok === false && /越出项目目录/.test(escapeBinary.error ?? ''),
    `${escapeRemove.error} / ${escapeBinary.error}`);

// 批量读（#274）：**逐条**守边界——一条越界只拒绝它自己，不是"整批失败"。
// （这条与"一条坏文件不拖累其他条"是同一个语义，只是换成了越界那种坏）
const batchRead = await call('host.workspace.readMany', { paths: ['scenes/default.scene.json', '../outside.txt'] });

check('批量读同样守边界（越界那条只拒绝它自己，其他条照旧）',
    batchRead.ok === true && batchRead.result[0].text === '{"a":1}'
    && batchRead.result[0].error === undefined
    && /越出项目目录/.test(batchRead.result[1].error ?? ''),
    `好那条=${JSON.stringify(batchRead.result?.[0]?.text)} / 坏那条=${batchRead.result?.[1]?.error}`);

// 非 `host.` 的方法照旧投给页面（不会被宿主截胡）
const pageCall = await fetch(`${base}/__editor-bridge/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: 'scene.getTree' }),
}).then((res) => res.json());

check('非 `host.` 前缀的方法照旧投给页面（没被宿主截胡）',
    typeof pageCall.id === 'string' && pageCall.host === undefined,
    JSON.stringify(pageCall));

// ---------- 收尾 ----------
host.kill();
rmSync(dir, { recursive: true, force: true });

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 宿主方法未通过——"页面碰不到磁盘"是它存在的理由，不能只在注释里成立。');
    process.exit(1);
}

console.log('✅ 宿主方法通过：不经页面可调、调用方零改动、边界与报错都如实');
