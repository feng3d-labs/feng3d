/**
 * R2 验收：tree-shaking 的**产物级**验证（issue #238）。
 *
 * `scripts/check-module-side-effects.mjs` 是静态判据：它只能证明"没有明显的模块级副作用"，
 * 不能证明产物里未引用的模块真的被消除。这里用 esbuild（vitest 依赖链自带，无需新增依赖）
 * 真正打一次包，并断言产物内容。
 *
 * 两组对照（第二组是**方法自证**，避免断言恒真）：
 *   1. 只 import `@feng3d/math` 的 `vec3From` → 产物里不该出现 `TerrainGeometry` / `WGPUBuffer`，
 *      且**应当**出现入口真正用到的 `vec3From`（阶段 C-f 起 math 再无 `Vector3` class，改用一个纯函数当探针）；
 *   2. 额外 `import '@feng3d/terrain'` → 产物里**必须**出现 `TerrainGeometry`。
 *      如果第 2 组都断言不到标记，说明"看产物里有没有某个标识符"这个方法本身不可靠，
 *      第 1 组的通过也就没有意义——所以这一组是门禁可信度的前提。
 *
 * 另附静态断言：声明了 `sideEffects: false` 的包必须确实写上该字段（声明与实现对齐）。
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const WORK = join(ROOT, 'tmp');

mkdirSync(WORK, { recursive: true });

/** esbuild 由 vitest → vite 依赖链带到 node_modules（已在根目录提升），不需要新增依赖 */
const esbuild = await import('esbuild').catch(() =>
{
    console.error('❌ 找不到 esbuild：它应随 vitest 的依赖链安装，先跑一次 `npm ci`');
    process.exit(1);
});

/** 打包一段入口代码，返回产物文本（临时文件随即清理） */
async function bundle(name, code)
{
    const entry = join(WORK, `treeshake-${name}.ts`);

    writeFileSync(entry, code, 'utf8');
    try
    {
        const result = await esbuild.build({
            entryPoints: [entry],
            bundle: true,
            format: 'esm',
            platform: 'node',
            write: false,
            logLevel: 'silent',
        });

        return result.outputFiles[0].text;
    }
    finally
    {
        rmSync(entry, { force: true });
    }
}

const problems = [];

// 第 1 组：只用一个纯数学导出
const pure = await bundle('pure', [
    "import { vec3From } from '@feng3d/math';",
    '',
    'console.log(vec3From(1, 2, 3).x);',
    '',
].join('\n'));

if (!pure.includes('vec3From')) problems.push('入口用到的 vec3From 没进产物——打包本身可能没生效，后面的断言不可信');
if (pure.includes('TerrainGeometry')) problems.push('未引用 @feng3d/terrain，产物里却出现了 TerrainGeometry');
if (pure.includes('WGPUBuffer')) problems.push('未引用 @feng3d/webgpu，产物里却出现了 WGPUBuffer');
if (pure.includes('ReactiveObject')) problems.push('未引用 @feng3d/reactivity，产物里却出现了 ReactiveObject');
// 该标记只在「破坏实验」里被临时写进 math 包内未被使用的模块，正常代码里不存在。
// 出现即说明：包内未使用的模块被带进了产物（顶层副作用 + 没有 sideEffects 声明时会这样）。
if (pure.includes('ZZ_TREESHAKE_MARKER')) problems.push('math 包内**未被使用**的模块被带进了产物（顶层副作用没被消除）');

// 第 2 组：方法自证——显式引入后标记必须出现
const withTerrain = await bundle('terrain', [
    "import { vec3From } from '@feng3d/math';",
    "import '@feng3d/terrain';",
    '',
    'console.log(vec3From);',
    '',
].join('\n'));

if (!withTerrain.includes('TerrainGeometry'))
{
    problems.push('显式 import @feng3d/terrain 后产物里没有 TerrainGeometry——marker 检测方法不可靠，第 1 组的结论不能采信');
}

// 静态断言：声明了 sideEffects: false 的包必须真的写上
for (const pkg of ['packages/math', 'packages/reactivity'])
{
    const json = JSON.parse(readFileSync(join(ROOT, pkg, 'package.json'), 'utf8'));

    if (json.sideEffects !== false)
    {
        problems.push(`${pkg}/package.json 未声明 sideEffects: false（打包器无法消除未用模块）`);
    }
}

if (problems.length > 0)
{
    console.error(`❌ tree-shaking 产物校验失败：${problems.length} 项`);

    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
}

console.log(`✅ tree-shaking 产物校验通过：纯入口产物 ${pure.length} 字节（未带 terrain/webgpu/reactivity），`
    + `显式引入 terrain 的对照产物 ${withTerrain.length} 字节（含 TerrainGeometry）`);
