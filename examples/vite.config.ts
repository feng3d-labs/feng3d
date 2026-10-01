import { defineConfig, type Plugin } from 'vite';
import fg from 'fast-glob';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// 直接从源码相对引入：error-logger 是在 vite 配置加载时（Node 环境）运行的插件，
// 不能走 package.json 入口（其指向 .ts 源码，Node 无法直接执行）。
// 相对引入会被 vite 的 esbuild 配置打包器内联转译，无需构建 lib/。
import { errorLoggerPlugin } from '../packages/error-logger/src/index.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/** 需要转成字符串模块的着色器文件后缀 */
const SHADER_EXTENSIONS = ['glsl', 'wgsl', 'vert', 'frag', 'vs', 'fs'];

/**
 * 本仓 workspace 子包名（`@feng3d/<name>`），仅收录 `packages/<name>/src/index.ts` 真实存在的包。
 *
 * 这些包一律按源码参与 dev/build，不交给依赖预构建——避免嵌套 node_modules 里的
 * 历史 dist 副本被预构建后遮蔽源码。
 */
function getWorkspacePackageNames(): string[]
{
    return readdirSync(resolve(__dirname, '../packages'), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => `@feng3d/${entry.name}`)
        .filter((name) => existsSync(resolve(__dirname, `../packages/${name.slice('@feng3d/'.length)}/src/index.ts`)));
}

/**
 * 示例页面入口表（index.html + src 下全部示例 html）。
 *
 * 同时供 build.rollupOptions.input 与 optimizeDeps.entries 使用：Vite 6 在 dev 启动时
 * 按 build.rollupOptions.input 扫描依赖，两者保持一致才能保证「dev 扫描到的入口」
 * 与「build 会构建的入口」是同一批（任一示例 import 了不存在的导出，dev 启动即报错）。
 */
function getHtmlEntries(): Record<string, string>
{
    const entries = fg.sync(['index.html', 'src/**/*.html'], { dot: true, cwd: __dirname });

    const obj: Record<string, string> = {};

    for (const entry of entries)
    {
        obj[entry] = resolve(__dirname, entry);
    }

    return obj;
}

/** 把着色器文件（*.glsl / *.wgsl / ...）转成 `export default \`...\`` 模块 */
function shaderToString(): Plugin
{
    return {
        name: 'vite-plugin-string',
        async transform(source, id)
        {
            if (!SHADER_EXTENSIONS.includes(id.split('.').pop())) return;

            const esm = `export default \`${source}\`;`;

            return { code: esm, map: { mappings: '' } };
        },
    };
}

/**
 * 把 `@feng3d/<name>` 统一解析到 `packages/<name>/src/index.ts`（本仓子包源码发布，不构建 dist）。
 *
 * 必要性：嵌套的 `packages/<pkg>/node_modules/@feng3d/<name>` 里可能存在历史 npm 安装的
 * **旧 dist 副本**（如 `packages/filesystem/node_modules/@feng3d/polyfill/dist/index.js`），
 * 它们会遮蔽 workspace 源码——dev 时加载到旧版本（表现为「模块不提供导出 xxx」的运行时错误）。
 * 这里只解析 `packages/<name>/src/index.ts` 真实存在的包；其余（如外仓 `@feng3d/tsl`）
 * 返回 null 交回 Vite 默认解析。
 */
function feng3dSourceResolve(): Plugin
{
    return {
        name: 'feng3d-source-resolve',
        enforce: 'pre',
        resolveId(source)
        {
            const matched = /^@feng3d\/([\w.-]+)$/.exec(source);
            if (!matched) return null;

            const entry = resolve(__dirname, `../packages/${matched[1]}/src/index.ts`);

            return existsSync(entry) ? entry : null;
        },
    };
}

export default defineConfig({
    root: '.',
    publicDir: 'resources',
    base: './',
    assetsInclude: ['**/*.gltf'],
    resolve: {
        alias: {
            // feng3d 是 workspace 成员包（源码在 ../packages/feng3d/src），优先解析到源码而非 node_modules 里的旧 dist
            feng3d: fileURLToPath(new URL('../packages/feng3d/src/index.ts', import.meta.url)),
        },
    },
    server: {
        port: 3000,
        open: false,
        allowedHosts: true,
    },
    optimizeDeps: {
        // 与 build 入口一致：扫描全部示例页，任一示例 import 不到引擎导出就在 dev 启动时报错
        entries: Object.keys(getHtmlEntries()),
        // workspace 子包走源码（见 feng3dSourceResolve），不参与依赖预构建
        exclude: getWorkspacePackageNames(),
    },
    build: {
        // 示例入口普遍使用 top-level await（`const webgpu = await new WebGPU().init()`），
        // 属于 ES2022 特性：Vite 默认 target（chrome87/edge88/es2020/firefox78/safari14）会直接报
        // 「Top-level await is not available in the configured target environment」。
        target: 'esnext',
        rollupOptions: {
            input: getHtmlEntries(),
        },
        outDir: 'public',
        emptyOutDir: true,
        sourcemap: false,
        minify: true,
    },
    esbuild: {
        target: 'esnext',
    },
    plugins: [
        feng3dSourceResolve(),
        shaderToString(),
        errorLoggerPlugin(),
    ],
    worker: {
        // 为 worker 启用插件（Vite 6 要求 plugins 为返回数组的函数）
        plugins: () => [shaderToString()],
    },
});
