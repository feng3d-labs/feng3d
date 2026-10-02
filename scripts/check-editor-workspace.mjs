#!/usr/bin/env node
/**
 * 项目工作区服务的验收（#272 的 P2）。
 *
 * ## 它守什么
 *
 * 宿主是 Node 进程，"打开的目录"如果没边界，就等于把**整台机器**交出去。所以这个脚本里
 * 一半判据是**边界**：绝对路径、`..`、`sub/../../`、空路径——全部必须被拒。另一半是正常职责：
 * 读写、自动建父目录、列目录、变化事件、以及"关掉之后一律拒绝"。
 *
 * 跑在一个**真 cordis Context** 上（不是 mock）：服务的 `ctx.effect` 生命周期要真的生效——
 * `ctx.fiber.dispose()` 之后 watcher 必须已经关掉。
 *
 * 用法：
 *   node scripts/check-editor-workspace.mjs
 *
 * 退出码：0 全部通过；1 有失败。
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Context } from '@deepseek-ai/cordis';
import { ProjectWorkspace } from '../packages/editor/bin/host/projectWorkspace.mjs';

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
 * 跑一段可能抛错的代码，返回错误消息（没抛就是 `null`）。
 *
 * @param {() => unknown} action 动作
 * @returns {string | null} 错误消息
 */
function errorOf(action)
{
    try
    {
        action();

        return null;
    }
    catch (error)
    {
        return error instanceof Error ? error.message : String(error);
    }
}

/**
 * 等一个条件成立。
 *
 * @param {() => boolean} condition 条件
 * @param {number} timeoutMs 超时
 * @returns {Promise<boolean>} 是否成立
 */
async function waitFor(condition, timeoutMs = 5000)
{
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline)
    {
        if (condition()) return true;
        await new Promise((resolve_) => setTimeout(resolve_, 50));
    }

    return false;
}

console.log('[工作区服务] #272 P2：宿主读写项目文件，但**只在项目目录内**');

// ---------- 准备一个临时工作区 ----------
const sandbox = mkdtempSync(join(tmpdir(), 'feng3d-workspace-'));
const projectDir = join(sandbox, 'my-project');
const outsideFile = join(sandbox, 'outside.txt');

mkdirSync(projectDir, { recursive: true });
writeFileSync(outsideFile, '外面的秘密', 'utf8');

const ctx = new Context();
const workspace = new ProjectWorkspace(ctx, {});

// ---------- 打开之前：一律拒绝 ----------
check('未打开项目时拒绝读', /项目未打开/.test(errorOf(() => workspace.readText('a.txt')) ?? ''));
check('未打开项目时拒绝写', /项目未打开/.test(errorOf(() => workspace.writeText('a.txt', 'x')) ?? ''));

// ---------- 打开 ----------
check('打开不存在的目录会报错（不静默）', errorOf(() => workspace.open(join(sandbox, 'nope'))) !== null);
check('打开一个文件（不是目录）会报错', errorOf(() => workspace.open(outsideFile)) !== null);

const opened = workspace.open(projectDir);

check('打开真目录成功', workspace.isOpen && opened === resolve(projectDir), opened);

// ---------- 读写 ----------
workspace.writeText('scenes/default.scene.json', '{"a":1}');

check('写进去的能原样读回来', workspace.readText('scenes/default.scene.json') === '{"a":1}');
check('写文件会自动建父目录', workspace.readText('scenes/default.scene.json').length > 0);

const entries = workspace.list('scenes');

check('列目录给出相对项目根的路径（正斜杠）',
    entries.length === 1 && entries[0].path === 'scenes/default.scene.json' && entries[0].directory === false,
    JSON.stringify(entries));

// ---------- 边界（本脚本的重点） ----------
check('拒绝 `..` 逃逸', /越出项目目录/.test(errorOf(() => workspace.readText('../outside.txt')) ?? ''));
check('拒绝多层 `..` 组合', /越出项目目录/.test(errorOf(() => workspace.readText('scenes/../../outside.txt')) ?? ''));
check('拒绝绝对路径（POSIX 形式）', /只接受项目内的相对路径/.test(errorOf(() => workspace.readText('/etc/passwd')) ?? ''));
check('拒绝绝对路径（Windows 形式）', /只接受项目内的相对路径/.test(errorOf(() => workspace.readText('C:\\Windows\\win.ini')) ?? ''));
check('拒绝空路径', /路径不能为空/.test(errorOf(() => workspace.readText('')) ?? ''));
check('写也被同样的边界挡住',
    /越出项目目录/.test(errorOf(() => workspace.writeText('../evil.txt', 'x')) ?? ''));

check('外面的文件仍在、内容未变（逃逸确实没发生）', readFileSync(outsideFile, 'utf8') === '外面的秘密');
check('项目根的列表里只有项目内的东西',
    workspace.list('.').every((entry) => entry.path === entry.name), JSON.stringify(workspace.list('.')));

// ---------- 变化事件 ----------
const changes = [];
const unsubscribe = workspace.onChanged((change) => changes.push(change));

workspace.writeText('scenes/other.json', '{}');

check('写文件会报出变化事件（相对路径）',
    await waitFor(() => changes.some((c) => c.path === 'scenes/other.json')), JSON.stringify(changes.slice(0, 3)));

const beforeUnsubscribe = changes.length;

unsubscribe();
workspace.writeText('scenes/after-unsubscribe.json', '{}');
await new Promise((resolve_) => setTimeout(resolve_, 500));

check('退订之后不再收到事件', changes.length === beforeUnsubscribe, `退订前 ${beforeUnsubscribe}，现在 ${changes.length}`);

// ---------- 关闭 ----------
workspace.close();

check('关闭之后读写被拒', /项目未打开/.test(errorOf(() => workspace.readText('scenes/default.scene.json')) ?? ''));

// ---------- 生命周期：fiber 卸载要收走 watcher ----------
const ctx2 = new Context();
const workspace2 = new ProjectWorkspace(ctx2, { root: projectDir });

check('构造时给了 root 就直接打开', workspace2.isOpen);

await ctx2.fiber.dispose();

check('`ctx.fiber.dispose()` 之后 watcher 已关闭（宿主"能停"不靠进程信号）',
    workspace2.watcher === null && workspace2.root === null);

// ---------- 收尾 ----------
rmSync(sandbox, { recursive: true, force: true });

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 工作区服务未通过——路径边界是宿主碰文件的前提，不能有一条例外。');
    process.exit(1);
}

console.log('✅ 工作区服务通过：读写正常、边界守得住、变化报得出、fiber 卸载能收走');
