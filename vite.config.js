// @see https://cn.vitejs.dev/guide/build.html#library-mode

import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    publicDir: false,
    build: {
        lib: {
            // Could also be a dictionary or array of multiple entry points
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'feng3d',
            // the proper extensions will be added
            fileName: 'index'
        },
        sourcemap: true
    },
});
