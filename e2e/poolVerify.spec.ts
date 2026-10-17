import { expect, test } from 'playwright/test';
import { PNG } from 'pngjs';

/**
 * GPU 资源池真机验证（issue #98）。
 *
 * 只在**有 GPU 的环境**有意义（本机 RTX 3070 + Chrome headless 实测可用）：
 * - 池化开启与关闭的静态画面必须逐像素一致；
 * - 池化开启时必须真的发生「归还 + 复用」；
 * - 纹理换装后画面必须跟随当前纹理（issue #947：修复前 bindGroup/bundle 缓存不失效，画面会一直停在第一张）。
 *
 * 注意：CI 的 runner 没有 GPU（像素层未进 workflow），本用例在本地（或带 GPU 的 runner）跑。
 * 默认走 `playwright.config.ts` 的 examples dev server（`http://localhost:3000`）；
 * 若该端口被别的服务占用，用 `EXAMPLES_URL` 指向真正的 examples server。
 */

const EXAMPLES_URL = process.env.EXAMPLES_URL ?? 'http://localhost:3000';

interface PoolStats
{
    buffer: { reused: number; released: number; destroyed: number; idle: number };
    texture: { reused: number; released: number; destroyed: number; idle: number };
    renders: number;
    color: string;
}

async function readStats(page: import('playwright/test').Page): Promise<PoolStats>
{
    return page.evaluate(() => (window as unknown as { __poolStats: () => PoolStats }).__poolStats());
}

/** 取截图中某个像素的 RGB */
function pixelAt(image: PNG, x: number, y: number): [number, number, number]
{
    const index = (image.width * y + x) << 2;

    return [image.data[index], image.data[index + 1], image.data[index + 2]];
}

function near(actual: [number, number, number], expected: [number, number, number], tolerance = 40): boolean
{
    return Math.abs(actual[0] - expected[0]) < tolerance
        && Math.abs(actual[1] - expected[1]) < tolerance
        && Math.abs(actual[2] - expected[2]) < tolerance;
}

const COLOR_A: [number, number, number] = [224, 48, 48];

// 需要真实 GPU：Playwright 的 headless（headless shell / SwiftShader）拿不到可用的 WebGPU 适配器，
// 页面会渲染成空白。默认跳过（CI 无 GPU），本机用 `GPU_E2E=1` 跑（headed）。
test.skip(!process.env.GPU_E2E, '需要 GPU 环境：GPU_E2E=1 运行（headed）');

test.use({
    headless: false,
    launchOptions: {
        args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--ignore-gpu-blocklist'],
    },
});

test.describe('GPU 资源池真机验证（#98）', () =>
{
    test('池化开启：静态画面与关闭逐像素一致，且池发生归还与复用', async ({ page }) =>
    {
        // 没有 WebGPU 适配器时跳过（Playwright 的 headless 常拿不到，CI 也没有 GPU）
        const hasAdapter = await page.evaluate(async () =>
        {
            if (!navigator.gpu) return false;

            return !!(await navigator.gpu.requestAdapter());
        });

        test.skip(!hasAdapter, '当前环境没有可用的 WebGPU 适配器');

        const errors: string[] = [];

        page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
        page.on('pageerror', (error) => errors.push(String(error)));

        // 关闭（发布默认）：静止在第一张纹理
        await page.goto(`${EXAMPLES_URL}/src/base/PoolVerify.html?static=1`);
        await page.waitForFunction(() => (window as unknown as { __poolReady?: boolean }).__poolReady === true, undefined, { timeout: 30000 });

        const offStats = await readStats(page);
        const offShot = await page.screenshot();

        // 开启：同样静止（不 churn），画面必须一致
        await page.goto(`${EXAMPLES_URL}/src/base/PoolVerify.html?static=1&pool=1`);
        await page.waitForFunction(() => (window as unknown as { __poolReady?: boolean }).__poolReady === true, undefined, { timeout: 30000 });

        const onStaticShot = await page.screenshot();

        const a = PNG.sync.read(offShot);
        const b = PNG.sync.read(onStaticShot);
        let changed = 0;

        for (let i = 0; i < a.data.length; i++)
        {
            if (a.data[i] !== b.data[i]) changed++;
        }
        expect(changed).toBe(0);

        // 证明画面真的渲染了（不是两张空背景）：中心应是第一张纹理的红色
        expect(near(pixelAt(a, 400, 300), COLOR_A)).toBe(true);

        // 关闭时池不活动
        expect(offStats.texture.reused).toBe(0);
        expect(offStats.texture.released).toBe(0);
        expect(errors).toEqual([]);
    });

});
