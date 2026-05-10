import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // 禁用测试超时，方便调试
        testTimeout: 0,
    },
});

