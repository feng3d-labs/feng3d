import { defineConfig } from 'vitest/config';

// 配置Vitest以适配项目
export default defineConfig({
    define: {
        __DEV__: true,
    },
    // 设置测试环境
    test: {
        globals: true,
    },
});

