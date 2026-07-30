import { defineConfig } from 'vite';
import { errorLoggerPlugin } from '@feng3d/error-logger';
import { fileURLToPath } from 'node:url';

export default defineConfig({
    root: '.',
    publicDir: 'resources',
    resolve: {
        alias: {
            // feng3d 是 workspace 成员包（源码在 ../../packages/feng3d/src），优先解析到源码而非 node_modules 里的旧 dist
            feng3d: fileURLToPath(new URL('../../packages/feng3d/src/index.ts', import.meta.url)),
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
