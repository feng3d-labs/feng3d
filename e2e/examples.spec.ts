import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page } from 'playwright/test';
import { EXAMPLES } from './examples.config';
import { FREEZE_SCRIPT } from './freeze';

// ESM 下没有 __dirname，手动构造（指向 e2e 目录）
const __dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * 示例视觉回归测试。
 *
 * 所有示例都通过 `ticker.onframe` 持续渲染（旋转/变色），逐帧像素不可复现。
 * 这里通过 `page.addInitScript` 在页面任何脚本执行**之前**注入 FREEZE_SCRIPT，
 * 劫持 `requestAnimationFrame` 使其只回调固定 `frames` 次后停止，
 * 从而把画面定格在第 N 帧（确定、可复现），再与基线图严格像素对比。
 *
 * 不修改任何示例源码。
 */


/**
 * 日志目录：由 @feng3d/error-logger 插件写入。
 *
 * AGENTS.md 规范要求改代码后检查运行日志；这里同步校验示例运行期无 ❌ error。
 */
const LOGS_DIR = path.join(__dirname, '..', 'examples', 'logs');

/**
 * 读取最新一个 frontend_*.log，返回其中 level 为 error 的行（含 '❌'）。
 *
 * 不同示例可能共享同一日志文件（按客户端 id 区分），这里仅取「最近写入」的文件，
 * 并按本次会话时间窗过滤，保证检测的是本次渲染产生的错误。
 */
function readRecentErrors(afterTime: number): string[]
{
    let files: string[] = [];
    try
    {
        files = readdirSync(LOGS_DIR)
            .filter((f) => f.startsWith('frontend_') && f.endsWith('.log'))
            .map((f) => ({ f, mtime: statSync(path.join(LOGS_DIR, f)).mtimeMs }))
            .filter((x) => x.mtime >= afterTime)
            .sort((a, b) => b.mtime - a.mtime)
            .map((x) => x.f);
    } catch
    {
        return [];
    }

    const errors: string[] = [];
    for (const f of files)
    {
        let content = '';
        try
        {
            content = readFileSync(path.join(LOGS_DIR, f), 'utf-8');
        } catch
        {
            continue;
        }
        for (const line of content.split('\n'))
        {
            if (line.includes('❌') || /\berror\b/i.test(line) && !line.includes('error-logger'))
            {
                errors.push(`${f}: ${line.trim()}`);
            }
        }
    }
    return errors;
}

/**
 * 运行单个示例：注入冻结脚本 → 打开页面 → 等待定格 → 断言截图。
 */
async function runExample(page: Page, spec: {
    category: string;
    name: string;
    warmupFrames: number;
    freezeFrames: number;
    maxDiffPixelRatio?: number;
    /** 若给出，则断言页面 `#info` 的文案包含它（说明文字不参与像素比对，需要单独守） */
    infoContains?: string;
})
{
    const beforeTime = Date.now();

    // 1. 在页面任何脚本执行前注入冻结桩（warmup + freeze 两阶段配置）
    await page.addInitScript({
        content: `window.__freeze = { warmupFrames: ${spec.warmupFrames}, freezeFrames: ${spec.freezeFrames} };`,
    });
    await page.addInitScript({
        content: `(${FREEZE_SCRIPT})(window);`,
    });

    // 2. 打开示例
    const url = `/src/${spec.category}/${spec.name}.html`;
    await page.goto(url, { waitUntil: 'load' });

    // WebGPU 可用性检查（goto 后）
    const gpuAvailable = await page.evaluate(() => !!(navigator as any).gpu).catch(() => false);
    test.skip(!gpuAvailable, `环境无 WebGPU，跳过 ${spec.name}`);

    // 3. 等待定格完成（FREEZE_SCRIPT 渲染完指定帧数后置 __freezeDone）
    await page.waitForFunction(
        () => (window as any).__freezeDone === true,
        undefined,
        { timeout: 20000 },
    );

    // 4. 校验日志无 error（AGENTS.md 规范）
    const errors = readRecentErrors(beforeTime);
    expect(errors, `示例 ${spec.name} 运行期产生错误日志:\n${errors.join('\n')}`).toEqual([]);

    // 5. 截图与基线对比
    const canvas = page.locator('#webgpu');
    await expect(canvas).toBeVisible();
    //
    // **mask 掉 `#info`**：那是页面左上/居中的说明文字（HTML 里的 `<div id="info">`），
    // 不属于渲染内容，却会出现在 canvas 区域的截图里（Playwright 截的是该区域的像素，含叠层）。
    // 它的改动只占全图约 0.8%，**正好落在默认 1% 容差以内**，于是文字写错也测不出来——
    // 实测：把 `#info` 从「OrbitControls…」改成原示例的「three.js - shadowmap - models by mirada from rome」，
    // 像素比对依然通过、`--update-snapshots` 也认为无需更新，基线因此长期停留在旧内容。
    // 遮掉它之后，像素基线只反映真正的渲染画面；文字内容由下面那条断言负责。
    await expect(canvas).toHaveScreenshot(`${spec.name}.png`, {
        mask: [page.locator('#info')],
        // 个别示例（如基于 Date.now 的动画）无法完全定格，按配置放宽像素容差
        ...(spec.maxDiffPixelRatio !== undefined && { maxDiffPixelRatio: spec.maxDiffPixelRatio }),
    });

    // 6. 说明文字单独断言（像素里被 mask 掉了，这里补回来）
    //    不是每个示例都有 `#info`；有就要求非空，spec 里给了 `infoContains` 就还要求包含该片段——
    //    只判非空挡不住「文字写错」，而写错恰好是这次真实发生过的问题（见上面 mask 的注释）。
    const infoText = await page.evaluate(() => document.getElementById('info')?.innerText?.replace(/\s+/g, ' ').trim() ?? null);
    if (infoText !== null)
    {
        expect(infoText.length, `示例 ${spec.name} 的 #info 说明文字为空`).toBeGreaterThan(0);
        if (spec.infoContains !== undefined)
        {
            expect(infoText, `示例 ${spec.name} 的 #info 文案与预期不符`).toContain(spec.infoContains);
        }
    }
}

/**
 * 已知引擎缺陷：这些示例在自然运行（不经任何测试桩）时即抛错，
 * 属于引擎渲染层 bug，与本「编写视觉回归测试」任务无关。
 *
 * 此处标记 fixme：测试套件整体保持绿色，同时缺陷对后续工作可见。
 * bug 修复后应将对应条目从本表删除。
 */
const KNOWN_ENGINE_BUGS: Record<string, string> = {
    // 目前为空。曾记录 DebugShadowMap「地面与全屏调试平面不可见」：
    // 绑定层的键名 bug（TSL 的深度采样器展开名是 `s_texture_texture`、数据侧原先写 `s_texture`）
    // 此前已修；剩下的"不可见"是相机太近——8×8 的调试平面铺满视口，把地面整个挡住了。
    // 相机后移后地面与调试平面同框，该条目已移除、恢复为普通视觉回归。
};

// 数据驱动：为每个示例生成一个 describe + test。
// 分档过滤（E2E_TIER 环境变量，默认 typical）：
//   - typical：快速测试，仅典型示例（每分类代表用例）
//   - full：全面测试，包含全部示例（typical ∪ full 档）
const TIER = (process.env.E2E_TIER === 'full') ? 'full' : 'typical';
const TIERED_EXAMPLES = TIER === 'full'
    ? EXAMPLES
    : EXAMPLES.filter(spec => spec.tier === 'typical');

for (const spec of TIERED_EXAMPLES)
{
    test.describe(`${spec.category} / ${spec.name}`, () =>
    {
        const testFn = KNOWN_ENGINE_BUGS[spec.name] ? test.fixme : test;

        testFn(`渲染画面与基线一致 (${spec.name})`, async ({ page }) =>
        {
            await runExample(page, spec);
        });
    });
}
