// @see https://cn.vitejs.dev/guide/build.html#library-mode

import { resolve } from 'path';
import { defineConfig } from 'vite';
import pkg from './package.json';

const namespace = 'feng3d';
const external = pkg.standalone ? [] : Object.keys(pkg.dependencies || []);
const globals = () => namespace;

export default defineConfig({
    build: {
        lib: {
            // Could also be a dictionary or array of multiple entry points
            entry: resolve(__dirname, 'src/index.ts'),
            name: namespace,
            // the proper extensions will be added
            fileName: 'index',
        },
        minify: false,
        sourcemap: true,
        rollupOptions: {
            // 确保外部化处理那些你不想打包进库的依赖
            external,
            output: {
                // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
                globals,
            },
        },
    },
    plugins: [
        shaderToString(),
    ],
});

function shaderToString()
{
    return {
        name: 'vite-plugin-string',
        async transform(source, id)
        {
            if (!['glsl', 'wgsl', 'vert', 'frag', 'vs', 'fs'].includes(id.split('.').pop())) return;

            const esm = `export default \`${source}\`;`;

            return { code: esm, map: { mappings: '' } };
        },
    };
}
