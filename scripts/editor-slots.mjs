#!/usr/bin/env node
/**
 * 运行时自检：**界面由插槽驱动**（#276 S2b / S3）。
 *
 * ## 为什么需要它
 *
 * 改造后界面的数据来源是一条四段链：
 *
 * ```
 * 清单（权威数据：五类贡献点 + 层叠加 + 启用状态 + 用户 patch）
 *   → 投影（把归并后的赢家摆到座位上）
 *   → 插槽（`panel.*` / `scene.overlay`）
 *   → 界面（`MainLayout.vue` / `SceneView.vue` 读座位画界面）
 * ```
 *
 * 单元测试覆盖前两段（`test/slotProjection.spec.ts` / `slotInstall.spec.ts`），
 * 但**最后一段（`slots/changed` → 界面重算）只有真开一个页面才知道**：
 * 注册表接错了、界面还在读旧查询、订阅没建立，纯函数测试一个都发现不了。
 *
 * ## 判据
 *
 * 1. 界面标签 = 五个内置面板（层级 / 场景 / 项目 / 控制台 / 检查器），且标签数与贡献表面板数一致；
 * 2. 用桥接关掉「层级」插件 → **界面标签少一个**，贡献表里也没有它；
 * 3. 恢复 → 标签回来；
 * 4. 关掉「粒子」插件（只贡献 `scene.overlay` 浮层）→ 面板标签集合不受影响；
 * 5. 全程 pageerror 0。
 *
 * 这一条与 `editor-plugins.mjs --check` 不重复：后者验的是**贡献表自洽**（清单侧），
 * 本脚本验的是「清单变了，界面真的跟着变」——差的那一段正是 S2b 引入的接线。
 *
 * 用法：
 *   node scripts/editor-slots.mjs --open                    # 自己开页面（CI 用这个）
 *   node scripts/editor-slots.mjs --url http://localhost:3000
 *
 * 退出码：0 全部通过；1 有断言失败。
 */
import { resolveBridgeBase } from './editor-bridge-base.mjs';
import { openBridgePage } from './editor-bridge-page.mjs';

const PREFIX = '/__editor-bridge';

/** 内置面板插件 id */
const PANEL_IDS = {
    '@feng3d/editor-plugin-hierarchy': 'hierarchy',
    '@feng3d/editor-plugin-scene': 'scene',
    '@feng3d/editor-plugin-project': 'project',
    '@feng3d/editor-plugin-console': 'console',
    '@feng3d/editor-plugin-inspector': 'inspector',
};

/**
 * 面板 id → 界面标签文字。
 *
 * 来源是 `packages/editor/src/plugins/builtinPanels.ts` 的 `labelKey`（中文 i18n 值）。
 * 这里硬编码是刻意的：判据就是"用户在界面上看到的字"，用 id 比对等于没验界面。
 * **代价是判据绑定了语言**——所以下面开页时把 locale 钉死成 `zh-CN`（见那儿与
 * `editor-bridge-page.mjs` 的说明）：CI 的 ubuntu runner 是 en-US，曾经把标签渲染成
 * Hierarchy / Scene / …，本脚本因此在 CI 上只过 6/12。
 */
const PANEL_LABELS = {
    hierarchy: '层级',
    scene: '场景',
    project: '项目',
    console: '控制台',
    inspector: '检查器',
};

const HIERARCHY = '@feng3d/editor-plugin-hierarchy';
const PARTICLE = '@feng3d/editor-plugin-particle';

/**
 * 从命令行读选项。
 *
 * @param {string} name 选项名
 * @param {string} fallback 缺省值
 * @returns {string} 选项值
 */
function readOption(name, fallback = '')
{
    const i = process.argv.indexOf(name);

    return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}

const openPage = process.argv.includes('--open');
const target = readOption('--target', openPage ? 'slots' : 'default');
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

// 语言钉死成 zh-CN：判据是**用户在界面上看到的字**（PANEL_LABELS 是中文），而编辑器的语言
// 来自 navigator.language——CI 的 runner 是 en-US，会渲染成 Hierarchy / Scene / …（实测 6/12）。
// 固定语言让"同一份代码在任何 runner 上同结果"。
const opened = openPage ? await openBridgePage(base, target, { locale: 'zh-CN' }) : null;
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
 * 界面上的标签文字（按 DOM 顺序）。
 *
 * @returns {Promise<string[]>} 标签文字
 */
async function tabLabels()
{
    return page.$$eval('.el-tabs__item', (nodes) => nodes.map((node) => node.textContent?.trim() ?? ''));
}

/**
 * 贡献表里的面板 id（清单侧）。
 *
 * @returns {Promise<string[]>} 面板 id
 */
async function panelIds()
{
    const table = await call('editor.plugins');

    return table.panels.map((panel) => panel.id);
}

/**
 * 贡献表里的**浮层** id（清单侧）。
 *
 * 与 {@link panelIds} 分开：浮层贡献点不在 `table.panels` 里，用面板 id 去等浮层状态
 * 会**永远立即成立**（这个等待等于没有，实测踩过）。
 *
 * @returns {Promise<string[]>} 浮层 id
 */
async function overlayIds()
{
    const table = await call('editor.plugins');

    return table.sceneOverlays.map((overlay) => overlay.id);
}

/**
 * 轮询等条件成立。
 *
 * **不用固定 sleep**：要验的恰恰是"慢机器上的时序"，拍脑袋的等待会把同一类问题搬进自检。
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
 * 切换插件启用状态。
 *
 * @param {string} pluginId 插件 id
 * @param {boolean} enabled 是否启用
 */
async function togglePlugin(pluginId, enabled)
{
    await call('editor.setPlugin', { id: pluginId, enabled });
}

console.log(`插槽驱动的界面自检（${base}，target=${target}）`);

try
{
    // ---- 起点归一：插件开关是**持久化**的（localStorage），上一次跑失败会留下"层级被禁用"的状态。
    // 显式设回启用，让本脚本不依赖"上一次跑得干净"（也给本地手动跑的人一个确定的起点）----
    await togglePlugin(HIERARCHY, true);
    await togglePlugin(PARTICLE, true);
    await waitFor(async () => (await panelIds()).includes('hierarchy'), 10000);

    // ---- 判据 1：五个内置面板标签都在，且与贡献表面板数一致 ----
    const before = await tabLabels();
    for (const [pluginId, panelId] of Object.entries(PANEL_IDS))
    {
        check(`界面有「${PANEL_LABELS[panelId]}」标签（${pluginId}）`, before.includes(PANEL_LABELS[panelId]), before.join(' / '));
    }

    const idsBefore = await panelIds();
    check('界面标签数与贡献表面板数一致（清单 ↔ 插槽 ↔ 界面）', before.length === idsBefore.length,
        `界面 ${before.length} / 清单 ${idsBefore.length}`);

    // ---- 判据 2：关掉「层级」→ 标签消失（这就是 S2b 引入的那段接线）----
    await togglePlugin(HIERARCHY, false);
    const gone = await waitFor(async () => !(await tabLabels()).includes(PANEL_LABELS.hierarchy));
    check('关掉「层级」插件后，界面标签里没有「层级」', gone, (await tabLabels()).join(' / '));
    check('关掉后贡献表里也没有该面板', !(await panelIds()).includes('hierarchy'));

    // ---- 判据 3：恢复 → 标签回来 ----
    await togglePlugin(HIERARCHY, true);
    const back = await waitFor(async () => (await tabLabels()).includes(PANEL_LABELS.hierarchy));
    check('恢复后「层级」标签回来', back, (await tabLabels()).join(' / '));

    // ---- 判据 4：浮层插件不影响面板标签（插槽各管各的）----
    await togglePlugin(PARTICLE, false);
    const overlayGone = await waitFor(async () => !(await overlayIds()).includes('particle-controller'), 10000);
    check('关掉粒子插件后贡献表里没有该浮层', overlayGone, (await overlayIds()).join(' / '));
    check('关掉粒子插件不改变面板标签集合', (await tabLabels()).length === before.length, (await tabLabels()).join(' / '));

    // ---- 判据 5：pageerror 0 ----
    const pageErrors = opened?.pageErrors ?? [];
    check('全程页面无 pageerror', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
}
finally
{
    // 把开关恢复成启用：插件开关是持久化的，别把禁用状态留给下一次跑（或留给本地用户）
    try
    {
        await togglePlugin(PARTICLE, true);
        await togglePlugin(HIERARCHY, true);
    }
    catch (error)
    {
        console.log(`  ⚠️ 恢复插件开关失败（不影响判据）：${error.message}`);
    }

    await opened?.close();
}

console.log(`\n${failed === 0 ? '✅' : '❌'} 插槽界面自检：${total - failed}/${total} 通过`);
process.exit(failed === 0 ? 0 : 1);
