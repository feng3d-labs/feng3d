import { expect, test } from 'playwright/test';
import { readRecentErrors } from './frontendLogs';

/**
 * 粒子示例的**端到端门禁**（进 CI）。
 *
 * 为什么不在这里比对像素基线：examples 的视觉回归基线是在**真实 GPU** 上生成的，
 * 而 CI runner 只有软件渲染（SwiftShader），像素不可比。于是这一批分成两层：
 *
 * 1. **运行期无错误**（环境无关，CI 里始终有效）——页面脚本抛错、WebGPU 校验失败、
 *    着色器编译失败都会经 `@feng3d/error-logger` 落到前端日志里。这一层正是能提前抓住
 *    「子发射器引用被深合并拷成副本」这类崩溃的那道网。
 * 2. **画布有内容**（需要 WebGPU，CI 无 GPU 时 skip）——把 WebGPU 画布画到 2D 画布上统计亮像素，
 *    证明「粒子真的被画出来了」，而不是黑屏或只有背景；它不比对像素基线，所以不会因显卡差异而红。
 *
 * 清单与 `examples/index.js`、`e2e/examples.config.ts` 保持同步：新增粒子示例时三处一起加。
 */
const PARTICLESYSTEM_EXAMPLES = [
    'ParticleBasicTest',
    'ParticleAdditiveTest',
    'ParticleShapesTest',
    'ParticleFireTest',
    'ParticleSmokeTest',
    'ParticleExplosionTest',
    'ParticleSnowTest',
    'ParticlePortalTest',
    'ParticleTrailTest',
];

/**
 * 已知噪声：这些错误与粒子系统无关，出现时不算失败（每一条都写明判据与出现环境）。
 *
 * 1. favicon 404——所有示例页共有；
 * 2. `Device lost` / `Instance dropped error in getCompilationInfo`——CI runner 只有**软件 WebGPU**
 *    （SwiftShader），设备在几秒空闲后会被回收，引擎的 `device.lost` 回调
 *    （`packages/webgpu/src/utils/quitIfWebGPUNotAvailable.ts`）把它抛成未捕获错误。
 *    **本机真实 GPU 上不出现**（实测 18/18 全绿），因此按环境噪声处理；
 *    但**其它任何错误**仍然会让这一层红——这正是它能抓住「子发射器引用被拷成副本」这类崩溃的原因。
 */
const KNOWN_NOISE = [
    /Failed to load resource: the server responded with a status of 404/i,
    /device[^.]*lost/i,
    /Instance dropped error in getCompilationInfo/i,
];

/** 把 WebGPU 画布画到 2D 画布上，统计「亮像素」数量（大于阈值即认为画面有内容） */
async function countLitPixels(page: import('playwright/test').Page): Promise<number>
{
    return page.evaluate(() =>
    {
        const canvas = document.getElementById('webgpu') as HTMLCanvasElement | null;
        if (!canvas) return -1;

        const copy = document.createElement('canvas');
        copy.width = canvas.width;
        copy.height = canvas.height;

        const ctx = copy.getContext('2d');
        if (!ctx) return -1;

        ctx.drawImage(canvas, 0, 0);
        const data = ctx.getImageData(0, 0, copy.width, copy.height).data;
        let lit = 0;
        for (let i = 0; i < data.length; i += 4)
        {
            if (data[i] + data[i + 1] + data[i + 2] > 45) lit++;
        }

        return lit;
    });
}

for (const name of PARTICLESYSTEM_EXAMPLES)
{
    test.describe('particlesystem / ' + name, () =>
    {
        test('运行期无错误 (' + name + ')', async ({ page }) =>
        {
            const beforeTime = Date.now();
            const errors: string[] = [];

            page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
            page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

            await page.goto('/src/particlesystem/' + name + '.html', { waitUntil: 'load' });
            await page.waitForTimeout(3000);

            const unexpected = errors.filter((line) => !KNOWN_NOISE.some((re) => re.test(line)));
            expect(unexpected, '示例 ' + name + ' 在浏览器里抛错: ' + unexpected.join(' | ')).toEqual([]);

            const logged = readRecentErrors(beforeTime);
            expect(logged, '示例 ' + name + ' 运行期产生错误日志: ' + logged.join(' | ')).toEqual([]);
        });

        test('渲染循环在提交帧 (' + name + ')', async ({ page }) =>
        {
            // 统计 WebGPU 的队列提交次数：粒子系统的 update/beforeRender 每帧都会走 submit，
            // 只要它在跑，就说明这个示例真的把帧提交到了 GPU（而不是黑屏/停在初始化）。
            await page.addInitScript(() =>
            {
                (window as unknown as { __gpuSubmits: number }).__gpuSubmits = 0;

                const queue = (globalThis as unknown as { GPUQueue?: { prototype: Record<string, unknown> } }).GPUQueue;
                if (queue && queue.prototype && !queue.prototype.__dshPatched)
                {
                    const original = queue.prototype.submit as (...args: unknown[]) => unknown;
                    queue.prototype.submit = function (this: unknown, ...args: unknown[])
                    {
                        (window as unknown as { __gpuSubmits: number }).__gpuSubmits++;

                        return original.apply(this, args);
                    };
                    queue.prototype.__dshPatched = true;
                }
            });

            await page.goto('/src/particlesystem/' + name + '.html', { waitUntil: 'load' });

            const gpuAvailable = await page.evaluate(() => !!(navigator as { gpu?: unknown }).gpu).catch(() => false);
            test.skip(!gpuAvailable, '环境无 WebGPU，跳过「渲染循环在提交帧」（上一层「运行期无错误」仍然有效）');

            await page.waitForTimeout(3000);

            const submits = await page.evaluate(() => (window as unknown as { __gpuSubmits: number }).__gpuSubmits || 0);
            expect(submits, '示例 ' + name + ' 三秒内没有提交任何帧（__gpuSubmits=' + submits + '）').toBeGreaterThan(10);
        });
    });
}
