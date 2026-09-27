#!/usr/bin/env node
/**
 * 运行时自检：**面板重挂载后要能自己恢复到当前选中**（issue #173）。
 *
 * ## 为什么需要它
 *
 * 读选中的消费者（检查器 / 层级树 / 资源管理器 / 相机预览 / 动画 / 粒子控制器）都是
 * **异步加载**的组件，而"选中变化"是一次性事件——在组件挂载之前发生的选中，它永远收不到。
 * 表现：点了层级树、检查器一直显示"未选择对象"，而且**不会自愈**
 * （再点同一个对象时 `setSelectedObjects` 认为选中没变、不再发事件）。
 *
 * 单元测试（`test/selectionSync.spec.ts`）只能守住"订阅方式对不对"（源码扫描），
 * **守不住"界面真的恢复了吗"**——那要真开一个页面、真点一下、真关掉面板再开回来。
 *
 * ## 判据
 *
 * 1. 点层级树选中对象 → 检查器出现输入框、该行高亮；
 * 2. 关掉再打开**检查器面板**（不重新选择）→ 输入框**再次**出现；
 * 3. 关掉再打开**层级树面板** → 该行仍然高亮；
 * 4. 用桥接改选中（走 `writeCore` 那条刷新路径）→ 检查器与高亮都跟着变；
 * 5. 全程 pageerror 0。
 *
 * 用法：
 *   node scripts/editor-selection-sync-check.mjs --open          # 自己开页面（CI 用这个）
 *   node scripts/editor-selection-sync-check.mjs --target x      # 多页面时定向投递
 *
 * 退出码：0 全部通过；1 有断言失败。
 */
import { resolveBridgeBase } from './editor-bridge-base.mjs';
import { openBridgePage } from './editor-bridge-page.mjs';

const PREFIX = '/__editor-bridge';

/** 面板插件 id（面板已按 #180 拆成独立插件） */
const INSPECTOR = '@feng3d/editor-plugin-inspector';
const HIERARCHY = '@feng3d/editor-plugin-hierarchy';

/** 从命令行读选项 */
function readOption(name, fallback = '')
{
    const i = process.argv.indexOf(name);

    return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}

const openPage = process.argv.includes('--open');
const target = readOption('--target', openPage ? 'selection-sync' : 'default');
const base = await resolveBridgeBase(readOption('--url') || undefined);

let total = 0;
let failed = 0;

/**
 * 跑一条断言。
 *
 * @param {string} title 判据描述
 * @param {boolean} condition 是否成立
 * @param {string} detail 补充信息
 */
function check(title, condition, detail = '')
{
    total++;
    if (condition) console.log(`  PASS  ${title}${detail ? ` — ${detail}` : ''}`);
    else { failed++; console.log(`  FAIL  ${title}${detail ? ` — ${detail}` : ''}`); }
}

const opened = openPage ? await openBridgePage(base, target) : null;
const page = opened?.page ?? null;

/**
 * 调桥接方法（带定向投递与结果轮询）。
 *
 * @param {string} method 方法名
 * @param {object} params 参数
 * @returns {Promise<unknown>} 结果
 */
async function call(method, params = {})
{
    const res = await fetch(`${base}${PREFIX}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, params, target }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const { id } = await res.json();
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline)
    {
        const payload = await (await fetch(`${base}${PREFIX}/result?id=${encodeURIComponent(id)}`)).json();
        if (payload.pending)
        {
            await new Promise((r) => setTimeout(r, 150));
            continue;
        }
        if (payload.ok === false) throw new Error(`${payload.error}`);

        return payload.result;
    }

    throw new Error(`TIMEOUT: ${method} 未在 30s 内回传（页面是否已打开？target=${target}）`);
}

/**
 * 切换插件启用状态。
 *
 * @param {string} pluginId 插件 id
 * @param {boolean} enabled 是否启用
 */
async function togglePlugin(pluginId, enabled)
{
    await call('editor.setPlugin', { id: pluginId, enabled });
}

/**
 * 轮询等一个条件成立。
 *
 * **不用固定 sleep**：本自检要验的恰恰是"慢机器上的时序问题"，
 * 用一个拍脑袋的等待时间只会把同一类问题搬进自检里（CI 慢一点就假红）。
 *
 * @param {() => Promise<boolean>} condition 条件
 * @param {number} timeoutMs 超时
 * @returns {Promise<boolean>} 是否在超时前成立
 */
async function waitFor(condition, timeoutMs = 20000)
{
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline)
    {
        if (await condition()) return true;
        await page.waitForTimeout(250);
    }

    return false;
}

/**
 * 检查器里能数到的输入框个数。
 *
 * @returns {Promise<number>} 个数
 */
async function inspectorInputs()
{
    return page.locator('.inspector-view input').count();
}

/**
 * 层级树里被高亮的行。
 *
 * 页面里有两棵 Element Plus 树（层级 + 资源管理器），所以先按内容认出层级树，
 * 免得把 Assets 那棵的当前节点也算进来。
 *
 * @returns {Promise<string>} 高亮行的文字
 */
async function highlightedRow()
{
    return page.evaluate(() =>
    {
        const trees = Array.from(document.querySelectorAll('.el-tree'));
        const hierarchyTree = trees.find((tree) => (tree.textContent ?? '').includes('Main Camera'));

        return (hierarchyTree?.querySelector('.el-tree-node.is-current')?.textContent ?? '').trim();
    });
}

try
{
    if (!page)
    {
        console.error('本自检需要页面（用 --open 让脚本自己开，或先手动打开编辑器页面）');
        process.exit(2);
    }

    console.log(`[编辑器选中同步] ${base}（target=${target}）`);

    // ---- 1. 点层级树选中：检查器出现字段、该行高亮 ---------------------------
    const targetRow = page.locator('.el-tree-node__content', { hasText: 'DirectionalLight' }).first();
    await targetRow.waitFor({ state: 'visible', timeout: 30000 });
    await targetRow.click();

    const gotFields = await waitFor(async () => (await inspectorInputs()) > 0);
    check('点击层级树后检查器渲染出字段', gotFields, `${await inspectorInputs()} 个输入框`);
    const highlighted = await waitFor(async () => (await highlightedRow()) === 'DirectionalLight');
    check('层级树高亮的是被点的对象', highlighted, `高亮「${await highlightedRow()}」`);

    // ---- 2. 重挂载检查器面板：不重新选择，它必须自己恢复 ---------------------
    await togglePlugin(INSPECTOR, false);
    const unmounted = await waitFor(async () => (await inspectorInputs()) === 0);
    check('关掉检查器面板后输入框消失（面板真的卸载了）', unmounted);

    await togglePlugin(INSPECTOR, true);
    // 关键判据：**没有再点任何东西**，检查器必须自己补上当前选中
    const recovered = await waitFor(async () => (await inspectorInputs()) > 0);
    check('重挂载后检查器**自己**恢复了当前选中', recovered, `${await inspectorInputs()} 个输入框（没有重新选择）`);

    // ---- 3. 重挂载层级树面板：高亮也要自己恢复 ------------------------------
    await togglePlugin(HIERARCHY, false);
    await togglePlugin(HIERARCHY, true);
    const rowRecovered = await waitFor(async () => (await highlightedRow()) === 'DirectionalLight');
    check('重挂载后层级树仍然高亮同一个对象', rowRecovered, `高亮「${await highlightedRow()}」`);

    // ---- 4. 桥接改选中（writeCore 的刷新路径）也要传导 ----------------------
    await call('selection.set', { objectIds: ['/Untitled/Plane'] });
    const switched = await waitFor(async () => (await highlightedRow()) === 'Plane');
    check('桥接改选中后层级树高亮跟着变', switched, `高亮「${await highlightedRow()}」`);
    check('桥接改选中后检查器仍有字段', (await inspectorInputs()) > 0);

    // ---- 5. 全程无页面级报错 ------------------------------------------------
    const pageErrors = opened.pageErrors ?? [];
    check('全程没有页面级报错', pageErrors.length === 0, pageErrors.slice(0, 2).map((m) => m.split('\n')[0]).join(' | '));
}
finally
{
    // 自己开的浏览器必须关掉，否则进程不退出（CI 上表现为"卡住不结束"）
    await opened?.close();
}

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);
process.exit(failed === 0 ? 0 : 1);
