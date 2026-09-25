import { defineConfig } from 'vite';
// 直接从源码相对引入：error-logger 是在 vite 配置加载时（Node 环境）运行的插件，
// 不能走 package.json 入口（其指向 .ts 源码，Node 无法直接执行）。
// 相对引入会被 vite 的 esbuild 配置打包器内联转译，无需构建 lib/。
import { errorLoggerPlugin } from '../packages/error-logger/src/index.ts';
import { fileURLToPath } from 'node:url';

export default defineConfig({
    root: '.',
    publicDir: 'resources',
    resolve: {
        alias: {
            // feng3d 是 workspace 成员包（源码在 ../packages/feng3d/src），优先解析到源码而非 node_modules 里的旧 dist
            feng3d: fileURLToPath(new URL('../packages/feng3d/src/index.ts', import.meta.url)),
        },
    },
    server: {
        port: 3000,
        open: false,
        allowedHosts: true
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true
    },
    plugins: [errorLoggerPlugin()]
});
