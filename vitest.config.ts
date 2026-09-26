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
    },
});
