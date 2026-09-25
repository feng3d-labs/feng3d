import { defineConfig } from 'vitest/config';

// 配置Vitest以适配项目
export default defineConfig({
    // 设置测试环境
    test: {
        globals: true,
        // 仅扫描主仓 src/ 与各子包 test/ 目录的测试，
        // 排除子包 src/ 下的开发期测试副本（如 packages/reactivity/src/*.spec.ts，
        // 它们与 test/ 下重复且可能过时）
        include: [
            'packages/feng3d/src/**/*.spec.ts',
            'packages/*/test/**/*.spec.ts',
        ],
        // 排除需要特殊运行环境（browser/WebGPU）的子包测试，
        // 这些子包应在各自目录内用对应环境运行
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            'packages/shortcut/**',  // 依赖 browser 全局（self）
            'packages/terrain/**',   // 依赖 WebGPU 全局（GPUBufferUsage）
        ],
    },
});
