import { defineConfig, devices } from 'playwright/test';
import { fileURLToPath } from 'node:url';

// ESM 下没有 __dirname，手动构造
const __dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * Playwright 视觉回归测试配置。
 *
 * - 自动启动 examples 的 vite dev server（端口 3000），已运行则复用
 * - 串行执行（fullyParallel: false）避免多页面抢占 GPU 导致渲染抖动
 * - 截图基线存放在仓库根 .verify/ 目录
 *
 * 用法：
 *   首次生成基线：npx playwright test --update-snapshots
 *   常规验证：    npm run test:e2e
 *   交互调试：    npm run test:e2e:ui
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    workers: 1,
    retries: 0,
    reporter: [['list'], ['html', { open: 'never', outputFolder: '.verify/report' }]],

    // 基线截图输出位置：.verify/<测试文件名>/<截图名>.png
    snapshotPathTemplate: '.verify/{testFileName}/{arg}{ext}',
    outputDir: '.verify/output',

    use: {
        // dev server 基址（配合 webServer 配置），测试里用相对路径 goto
        baseURL: 'http://localhost:3000',
        // WebGPU 需要稳定视口，固定尺寸保证像素可复现
        viewport: { width: 800, height: 600 },
        // WebGPU 在某些系统下 headless 不可用，默认 headed；CI 可设 PLAYWRIGHT_HEADLESS=1
        headless: !!process.env.PLAYWRIGHT_HEADLESS,
        // 截图比较容差：抗不同 GPU 厂商间的细微像素差
        screenshot: 'off',
        trace: 'retain-on-failure',
    },

    // 截图断言默认阈值：允许 1% 像素不同
    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.01,
            animations: 'disabled',
        },
        timeout: 15000,
    },

    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // 优先使用系统已装的 Chrome 稳定版（避免依赖 playwright 下载的 CFT）。
                // 若未装系统 Chrome，需先 `npx playwright install chromium` 并移除下面 channel。
                channel: 'chrome',
                // 显式启用 WebGPU 相关特性
                launchOptions: {
                    args: [
                        '--enable-unsafe-webgpu',
                        '--enable-features=Vulkan',
                        '--ignore-gpu-blocklist',
                    ],
                },
            },
        },
    ],

    // 自动启动 examples dev server
    webServer: {
        command: 'npm --prefix examples run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
        cwd: __dirname,
    },
});
