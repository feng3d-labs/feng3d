/**
 * #276 前置验证 spike（S2）：cordis 能不能进**浏览器产物**、要多大、带不带 Node 依赖。
 *
 * ## 它回答什么
 *
 * 三端形态的前两端里，**Web 半也是 cordis 插件**（`docs/ARCHITECTURE.md` §6.6 / D4）。
 * 这条成立的前提是 cordis 核心能在浏览器里跑、且不会把 `node:*` 拖进去。`docs/PLUGINS.md`
 * 记着一次 27.2 KB / 零 node 引用的实测，但那次用的脚本放在 `tmp/`（`.gitignore:73`），
 * **别人复核不了**——所以这里重做成可复现的一版。
 *
 * 量的三件事：
 * 1. 打成 `format: esm` / `platform: browser` / minify 后的**字节数**；
 * 2. 产物里 `node:` 说明符 / `process.` / `require(` 的出现次数（应为 0）；
 * 3. 产物的顶层 `import` 语句（外部依赖基线长什么样）。
 *
 * ## 怎么跑
 *
 * ```bash
 * node packages/editor/spikes/cordis-bundle.mjs
 * ```
 *
 * 需要 esbuild（探测顺序：`ESBUILD_ENTRY` → 仓库 `node_modules/esbuild` → DSH profile）
 * 与一份 cordis（探测顺序同 `cordis-dispose.mjs`）。
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';

/**
 * 探测一个包目录下的入口文件。
 *
 * @param roots 候选的 `node_modules` 根
 * @param relative 包内的相对入口路径
 * @returns 命中的绝对路径；都没有时返回 `null`
 */
function firstExisting(roots, relative)
{
    for (const root of roots)
    {
        const candidate = join(root, relative);
        if (existsSync(candidate)) return candidate;
    }

    return null;
}

const repoNodeModules = 'C:/feng/gitee/feng3d/feng3d/node_modules';
const dshProfiles = join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), 'profiles', 'node_modules');

const cordisEntry = process.env.CORDIS_ENTRY
    ?? firstExisting([dshProfiles, repoNodeModules], '@deepseek-ai/cordis/lib/index.js');
const esbuildEntry = process.env.ESBUILD_ENTRY
    ?? firstExisting([repoNodeModules, dshProfiles], 'esbuild/lib/main.js');

if (!cordisEntry)
{
    console.error('未找到 cordis 入口；用 CORDIS_ENTRY=<...>/@deepseek-ai/cordis/lib/index.js 指定');
    process.exit(2);
}
if (!esbuildEntry)
{
    console.error('未找到 esbuild 入口；用 ESBUILD_ENTRY=<...>/esbuild/lib/main.js 指定');
    process.exit(2);
}

const esbuild = (await import(pathToFileURL(esbuildEntry).href)).default ?? (await import(pathToFileURL(esbuildEntry).href));

// 入口源码：最小可用的 cordis 用法（Context + Service + 事件），探针性质
const entry = `
import { Context, Service, EventsService } from '${cordisEntry.replace(/\\/g, '/')}';

class Counter extends Service
{
    constructor(ctx)
    {
        super(ctx, 'counter');
    }
}

export function run()
{
    const root = new Context();
    root.plugin(Counter);
    root.emit('app/ready');

    return { root, EventsService };
}
`;

const result = await esbuild.build({
    stdin: { contents: entry, resolveDir: repoNodeModules, loader: 'js' },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    write: false,
    logLevel: 'silent',
    metafile: true,
});

const code = result.outputFiles[0].text;
const count = (pattern) => (code.match(pattern) ?? []).length;
const imports = [...code.matchAll(/from"([^"]+)"/g)].map((match) => match[1]);
const esbuildVersion = JSON.parse(readFileSync(join(esbuildEntry, '..', '..', 'package.json'), 'utf-8')).version;

console.log(`esbuild ${esbuildVersion} / cordis 入口 ${cordisEntry}`);
console.log(`产物字节数：${code.length}（${(code.length / 1024).toFixed(1)} KB，esm + browser + minify）`);
console.log(`node: 说明符 ${count(/["']node:/g)} 处 / process. ${count(/\bprocess\./g)} 处 / require( ${count(/\brequire\(/g)} 处`);
console.log(`顶层 import：${imports.length === 0 ? '（无）' : imports.join('、')}`);

const ok = count(/["']node:/g) === 0 && count(/\bprocess\./g) === 0 && count(/\brequire\(/g) === 0;
console.log(ok ? '结论：可在浏览器直接加载（无 Node 依赖）' : '结论：产物含 Node 依赖，需要额外处理');
process.exit(ok ? 0 : 1);
