#!/usr/bin/env node
/**
 * 打印编辑器当前的**插件贡献表**：装了哪些插件、各自贡献了哪些面板与场景浮层（issue #168）。
 *
 * 为什么要这个脚本：插件一多，"界面上这个东西是哪来的"必须能一条命令查清。
 * 桥接的 `editor.plugins` 给了数据，这个脚本把它排成能直接读的表。
 *
 * 用法：
 *   node scripts/editor-plugins.mjs                 # 表格形式（需要页面已打开）
 *   node scripts/editor-plugins.mjs --open          # 自己用 Playwright 开页面（CI 用这个）
 *   node scripts/editor-plugins.mjs --json          # 原始 JSON（喂给别的工具）
 *   node scripts/editor-plugins.mjs --target page2  # 多页面时定向投递
 *   node scripts/editor-plugins.mjs --check         # 只校验：贡献点是否都有来源、id 是否唯一
 *
 * 前置：编辑器 dev server 在跑；页面要么已打开，要么加 `--open` 让脚本代劳。
 */
import { resolveBridgeBase } from './editor-bridge-base.mjs';
import { openBridgePage } from './editor-bridge-page.mjs';

const PREFIX = '/__editor-bridge';

/** 面板落位的展示顺序（与 registry 里的排序口径一致：hierarchy → main → project → bottom） */
const PLACEMENTS = ['hierarchy', 'main', 'project', 'bottom'];

/** 从命令行读选项 */
function readOption(name, fallback = '')
{
    const i = process.argv.indexOf(name);

    return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}

/**
 * 调桥接方法（带定向投递与结果轮询）。
 *
 * @param {string} base 桥接地址前缀
 * @param {string} method 方法名
 * @param {object} params 参数
 * @param {string} target 目标 clientId
 * @returns {Promise<unknown>} 结果
 */
async function call(base, method, params, target)
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
        if (payload.ok === false)
        {
            const detail = payload.stack ? `\n${payload.stack}` : '';
            throw new Error(`${payload.error}${detail}`);
        }

        return payload.result;
    }

    throw new Error(`TIMEOUT: ${method} 未在 30s 内回传（页面是否已打开？target=${target}）`);
}

/**
 * 把贡献表排成人能读的表格。
 *
 * @param {any} table `editor.plugins` 的返回
 * @param {string} base 桥接地址（打印用）
 * @param {string} target 目标 clientId（打印用）
 */
function printTable(table, base, target)
{
    console.log(`桥接地址：${base}（target=${target}）`);
    console.log(`\n已注册插件 ${table.pluginCount} 个，面板 ${table.panelCount} 个，场景浮层 ${table.sceneOverlayCount} 个，`
        + `Logic ${table.logicCount} 个，属性控件 ${table.typeAttributeViewCount} 条`);
    console.log(`同名贡献点策略：${table.overridePolicy}${table.overridePolicy === 'reject' ? '（重复直接拒绝注册；分层覆盖见 #171）' : ''}`);

    console.log('\n=== 插件 ===');
    for (const plugin of table.plugins)
    {
        const version = plugin.apiVersion ? `  apiVersion=${plugin.apiVersion}` : '';
        console.log(`  ${plugin.id}（${plugin.name}）  面板 ${plugin.panels} / 浮层 ${plugin.sceneOverlays}`
            + ` / Logic ${plugin.logics} / 属性控件 ${plugin.typeAttributeViews}${version}`);
        if (plugin.description) console.log(`      ${plugin.description}`);
    }

    // 面板按落位分组：一眼看出"默认布局长什么样、每一块是谁给的"
    console.log('\n=== 面板（按落位） ===');
    for (const placement of PLACEMENTS)
    {
        const panels = table.panels.filter((panel) => panel.placement === placement);
        console.log(`  [${placement}]`);
        if (panels.length === 0) console.log('      （空）');
        for (const panel of panels) console.log(`      ${panel.id.padEnd(16)} ← ${panel.source}   ${panel.labelKey}`);
    }
    // 落位不在预设里也要显示出来（插件写了新落位时别静默吞掉）
    for (const panel of table.panels.filter((item) => !PLACEMENTS.includes(item.placement)))
    {
        console.log(`  [${panel.placement}]（未知落位）`);
        console.log(`      ${panel.id.padEnd(16)} ← ${panel.source}   ${panel.labelKey}`);
    }

    console.log('\n=== 场景浮层 ===');
    if (table.sceneOverlays.length === 0) console.log('  （无）');
    for (const overlay of table.sceneOverlays) console.log(`  ${overlay.id.padEnd(24)} ← ${overlay.source}`);

    // Logic 与属性控件是扁平表：两者都在回答"这个 __type__ / 这个控件是哪来的"
    console.log('\n=== Logic（__type__ → Logic 类） ===');
    if (table.logics.length === 0) console.log('  （无）');
    for (const entry of table.logics) console.log(`  ${entry.name.padEnd(28)} ← ${entry.source}`);

    console.log('\n=== 属性面板（类型 → 控件） ===');
    if (table.typeAttributeViews.length === 0) console.log('  （无）');
    for (const entry of table.typeAttributeViews)
    {
        console.log(`  ${entry.type.padEnd(22)} → ${entry.component.padEnd(22)} ← ${entry.source}`);
    }
}

/**
 * 校验贡献表自洽：贡献点必须都有来源、来源必须在插件列表里、id 必须唯一、落位必须已知。
 *
 * @param {any} table `editor.plugins` 的返回
 * @returns {string[]} 问题描述（空数组表示没问题）
 */
function findProblems(table)
{
    const problems = [];
    const seen = new Set();
    const knownPlacements = new Set(PLACEMENTS);
    const pluginIds = new Set(table.plugins.map((plugin) => plugin.id));

    for (const panel of table.panels)
    {
        if (!panel.source) problems.push(`面板 ${panel.id} 没有来源插件`);
        else if (!pluginIds.has(panel.source)) problems.push(`面板 ${panel.id} 的来源 ${panel.source} 不在插件列表里`);
        if (seen.has(`panel:${panel.id}`)) problems.push(`面板 id 重复：${panel.id}`);
        seen.add(`panel:${panel.id}`);
        if (!knownPlacements.has(panel.placement)) problems.push(`面板 ${panel.id} 的落位未知：${panel.placement}`);
        if (!panel.labelKey) problems.push(`面板 ${panel.id} 没有 labelKey`);
    }
    for (const overlay of table.sceneOverlays)
    {
        if (!overlay.source) problems.push(`浮层 ${overlay.id} 没有来源插件`);
        else if (!pluginIds.has(overlay.source)) problems.push(`浮层 ${overlay.id} 的来源 ${overlay.source} 不在插件列表里`);
        if (seen.has(`overlay:${overlay.id}`)) problems.push(`浮层 id 重复：${overlay.id}`);
        seen.add(`overlay:${overlay.id}`);
    }
    for (const entry of table.logics)
    {
        if (!entry.source) problems.push(`Logic ${entry.name} 没有来源插件`);
        else if (!pluginIds.has(entry.source)) problems.push(`Logic ${entry.name} 的来源 ${entry.source} 不在插件列表里`);
        if (seen.has(`logic:${entry.name}`)) problems.push(`Logic 类型名重复：${entry.name}`);
        seen.add(`logic:${entry.name}`);
    }
    for (const entry of table.typeAttributeViews)
    {
        if (!entry.source) problems.push(`属性控件 ${entry.type} 没有来源插件`);
        else if (!pluginIds.has(entry.source)) problems.push(`属性控件 ${entry.type} 的来源 ${entry.source} 不在插件列表里`);
        if (seen.has(`type:${entry.type}`)) problems.push(`同一个类型被指派了多次控件：${entry.type}`);
        seen.add(`type:${entry.type}`);
        if (!entry.component) problems.push(`类型 ${entry.type} 的控件名为空`);
    }

    // 插件条目里报的数量必须与扁平表对得上（否则"插件声称贡献了 N 个"就是假的）
    for (const plugin of table.plugins)
    {
        const counted = [
            ['面板', plugin.panels, table.panels.filter((item) => item.source === plugin.id).length],
            ['浮层', plugin.sceneOverlays, table.sceneOverlays.filter((item) => item.source === plugin.id).length],
            ['Logic', plugin.logics, table.logics.filter((item) => item.source === plugin.id).length],
            ['属性控件', plugin.typeAttributeViews, table.typeAttributeViews.filter((item) => item.source === plugin.id).length],
        ];
        for (const [label, claimed, actual] of counted)
        {
            if (claimed !== actual) problems.push(`${plugin.id} 声称贡献 ${claimed} 个${label}，扁平表里查到 ${actual} 个`);
        }
    }

    return problems;
}

const openPage = process.argv.includes('--open');
const target = readOption('--target', openPage ? 'plugins' : 'default');
const asJson = process.argv.includes('--json');
const checkOnly = process.argv.includes('--check');

const base = await resolveBridgeBase(readOption('--url') || undefined);

// `--open`：自己开页面（CI 上没人手动开；桥接是页面轮询模型，没页面就全部超时）
const opened = openPage ? await openBridgePage(base, target) : null;

let exitCode = 0;
try
{
    const table = await call(base, 'editor.plugins', {}, target);

    if (asJson) console.log(JSON.stringify(table, null, 2));
    else printTable(table, base, target);

    if (checkOnly)
    {
        const problems = findProblems(table);

        console.log(`\n${'='.repeat(56)}`);
        if (problems.length === 0)
        {
            console.log(`✅ 贡献表自洽：${table.panelCount} 个面板 / ${table.sceneOverlayCount} 个浮层 / `
                + `${table.logicCount} 个 Logic / ${table.typeAttributeViewCount} 个属性控件都有来源且 id 唯一`);
        }
        else
        {
            console.log(`❌ 贡献表有问题：${problems.length} 条`);
            for (const problem of problems) console.log(`   - ${problem}`);
            exitCode = 1;
        }
    }
}
finally
{
    // 自己开的浏览器必须关掉，否则进程不退出（CI 上表现为"卡住不结束"）
    await opened?.close();
}

process.exit(exitCode);
