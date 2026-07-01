import { defineConfig } from 'vite';
import { errorLoggerPlugin } from '@feng3d/error-logger';

export default defineConfig({
    root: '.',
    publicDir: 'resources',
    server: {
        port: 3000,
        open: false
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true
    },
    plugins: [errorLoggerPlugin()]
});
