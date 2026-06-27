import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    publicDir: 'resources',
    server: {
        port: 3000,
        open: true
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true
    },
    optimizeDeps: {
        include: [
            'feng3d',
            '@feng3d/assets',
            '@feng3d/core',
            '@feng3d/event',
            '@feng3d/filesystem',
            '@feng3d/math',
            '@feng3d/objectview',
            '@feng3d/particlesystem',
            '@feng3d/path',
            '@feng3d/polyfill',
            '@feng3d/renderer',
            '@feng3d/serialization',
            '@feng3d/shortcut',
            '@feng3d/terrain',
            '@feng3d/ui',
            '@feng3d/watcher'
        ]
    }
});
