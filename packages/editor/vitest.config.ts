import { defineConfig } from 'vitest/config';

// 配置Vitest以适配项目
export default defineConfig({
    // 设置测试环境
    test: {
        globals: true,
        include: ['test/**/*.spec.ts'],
        // 补上浏览器 / WebGPU 全局：属性面板这类代码要 import `feng3d`（引擎会加载
        // @feng3d/webgpu，模块顶层读 GPUBufferUsage 等全局），Node 下直接跑会 ReferenceError。
        // 复用仓库根那一份，避免两套 stub 各自漂移。
        setupFiles: ['../../vitest.setup.ts'],
    },
});
