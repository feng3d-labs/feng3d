// vite.config.ts
import fg from 'fast-glob';
import { resolve, dirname } from 'path';
import { defineConfig, Plugin } from 'vite';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    define: {
        __DEV__: process.env.NODE_ENV === 'development' ? true : false,
    },
    publicDir: 'resources',
    build: {
        rollupOptions: {
            input: getHtmlNamesObject(),
        },
        sourcemap: false,
        minify: true,
        outDir: 'public',
    },
    base: './',
    assetsInclude: ['**/*.gltf'],
    plugins: [
        shaderToString(),
    ],
    worker: {
        plugins: () => [
            shaderToString(),
        ],
    },
});

function getHtmlNamesObject(): Record<string, string>
{
    const entries = fg.sync(['index.html', 'src/**/*.html'], { dot: true });

    const obj = entries.reduce<Record<string, string>>((pv, cv) =>
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

function shaderToString(): Plugin
{
    return {
        name: 'vite-plugin-string',
        async transform(source: string, id: string)
        {
            const ext = id.split('.').pop();
            if (!ext || !['glsl', 'wgsl', 'vert', 'frag', 'vs', 'fs'].includes(ext)) return;

            const esm = `export default \`${source}\`;`;

            return { code: esm, map: { mappings: '' } };
        },
    };
}
