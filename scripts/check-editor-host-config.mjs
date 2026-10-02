#!/usr/bin/env node
/**
 * 宿主**配置服务**的验收（#272 P2 的另一半）。
 *
 * 它守的是"**层叠加**"这件事本身：内置 → 项目 → 用户，后面的层赢。这类逻辑最容易出的错
 * 不是"没合并"，而是**合错了**——所以判据集中在边界上：
 *
 * - 深合并：对象递归，**同一层里两个不同的子键都要留住**；
 * - 数组**整块替换**（不做逐项合并——"我给的数组就是我要的"）；
 * - 类型不同时替换（对象盖上标量、标量盖上对象都要对）；
 * - 坏配置**只丢那一层**（配置写错是常事，不该让宿主起不来）；
 * - 输入不被改动（`use` 不该 mutate 调用方的对象）。
 *
 * 跑在真 cordis `Context` 上，离线可跑。
 *
 * 用法：
 *   node scripts/check-editor-host-config.mjs
 *
 * 退出码：0 全部通过；1 有失败。
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Context } from '@deepseek-ai/cordis';
import { HostConfig } from '../packages/editor/bin/host/hostConfig.mjs';

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

console.log('[宿主配置] #272 P2：内置 → 项目 → 用户，后面的层赢');

const dir = mkdtempSync(join(tmpdir(), 'feng3d-host-config-'));
const ctx = new Context();

// ---------- 三层叠加：内置 → 项目 → 用户 ----------
const defaults = {
    port: 3000,
    bridge: { prefix: '/__editor-bridge', timeout: 20000 },
    plugins: ['builtin-a'],
    flags: { verbose: false, color: true },
};

// 只给内置层；项目层与用户层按**优先级顺序**依次叠（**顺序即优先级**，由调用方保证）
const config = new HostConfig(ctx, { defaults });

check('内置层的值可读', config.get('port') === 3000, `port=${config.get('port')}`);
check('没被覆盖的键保持内置值', config.get('bridge.timeout') === 20000);

// 项目层：夹在中间（用 useFile 走真实的文件路径）
const projectConfig = join(dir, 'editor.config.jsonc');

writeFileSync(projectConfig, [
    '{',
    '    // JSONC：注释与尾逗号都允许（配置文件是给人写的）',
    '    "port": 3500,',
    '    "bridge": { "timeout": 30000 },',
    '    "plugins": ["project-b"],',
    '}',
].join('\n'), 'utf8');

check('JSONC（带注释与尾逗号）能读', config.useFile(projectConfig, '项目配置') === true);
check('项目层盖掉内置', config.get('bridge.timeout') === 30000, `timeout=${config.get('bridge.timeout')}`);
check('同层里没被覆盖的子键留住（**深合并**）', config.get('bridge.prefix') === '/__editor-bridge');
check('数组**整块替换**（不逐项合并）', JSON.stringify(config.get('plugins')) === '["project-b"]',
    JSON.stringify(config.get('plugins')));

// 用户层（命令行）**最后**叠——顺序即优先级，混了顺序就会"项目配置盖掉命令行"
config.use('命令行覆盖', { port: 4000, flags: { verbose: true } });

check('高层仍然赢（用户 > 项目）', config.get('port') === 4000, `port=${config.get('port')}`);

check('层序被如实记录（诊断用）', JSON.stringify(config.layers) === '["内置默认","项目配置","命令行覆盖"]',
    JSON.stringify(config.layers));

// ---------- 类型不同：整块替换 ----------
config.use('类型不同的层', { bridge: 'bridge 被换成了字符串' });

check('上层是标量时整块替换（即使下层是对象）', config.get('bridge') === 'bridge 被换成了字符串');

// ---------- get：点路径与缺省值 ----------
config.use('恢复对象', { bridge: { prefix: '/p', nested: { deep: 7 } } });

check('点路径读深层值', config.get('bridge.nested.deep') === 7);
check('取不到时给缺省值', config.get('nope.nope', '缺省') === '缺省');
check('取不到且没给缺省值时是 undefined', config.get('nope.nope') === undefined);

// ---------- 坏层：只丢那一层 ----------
const brokenConfig = join(dir, 'broken.jsonc');

writeFileSync(brokenConfig, '{ "port": 5000, /* 少了右括号 */', 'utf8');

const before = JSON.stringify(config.values);

check('坏配置层被丢掉（不抛）', config.useFile(brokenConfig, '坏层') === false);
check('坏层被记进 problems 并说清原因', config.problems.length === 1 && /配置层读不了/.test(config.problems[0]),
    config.problems[0] ?? '');
check('**坏层不影响已叠加的配置**', JSON.stringify(config.values) === before);
check('文件不存在不算问题（正常状态）', config.useFile(join(dir, '不存在.jsonc'), '缺层') === false
    && config.problems.length === 1);

// Windows 上真实存在的坑：带 BOM 的 UTF-8 文件（记事本 / PowerShell 存盘就会加）
const bomConfig = join(dir, 'bom.jsonc');

writeFileSync(bomConfig, '\uFEFF{ "port": 6000 }', 'utf8');

check('**带 BOM 的配置文件能读**（Windows 上很常见）',
    config.useFile(bomConfig, '带 BOM 的层') === true && config.get('port') === 6000,
    `port=${config.get('port')}；problems=${config.problems.length}`);

// ---------- 输入不被改动 ----------
const layer = { nested: { keep: 1 }, list: [1, 2] };
const snapshot = JSON.stringify(layer);

config.use('不该被改的层', layer);

check('`use` 不改动调用方传进来的对象', JSON.stringify(layer) === snapshot, JSON.stringify(layer));

// ---------- 非对象层 ----------
let error = null;

try
{
    config.use('非法层', '不是对象');
}
catch (e)
{
    error = e.message;
}

check('非对象层会报错（而不是静默吞掉）', /不是对象/.test(error ?? ''), error ?? '');

// ---------- 收尾 ----------
await ctx.fiber.dispose();
rmSync(dir, { recursive: true, force: true });

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 宿主配置服务未通过——层叠加最容易错的不是"没合并"，而是"合错了"。');
    process.exit(1);
}

console.log('✅ 宿主配置服务通过：三层按序叠加、深合并规则明确、坏层只丢自己不拖累别人');
