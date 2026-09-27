import { defineConfig } from 'vitest/config';

// 配置 Vitest 以适配项目
export default defineConfig({
    // 设置测试环境
    test: {
        globals: true,
        // 仅扫描主仓 src/、各子包 test/ 与仓库根 test/ 的测试，
        // 排除子包 src/ 下的开发期测试副本（如 packages/reactivity/src/*.spec.ts，
        // 它们与 test/ 下重复且可能过时）
        include: [
            'packages/feng3d/src/**/*.spec.ts',
            'packages/*/test/**/*.spec.ts',
            'test/**/*.spec.ts',
        ],
        // 只排除构建产物与依赖，不再按子包排除：
        // packages/shortcut（依赖浏览器全局 self）与 packages/terrain（依赖 WebGPU 全局
        // GPUBufferUsage）所需的全局由 vitest.setup.ts 补齐，因此它们的单元测试
        // 也纳入全量，避免"CI 绿了但这两个包根本没跑过测试"。
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/lib/**',
            '**/public/**',
        ],
        setupFiles: ['./vitest.setup.ts'],
        // 慢测试（webgpu ChainMap 性能基线）单独放宽超时，避免 CI 机器抖动导致误报
        testTimeout: 30000,
        // 覆盖率（issue #74）：all=true 让「没被任何测试触及的文件」也进分母，
        // 否则它们根本不出现，覆盖率数字会虚高。
        coverage: {
            provider: 'v8',
            reporter: ['text-summary'],
            all: true,
            include: ['packages/*/src/**/*.ts'],
            exclude: ['**/*.spec.ts', '**/*.d.ts'],
            // 阈值（issue #74）：取实测基线向下留 1 个百分点——它的作用是
            // 「防止覆盖率下降」，不是「宣布已达标」。
            // 实测基线（2026-09，本机 Node 22）：语句 38.15% / 分支 88.17% /
            // 函数 45.5% / 行 38.15%；分档现状与冲击 80% 的路径见 docs/CI.md。
            thresholds: {
                statements: 37,
                branches: 87,
                functions: 44,
                lines: 37,
            },
        },
    },
});
