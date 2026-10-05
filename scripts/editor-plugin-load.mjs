/**
 * #276 验收②的**真页面**验证：不重新构建编辑器，就装上一个面板插件。
 *
 * 纯函数测试（`packages/editor/test/pluginLoader.spec.ts`）验的是装载器的逻辑；
 * 这里验的是**浏览器里真的走通了**：页面加载 → 从插件包装载 client 半 → 清单登记 →
 * 重投插槽 → 界面标签真的多一个 → 卸载 → 标签真的少一个。
 *
 * 装载器是编辑器自己的模块，在 vite dev server 下用 `import('/src/plugins/loader/index.ts')`
 * 取（与宿主将来"注入入口图"走的是同一段代码，只是入口不同）。
 *
 * **注意：CI 不跑本脚本**（2026-10-05，决策 ①）。本脚本依赖 `vite dev server` 提供 `.ts`
 * 源模块，而 CI 的 editor-e2e job 现在起的是**宿主**（静态服务器，拿不到 `/src/*.ts`）。
 * 同一条验收（#276 验收②）在 CI 里由 `editor-plugin-host-load.mjs` 承担 —— 它跑的是**产物形态**
 * （起宿主 + 真构建产物 + 真插件包），更接近真实交付。本脚本保留，供本地 `npm run dev` 时用。
 *
 * 用法：
 *   node scripts/editor-plugin-load.mjs --open                 # 自己开页面（CI 用这个）
 *   node scripts/editor-plugin-load.mjs --url http://localhost:3010
 *
 * 退出码：0 全部通过；1 有失败。
 */
import { openBridgePage } from './editor-bridge-page.mjs';

const PLUGIN_ID = '@feng3d/editor-plugin-rotate';

const openPage = process.argv.includes('--open');

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

const base = (readOption('--url') || process.env.EDITOR_BRIDGE_URL || 'http://localhost:3000').replace(/\/$/, '');
const target = readOption('--target', 'plugin-load');

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

const opened = openPage ? await openBridgePage(base, target) : null;
const page = opened?.page ?? null;

if (!page)
{
    console.error('需要 --open（自己开页面）或先手动打开编辑器页面');
    process.exit(1);
}

/** 页面级报错（全程收集） */
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message.split('\n')[0]));

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
 * 等条件成立。
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
        await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return false;
}

/**
 * 在页面里调用装载器的某个函数（装载器是编辑器自己的模块）。
 *
 * @param {'loadPluginPackage' | 'unloadPluginPackage'} action 动作
 * @returns {Promise<unknown>} 结果
 */
import { createPluginLoaderCaller } from './editor-utils/pluginLoaderCall.mjs';

// **在页面里装载/卸载插件包**走共用实现（`scripts/editor-utils/pluginLoaderCall.mjs`）：
// 它既是**唯一实现**（原先本脚本与 `editor-mcp-plugin-tools.mjs` 各写了一份），
// 也把等待方式换成了"页面侧启动 + Node 侧轮询"——直接 `await` 长任务会让 promise 长 pending，
// 被 V8 GC 后 Playwright 报 `Resulting promise was garbage collected`，CI 随机红（issue #669）。
const { call: callLoader, pollRounds } = createPluginLoaderCaller({ page, pluginId: PLUGIN_ID });

/**
 * 读插槽上 `panel.main` 座位的占用 id（界面渲染读的就是它）。
 *
 * @returns {Promise<string[]>} 占用 id
 */
async function slotPanelIds()
{
    return page.evaluate(async () =>
    {
        const slots = await import('/src/plugins/slots/index.ts');

        return slots.getEditorSlots().entries('panel.main').map((entry) => entry.id);
    });
}

console.log(`[插件运行时装载] ${base}（target=${target}）`);

// 等到编辑器就绪（界面已经渲染出标签）
const ready = await waitFor(async () => (await tabLabels()).length > 0);

check('编辑器界面已就绪（有标签）', ready, `标签：${(await tabLabels()).join(' / ') || '（还没有）'}`);

const before = await tabLabels();

check(`装载前界面标签里没有这个插件的面板`, !(await slotPanelIds()).includes('rotate.panel'));

const loaded = await callLoader('loadPluginPackage');

check('从插件包装载成功（problems 为空）', loaded?.loaded === true && loaded.problems?.length === 0,
    loaded?.problems?.length ? `problems=${JSON.stringify(loaded.problems)}` : '');

check('插槽上出现了它的面板（清单 → 插槽 → 界面这条链）',
    await waitFor(async () => (await slotPanelIds()).includes('rotate.panel')));

const grew = await waitFor(async () => (await tabLabels()).length === before.length + 1);

check('**界面标签真的多了一个**（不重新构建就装上面板）', grew,
    `装载前 ${before.length} 个 → 现在 ${(await tabLabels()).length} 个：${(await tabLabels()).join(' / ')}`);

const unloaded = await callLoader('unloadPluginPackage');

check('卸载成功', unloaded?.unloaded === true);

check('卸载后插槽上的面板消失', await waitFor(async () => !(await slotPanelIds()).includes('rotate.panel')));

check('卸载后界面标签回到原来的数量', await waitFor(async () => (await tabLabels()).length === before.length),
    `现在：${(await tabLabels()).join(' / ')}`);

// **方法自证**：这条修法的关键是"轮询路径真的被走到"——没走到就说明它只是看着像修好了
// （每次 `callLoader` 至少轮询一轮，两次装载至少 2 轮）
check('轮询路径真的被走到过（方法自证）', pollRounds() >= 2, `轮询了 ${pollRounds()} 轮`);

check('全程页面无 pageerror', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

await opened.browser.close();

process.exit(failed === 0 ? 0 : 1);
