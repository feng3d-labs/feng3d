import { defineConfig, devices } from 'playwright/test';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * packages/webgpu/examples 的视觉回归配置（issue #712）。
 *
 * 与根 `playwright.config.ts` 分开：那个起的是 feng3d 的 examples（端口 3000），
 * 这里起的是 packages/webgpu/examples（端口 3200），两者是两个 app。
 *
 * 运行：`npx playwright test --config playwright.webgpu-examples.config.ts`
 * 生成基线（**在 master 上**）：加 `--update-snapshots`。
 */
export default defineConfig({
    testDir: './e2e',
    testMatch: 'webgpuExamples.spec.ts',
    fullyParallel: false,
    workers: 1,
    retries: 0,
    reporter: [['list']],
    snapshotPathTemplate: '.verify/{testFileName}/{arg}{ext}',
    outputDir: '.verify/webgpu-examples-output',
    use: {
        baseURL: 'http://localhost:3200',
        viewport: { width: 800, height: 600 },
        headless: !!process.env.PLAYWRIGHT_HEADLESS,
        screenshot: 'off',
        trace: 'off',
    },
    expect: {
        toHaveScreenshot: { maxDiffPixels: 0, animations: 'disabled' },
        timeout: 20000,
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                channel: 'chrome',
                launchOptions: { args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--ignore-gpu-blocklist'] },
            },
        },
    ],
    webServer: {
        command: 'npm --prefix packages/webgpu/examples run dev -- --port 3200 --strictPort',
        url: 'http://localhost:3200',
        reuseExistingServer: false,
        timeout: 120_000,
        cwd: __dirname,
    },
});
