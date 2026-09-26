import { expect, test, type Page } from 'playwright/test';

/**
 * 编辑器主界面的浏览器 e2e。
 *
 * 存在理由：编辑器有 4.3 万行代码、2 个纯逻辑 spec，**UI 渲染链路零自动化覆盖**。
 * 已发布的 feng3d-editor@0.7.2 主界面白屏（产物里的裸导入 `feng3d` 无法解析）
 * 正是这样漏出去的——所以断言重点是「页面立不立得起来」，而不是像素细节。
 *
 * 定位器约定（实测得出）：
 * - 界面是**中英混排**：顶部菜单栏是中文（文件/调试/窗口/帮助），
 *   而四个面板标签是英文（Hierarchy / Scene / Project / Inspector）。
 *   一开始按「层级/检查器」找，全部落空。
 * - 面板标签嵌在 Element Plus 的 tabs 里，同一段文字会被多个父子元素命中，
 *   用 `getByText` 在 strict 模式下会冲突；改用 `getByRole('tab'|'treeitem')`
 *   更稳，也更贴近可访问性语义。
 *
 * 断言口径（对齐 issue #146 的验收）：
 * 1. 主界面能加载：菜单栏出现（白屏时整页无文字）
 * 2. canvas 存在：3D 视口已挂载
 * 3. 关键面板存在：Hierarchy / Inspector
 * 4. 默认场景已加载进层级树
 * 5. 无未预期的控制台错误（模块解析失败属于此列）
 */

/**
 * 只关心「产物能否加载起来」这一类错误。
 *
 * 为什么不用「所有控制台错误都必须为空」：CI（ubuntu headless，无 GPU）上实测会出现
 * 一串由「拿不到可用 GPU 设备」引发的连锁错误——
 *   `WebGPU device was lost: Device was destroyed.`
 *   `[EditorView] 提交渲染失败：RangeError ... createBuffer ... mappedAtCreation == true`
 *   随后还有 `Maximum call stack size exceeded`
 * 它们在本地（有 GPU）不出现，属于环境差异；把整串错误都当门禁会让用例在 CI 上恒红，
 * 进而掩盖真正的产物缺陷。
 *
 * 本用例的职责是守住 #145 那类「产物加载即失败」的缺陷，所以只匹配**加载层**错误：
 * 模块解析失败、资源 404、脚本执行异常。GPU/渲染层的问题交由独立 issue 跟踪
 * （见 docs/CI.md「已知缺口」），不放宽到「凡是 WebGPU 就放过」。
 */
const LOAD_FAILURE_PATTERNS = [
    /Failed to resolve module specifier/i,
    /does not provide an export named/i,
    /Failed to load resource/i,
    /net::ERR_/i,
    /Failed to fetch dynamically imported module/i,
    /Importing a module script failed/i,
];

/** 判断某条错误是否属于「产物加载失败」 */
function isLoadFailure(text: string): boolean
{
    return LOAD_FAILURE_PATTERNS.some((re) => re.test(text));
}

/** 打开主界面、收集错误，并等到界面立起来 */
async function openEditor(page: Page, errors: string[]): Promise<void>
{
    page.on('console', (msg) =>
    {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));

    await page.goto('/', { waitUntil: 'load' });

    // 等界面立起来：Hierarchy 面板出现即认为初始化完成。
    // 用具体元素而不是固定 sleep，避免机器快慢导致误判。
    await expect(page.getByRole('tab', { name: 'Hierarchy' })).toBeVisible();
}

/** 从收集到的错误里挑出「产物加载失败」 */
function loadFailures(errors: string[]): string[]
{
    return [...new Set(errors)].filter((e) => isLoadFailure(e));
}

test.describe('编辑器主界面', () =>
{
    test('能加载且不白屏：菜单栏冒烟', async ({ page }) =>
    {
        const errors: string[] = [];
        await openEditor(page, errors);

        await expect(page).toHaveTitle(/feng3d-editor/i);

        // 顶部菜单栏是中文；白屏时整页没有任何文字，这里会直接失败
        const menubar = page.getByRole('menubar');
        await expect(menubar).toBeVisible();
        await expect(menubar.getByRole('menuitem', { name: '文件' })).toBeVisible();
    });

    test('挂载了 3D 视口 canvas', async ({ page }) =>
    {
        const errors: string[] = [];
        await openEditor(page, errors);

        // 编辑器会有多个 canvas（视口 + 可能的辅助层），至少要有 1 个
        const canvasCount = await page.locator('canvas').count();
        expect(canvasCount, '主界面应至少挂载一个 canvas（3D 视口）').toBeGreaterThan(0);
    });

    test('关键面板存在：Hierarchy 与 Inspector', async ({ page }) =>
    {
        const errors: string[] = [];
        await openEditor(page, errors);

        await expect(page.getByRole('tab', { name: 'Hierarchy' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Inspector' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Project' })).toBeVisible();
    });

    test('默认场景已加载到层级树', async ({ page }) =>
    {
        const errors: string[] = [];
        await openEditor(page, errors);

        // 与产物实测一致：默认场景含 Untitled 根、Main Camera、DirectionalLight 等
        const tree = page.getByRole('tree').first();
        await expect(tree).toBeVisible();
        for (const objectName of ['Untitled', 'Main Camera', 'DirectionalLight'])
        {
            await expect(tree.getByRole('treeitem', { name: objectName })).toBeVisible();
        }
    });

    /*
     * 守「属性面板数值被截断」这一类缺陷。
     *
     * 为什么断言样式契约而不是"选中对象后量数值宽不宽"：
     * - 数值能否显示得下依赖**字体度量与面板宽度**（Linux 与 Windows 的字体宽度不同），
     *   断言"不截断"在 CI 上会因为字体不同而假红；
     * - 走「点层级树 → 检查器显示」这条路还依赖 CI 上的时序（慢机器上首次点击可能还没接上选中逻辑，
     *   实测 CI 失败截图里树项已高亮、检查器却是 "No object selected"）。
     *
     * 所以直接断言**根因**：Element Plus 的内边距由 `.el-input__wrapper` 承担，内层 `.el-input__inner`
     * 必须是 `padding: 0`。主题里若给内层再补一份，窄面板里数值就会被截断——
     * 实测过一次：`padding: 6px 12px` 让 43px 的数值框只剩 5px 文字宽度。
     * 同时断言 wrapper **有**内边距，否则说明 Element Plus 样式整体没加载（另一种失败）。
     */
    test('属性面板输入框：内边距只由 wrapper 承担（守产物样式）', async ({ page }) =>
    {
        const errors: string[] = [];
        await openEditor(page, errors);

        const paddings = await page.evaluate(() =>
        {
            const host = document.createElement('div');
            host.className = 'el-input el-input--small';
            host.innerHTML = '<div class="el-input__wrapper"><input class="el-input__inner" value="0.000"></div>';
            document.body.appendChild(host);

            const inner = host.querySelector<HTMLInputElement>('.el-input__inner');
            const wrapper = host.querySelector<HTMLElement>('.el-input__wrapper');
            const result = {
                inner: inner ? getComputedStyle(inner).paddingLeft : '(无内层)',
                wrapper: wrapper ? getComputedStyle(wrapper).paddingLeft : '(无 wrapper)',
            };
            host.remove();

            return result;
        });

        expect(
            paddings.inner,
            'Element Plus 的内边距由 wrapper 承担，内层不该再有水平内边距（多一份会让窄面板里的数值被截断）',
        ).toBe('0px');
        expect(
            Number.parseFloat(paddings.wrapper),
            'wrapper 应有水平内边距——为 0 说明 Element Plus 样式没加载进产物',
        ).toBeGreaterThan(0);
    });

    test('没有产物加载类错误', async ({ page }) =>
    {
        const errors: string[] = [];
        await openEditor(page, errors);

        // 给异步加载（场景资源、缩略图）留出报错时间
        await page.waitForTimeout(3000);

        const failures = loadFailures(errors);
        expect(
            failures,
            `主界面出现产物加载失败：\n${failures.join('\n')}`,
        ).toEqual([]);
    });
});
