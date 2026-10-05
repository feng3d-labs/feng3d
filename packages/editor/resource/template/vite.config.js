import { defineConfig } from 'vite';

/**
 * 项目自己的构建配置（D12 / 决策 13）。
 *
 * 编辑器**不硬编码构建工具**，只约定"调项目自己的 `npm run build`"——
 * 所以这一份可以整份替换（换成 rollup / esbuild / webpack 都行），
 * 只要 `package.json` 的 `scripts.build` 还在。
 */
export default defineConfig({
    build: {
        outDir: 'dist',
    },
});
