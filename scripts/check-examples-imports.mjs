#!/usr/bin/env node
/**
 * 示例入口可解析性检查（examples 门禁）。
 *
 * 背景：`examples` 的 dev/build 入口是 `src/**\/*.html`，而 Vite 6 在 dev 启动时按
 * `build.rollupOptions.input` 扫描依赖——**任一示例 import 了引擎不存在的导出**，
 * 整个 dev server 就会以「Failed to scan for dependencies from entries」失败，
 * 所有示例都无法打开（issue：`npm run dev` 启动即报 No matching export）。
 *
 * 本脚本用一次 esbuild 打包把全部示例入口一起解析，等价于 Vite 的那次扫描，
 * 但不需要起 server、也无需浏览器，适合放进 CI：
 *   - import 的符号不存在（No matching export）
 *   - import 的模块解析不到（Could not resolve）
 *   - html 引用的 .ts 入口不存在
 *
 * 用法：node scripts/check-examples-imports.mjs [--dir examples]
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import fg from 'fast-glob';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dirArgIndex = process.argv.indexOf('--dir');
const examplesDir = resolve(repoRoot, dirArgIndex >= 0 ? process.argv[dirArgIndex + 1] : 'examples');

/** 着色器文件 → `export default \`...\``（否则 esbuild 不认 .glsl/.wgsl 等后缀） */
const shaderToString = {
    name: 'shader-to-string',
    setup(buildApi)
    {
        buildApi.onLoad({ filter: /\.(glsl|wgsl|vert|frag|vs|fs)$/ }, (args) => ({
            contents: `export default ${JSON.stringify(readFileSync(args.path, 'utf-8'))};`,
            loader: 'js',
        }));
    },
};

/**
 * `@feng3d/<name>` → `packages/<name>/src/index.ts`。
 *
 * 与 examples/vite.config.ts 的 feng3dSourceResolve 一致：嵌套 node_modules 里可能残留
 * 历史安装的旧 dist 副本，会把解析导向旧版本（出现「模块不提供导出 xxx」的假故障）。
 */
const feng3dSourceResolve = {
    name: 'feng3d-source-resolve',
    setup(buildApi)
    {
        buildApi.onResolve({ filter: /^@feng3d\/[\w.-]+$/ }, (args) =>
        {
            const name = args.path.slice('@feng3d/'.length);
            const entry = resolve(repoRoot, `packages/${name}/src/index.ts`);

            return existsSync(entry) ? { path: entry } : null;
        });
    },
};

/** 收集 html 引用的脚本入口（相对 examples 根） */
function collectHtmlEntries()
{
    const htmls = fg.sync(['index.html', 'src/**/*.html'], { cwd: examplesDir, absolute: true });
    const problems = [];
    const entries = new Set();

    for (const html of htmls)
    {
        const content = readFileSync(html, 'utf-8');
        const matches = content.matchAll(/<script[^>]*\bsrc=["']([^"']+)["']/g);

        for (const match of matches)
        {
            const src = match[1];
            if (/^https?:|^\/\//.test(src)) continue;

            const script = resolve(dirname(html), src);
            if (existsSync(script)) entries.add(script);
            else problems.push(`${html.replace(repoRoot + '\\', '').replace(/\\/g, '/')} 引用的脚本不存在：${src}`);
        }
    }

    return { htmlCount: htmls.length, entries: [...entries], problems };
}

const { htmlCount, entries, problems } = collectHtmlEntries();
const missingEntries = fg
    .sync(['src/**/*.ts'], { cwd: examplesDir, absolute: true })
    .filter((f) => !f.endsWith('.d.ts'))
    .filter((f) => !existsSync(f));

problems.push(...missingEntries.map((f) => `示例源文件不存在：${f}`));

try
{
    await build({
        entryPoints: entries,
        outdir: resolve(examplesDir, '.check-out'),
        bundle: true,
        write: false,
        format: 'esm',
        platform: 'browser',
        target: 'esnext',
        logLevel: 'silent',
        plugins: [feng3dSourceResolve, shaderToString],
        loader: { '.gltf': 'dataurl', '.glb': 'dataurl', '.png': 'dataurl', '.jpg': 'dataurl', '.gif': 'dataurl' },
    });
}
catch (error)
{
    for (const err of error.errors ?? [])
    {
        const where = err.location ? `${err.location.file}:${err.location.line}` : '';
        problems.push(`${err.text}${where ? `\n    ${where}` : ''}`);
    }
}

if (problems.length)
{
    console.error(`✖ 示例入口检查失败（扫描 ${htmlCount} 个页面，${entries.length} 个脚本入口）：\n`);    for (const p of problems) console.error(`  - ${p}`);
    console.error('\n提示：示例 import 的符号必须真实存在于引擎导出（接口类型只在类型位置使用时才会被移除）。');
    process.exit(1);
}

console.log(`✔ 示例入口检查通过（${htmlCount} 个页面，${entries.length} 个脚本入口）`);
