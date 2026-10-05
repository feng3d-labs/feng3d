import path from 'node:path';
import { test, expect } from 'playwright/test';
import { gotoFrozen } from './freeze';
import { WEBGPU_EXAMPLES } from './webgpuExamples.config';

/**
 * packages/webgpu/examples 的视觉回归（issue #712）。
 *
 * 与 `examples.spec.ts` 一样：示例逐帧渲染，先用 FREEZE_SCRIPT 把画面定格到确定的一帧，
 * 再与基线严格像素对比。基线在 **master** 上生成（`--update-snapshots`），
 * 于是"跑通"就等于"与 TSL 化之前逐像素一致"。
 *
 * 运行：`npx playwright test --config playwright.webgpu-examples.config.ts`
 * 生成/更新基线：在上面的命令后加 `--update-snapshots`（**必须在 master 上跑**）。
 */
for (const spec of WEBGPU_EXAMPLES)
{
    test.describe('webgpu / ' + spec.name, () =>
    {
        test('渲染画面与基线一致 (' + spec.name + ')', async ({ page }) =>
        {
            await gotoFrozen(page, spec.url, spec);
            // canvas 是绘制目标；这里截整个视口（含说明文字，同样是稳定内容）
            // 容差见 config 里 maxDiffPixelRatio 的说明：这些示例的画面本身有 ~1% 的抖动
            await expect(page).toHaveScreenshot(path.basename(spec.name) + '.png', {
                maxDiffPixelRatio: spec.maxDiffPixelRatio,
                maxDiffPixels: undefined,
            });
        });
    });
}
