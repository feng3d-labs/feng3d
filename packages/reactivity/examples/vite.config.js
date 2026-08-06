// vite.config.js
import fg from 'fast-glob';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    // 允许导入 package.json 文件
    json: {
        stringify: true,
    },
    publicDir: 'resources',
    build: {
        rollupOptions: {
            input: getHtmlNamesObject(),
        },
        sourcemap: false,
        minify: false,
        outDir: 'public',
    },
    base: './',
    assetsInclude: ['**/*.gltf'],
    plugins: [
        shaderToString(),
    ],
});

function getHtmlNamesObject()
{
    const entries = fg.sync(['index.html', 'src/**/*.html'], { dot: true });

    const obj = entries.reduce((pv, cv) =>
    {
        const ps = cv.split('.');

        if (ps[ps.length - 1] === 'html')
        {
            pv[cv] = resolve(__dirname, cv);
        }

        return pv;
    }, {});

    return obj;
}

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
