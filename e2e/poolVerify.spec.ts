import { expect, test } from 'playwright/test';
import { PNG } from 'pngjs';

/**
 * GPU 资源池真机验证（issue #98）。
 *
 * 这条用例只在**有 GPU 的环境**有意义（本机 RTX 3070 + Chrome headless 实测可用）：
 * - 池化开启与关闭的画面必须**逐像素一致**（复用不得改变渲染结果）；
 * - 池化开启时必须真的发生「归还 + 复用」（否则池只是摆设）。
 *
 * 注意：CI 的 runner 没有 GPU（像素层未进 workflow），本用例在本地（或带 GPU 的 runner）跑。
 * 默认走 `playwright.config.ts` 的 examples dev server（`http://localhost:3000`）；
 * 若该端口被别的服务占用（例如编辑器 dev server），用 `EXAMPLES_URL` 指向真正的 examples server。
 */

const EXAMPLES_URL = process.env.EXAMPLES_URL ?? 'http://localhost:3000';

interface PoolStats
{
    buffer: { reused: number; released: number; destroyed: number; idle: number };
    texture: { reused: number; released: number; destroyed: number; idle: number };
    renders: number;
}

async function readStats(page: import('playwright/test').Page): Promise<PoolStats>
{
    return page.evaluate(() => (window as unknown as { __poolStats: () => PoolStats }).__poolStats());
}

test.describe('GPU 资源池真机验证（#98）', () =>
{
    test('池化开启：画面与关闭逐像素一致，且池发生归还与复用', async ({ page }) =>
    {
        const errors: string[] = [];

        page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
        page.on('pageerror', (error) => errors.push(String(error)));

        // 关闭（发布默认）
        await page.goto(`${EXAMPLES_URL}/src/base/PoolVerify.html`);
        await page.waitForFunction(() => (window as unknown as { __poolReady?: boolean }).__poolReady === true, undefined, { timeout: 30000 });

        const offStats = await readStats(page);
        const offShot = await page.screenshot();

        // 开启
        await page.goto(`${EXAMPLES_URL}/src/base/PoolVerify.html?pool=1`);
        await page.waitForFunction(() => (window as unknown as { __poolReady?: boolean }).__poolReady === true, undefined, { timeout: 30000 });
        await page.waitForTimeout(1500);

        const onStats = await readStats(page);
        const onShot = await page.screenshot();

        // 关闭时池不活动
        expect(offStats.texture.reused).toBe(0);
        expect(offStats.texture.released).toBe(0);

        // 开启时真的发生「归还 → 复用」
        expect(onStats.texture.released).toBeGreaterThan(0);
        expect(onStats.texture.reused).toBeGreaterThan(0);

        // 画面逐像素一致（复用没有引入残留 / 错位）
        const a = PNG.sync.read(offShot);
        const b = PNG.sync.read(onShot);
        let changed = 0;

        for (let i = 0; i < a.data.length; i++)
        {
            if (a.data[i] !== b.data[i]) changed++;
        }
        expect(changed).toBe(0);
        expect(errors).toEqual([]);
    });
});
