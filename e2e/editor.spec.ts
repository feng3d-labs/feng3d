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
 * headless 环境下可接受的错误。
 *
 * 只白名单「明确由无 GPU 的 headless 造成」这一条；其余 WebGPU 错误一律照常报错，
 * 不做「凡是 WebGPU 就放过」的宽泛过滤——那会把真实的渲染缺陷一起吞掉。
 */
const HEADLESS_GPU_LIMITATION = /requestAdapter returned null/i;

/** 判断某条控制台/页面错误是否属于允许忽略的环境限制 */
function isAcceptedEnvironmentError(text: string): boolean
{
    return HEADLESS_GPU_LIMITATION.test(text);
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

/** 过滤掉可接受的环境限制后，返回真正需要关注的错误 */
function unexpectedErrors(errors: string[]): string[]
{
    return [...new Set(errors)].filter((e) => !isAcceptedEnvironmentError(e));
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

    test('没有未预期的控制台错误', async ({ page }) =>
    {
        const errors: string[] = [];
        await openEditor(page, errors);

        // 给异步加载（场景资源、缩略图）留出报错时间
        await page.waitForTimeout(3000);

        const unexpected = unexpectedErrors(errors);
        expect(
            unexpected,
            `主界面出现未预期的控制台错误：\n${unexpected.join('\n')}`,
        ).toEqual([]);
    });
});
