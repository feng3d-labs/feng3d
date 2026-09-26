import { defineConfig, devices } from 'playwright/test';
import { fileURLToPath } from 'node:url';

// ESM 下没有 __dirname，手动构造
const __dirname = fileURLToPath(new URL('.', import.meta.url));

const PORT = 3110;
const BASE_URL = `http://127.0.0.1:${PORT}`;

/**
 * 编辑器浏览器的 e2e 配置（与视觉回归的 playwright.config.ts 分开）。
 *
 * 解决的问题：编辑器有 4.3 万行代码，但只有 2 个 spec、且都是纯逻辑测试——
 * **UI 渲染链路没有任何自动化验证**。已发布的 feng3d-editor@0.7.2 主界面白屏
 * （index.html 缺 importmap，产物里的裸导入 "feng3d" 无法解析）就是这样漏出去的：
 * 纯逻辑测试全绿，而页面根本打不开。
 *
 * 与视觉回归配置的关键差异：
 * - 被测对象是**构建产物**（`packages/editor/public/`），而不是 dev server。
 *   白屏类缺陷只在产物形态下复现（dev 下由 vite 解析裸导入，问题被掩盖）。
 *   `webServer.command` 因此先构建再起静态服务。
 * - 不做像素比对，只断言「能渲染 + 无错误」。headless 环境通常没有 GPU，
 *   WebGPU 拿不到 adapter，像素比对在此毫无意义。
 * - 用 playwright 自带 chromium（而非系统 Chrome `channel: 'chrome'`），
 *   避免依赖运行环境预装浏览器。
 * - 给较长的超时：首次加载要等 CDN 与编辑器初始化。
 *
 * 用法：
 *   npm run test:e2e:editor
 */
export default defineConfig({
    testDir: './e2e',
    // 只跑编辑器用例，避免把 examples 的视觉回归也拉进来
    testMatch: /editor\.spec\.ts$/,
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    reporter: [['list'], ['html', { open: 'never', outputFolder: '.verify/editor-report' }]],
    outputDir: '.verify/editor-output',
    // 编辑器首屏包含 CDN 拉取与场景初始化，给足余量
    timeout: 150_000,

    use: {
        baseURL: BASE_URL,
        viewport: { width: 1280, height: 800 },
        headless: true,
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
        launchOptions: {
            // 尽量让 headless 也能拿到 WebGPU（拿不到时用例会显式容忍，见 spec）
            args: [
                '--enable-unsafe-webgpu',
                '--enable-features=Vulkan',
                '--ignore-gpu-blocklist',
            ],
        },
    },

    expect: { timeout: 30_000 },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // 先构建编辑器产物，再用包内的静态服务器提供（等价于用户 npx feng3d-editor）
    webServer: {
        command: `node scripts/run-in-packages.mjs build --only feng3d-editor && node packages/editor/bin/serve.mjs --port ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
        cwd: __dirname,
    },
});
