#!/usr/bin/env node
/**
 * 编辑器类型门禁：**editor 自身必须 0 错误**，主仓源码的类型噪音单列（issue #133）。
 *
 * ## 为什么不是直接跑 `vue-tsc` 并看退出码
 *
 * editor 通过 workspace 链接 import 的是 feng3d / polyfill 的**源码**，vue-tsc 会顺着 import
 * 深检这些库。同一批文件在库自己的 tsc 下 0 错误，在 editor 的编译上下文里却报 15 条
 * （`View.ts` 的 canvas 断言、`StandardMaterial.ts` 的 `TextureField` 收窄、`ClassUtils.ts`
 * 的未使用 `@ts-expect-error`）——已在 issue #133 里记过排查过程（两套 tsconfig 的
 * compilerOptions 逐项相同、只有一份 lib.dom.d.ts、同一 tsc 版本；单独编译 View.ts 不报，
 * 必须连同 editor/src 一起编译才报，症状是 `HTMLCanvasElement` 出现两种身份）。
 *
 * 直接看退出码的结果是"长期红着"，真问题（editor 自己的类型错误）反而被淹没。
 * 所以这里**按路径分类**：
 *
 * - `packages/editor/**` 的错误 → 本门禁的判据，必须为 0；
 * - 其它包（主仓源码）的错误 → 已知噪音，打印数量与前几条，不计入失败；
 * - 既不属于 editor 也不属于已知主仓路径的错误 → 也算失败（避免把新增来源悄悄算成噪音）。
 *
 * 用法：node scripts/check-editor-types.mjs
 * 退出码：0 = editor 自身 0 错误；1 = 有 editor 自身错误或未知来源错误。
 */
import { openSync, readFileSync, closeSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOG = join(ROOT, '.verify', 'editor-typecheck.log');
mkdirSync(dirname(LOG), { recursive: true });

/**
 * 已知的主仓源码路径（这些报错是 issue #133 记录的假错误，不计入门禁）。
 *
 * 注意错误行里的路径是**相对 packages/editor** 的（vue-tsc 在那里跑）：
 * editor 自身的文件是 `src/...`，主仓的是 `../feng3d/src/...`。
 */
/**
 * 主仓已知错误的**精确白名单**：错误行路径 → 允许出现的条数。
 *
 * 为什么不直接"凡主仓错误都放过"：那等于没有上限——新增任何主仓类型错误都不会被拦住
 * （issue #360 实测：原判据下 `upstreamErrors` 完全不参与退出码判定）。
 * 改成精确白名单后，**白名单之外的主仓错误一律失败**，与 R3 基线
 * （`scripts/imperative-construction-baseline.json`）同一模式：
 * **不含行号**（行号会随无关改动漂移）但**保留条数**（否则同文件新增第二处会被漏掉）。
 *
 * 白名单里每一项都必须有理由；**这些是真待办，不是豁免**（修掉后请从这里删除并缩小计数）。
 */
const UPSTREAM_ALLOWLIST = {
    // —— 真类型问题，待 issue #360 修掉（根因：TextureField 与那个带 descriptor/sampleCount 的
    //    WebGPU 风格对象不兼容，疑似"同名类型两种来源"，参看 #134）——
    '../feng3d/src/materials/StandardMaterial.ts': 10,
    '../feng3d/src/materials/TextureMaterial.ts': 2,
    // canvas 断言口径（TS2322），独立问题
    '../feng3d/src/core/View.ts': 1,
};

const UPSTREAM = /\/(feng3d|polyfill|math|webgpu|reactivity|serialization|assets|objectview|terrain|particlesystem|shortcut|filesystem|tsl)\//;

/**
 * 把"经 junction 解析到主工作区"的路径规范化成白名单键。
 *
 * worktree 里的 `node_modules/feng3d` 常是指向主工作区的 junction（`mklink /J`），于是 vue-tsc
 * 报出的路径形如 `../../../feng3d/feng3d/packages/feng3d/src/core/View.ts`，而白名单键
 * （以 `packages/editor` 为基准）是 `../feng3d/src/core/View.ts` —— 不规范化就会被误判成
 * "未知来源的错误"（与 #492 同源的问题）。
 *
 * 正常环境（CI / 主工作区）下路径里没有 `/packages/`，原样返回，行为不变。
 */
function normalizeUpstreamPath(path)
{
    const matched = path.match(/\/packages\/([^/]+)\/src\/(.+)$/);

    return matched ? `../${matched[1]}/src/${matched[2]}` : path;
}

/** 从错误行里取出文件路径（`path(line,col): error TS…`） */
function errorPath(line)
{
    const matched = line.match(/^([^()]+)\(\d+,\d+\):\s*error TS/);

    return normalizeUpstreamPath((matched ? matched[1] : '').replace(/\\/g, '/'));
}

/** 这条错误是不是 editor 自己的（相对路径 `src/...`，或绝对路径里含 `/packages/editor/`） */
function isEditorError(line)
{
    const path = errorPath(line);

    return path.startsWith('src/') || path.includes('/packages/editor/');
}

console.log('[编辑器类型门禁] 跑 vue-tsc（输出写文件，不经管道）…');

// 输出重定向到**文件描述符**而不是管道：受限环境下 Node 拿管道捕获子进程输出会失败
// （stdio: 'pipe' 需要命名管道），写文件则是等价且处处可用的做法
const fd = openSync(LOG, 'w');
const result = spawnSync('npm', ['run', 'type-check', '--workspace', 'feng3d-editor'], {
    cwd: ROOT,
    stdio: ['ignore', fd, fd],
    shell: true,
    encoding: 'utf8',
});
closeSync(fd);

const raw = readFileSync(LOG, 'utf8');
const errors = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /error TS/.test(line));

const editorErrors = errors.filter((line) => isEditorError(line));
const upstreamAll = errors.filter((line) => !isEditorError(line) && UPSTREAM.test(errorPath(line)));

// 按路径分组计数，对照白名单
const upstreamCounts = new Map();
for (const line of upstreamAll)
{
    const path = errorPath(line);
    upstreamCounts.set(path, (upstreamCounts.get(path) ?? 0) + 1);
}

/** 白名单内的（容忍），及**超出白名单的**（失败） */
const upstreamErrors = [];
const exceededUpstream = [];

for (const line of upstreamAll)
{
    const path = errorPath(line);
    const allowed = UPSTREAM_ALLOWLIST[path] ?? 0;

    // 同一个路径可能有多条，只放行前 `allowed` 条
    const seen = upstreamErrors.filter((v) => errorPath(v) === path).length;

    if (seen < allowed) upstreamErrors.push(line);
    else exceededUpstream.push(line);
}

// 白名单是"精确清单"，两头都要看：
// - 实际 > 允许 → 有新的主仓错误进来了（失败）；
// - 实际 < 允许 → 白名单**过松**（可能已经修好了一部分），也提示出来，避免它被当垃圾桶越写越宽。
for (const [path, count] of upstreamCounts)
{
    const allowed = UPSTREAM_ALLOWLIST[path] ?? 0;

    if (count > allowed) console.log(`  ⚠ 白名单超限：${path} 出现 ${count} 条 > 允许 ${allowed}`);
    else if (count < allowed) console.log(`  ⚠ 白名单过松：${path} 实际 ${count} 条 < 允许 ${allowed}（修好了一部分就请把计数收紧）`);
}

// 白名单里有、但这次一条都没出现的项：多半是那个文件已经干净了，提醒删掉这一项
for (const path of Object.keys(UPSTREAM_ALLOWLIST))
{
    if (!upstreamCounts.has(path)) console.log(`  ⚠ 白名单项已无对应错误：${path}（请从白名单删除）`);
}

const unknownErrors = [
    ...errors.filter((line) => !isEditorError(line) && !UPSTREAM.test(errorPath(line))),
    ...exceededUpstream,
];

if (upstreamErrors.length > 0)
{
    console.log(`\n主仓源码错误 ${upstreamErrors.length} 条（**精确白名单内**，见 issue #360；白名单之外会失败）：`);
    for (const line of upstreamErrors.slice(0, 5)) console.log(`  · ${line.slice(0, 150)}`);
    if (upstreamErrors.length > 5) console.log(`  · …另有 ${upstreamErrors.length - 5} 条`);
}

if (unknownErrors.length > 0)
{
    console.log(`\n❌ 未知来源的错误 ${unknownErrors.length} 条（既不在 editor，也不在已知主仓路径）：`);
    for (const line of unknownErrors.slice(0, 10)) console.log(`  ${line}`);
}

if (editorErrors.length > 0)
{
    console.log(`\n❌ editor 自身类型错误 ${editorErrors.length} 条：`);
    for (const line of editorErrors.slice(0, 20)) console.log(`  ${line}`);
}

if (result.status !== 0 && errors.length === 0)
{
    console.log(`\n❌ vue-tsc 退出码 ${result.status}，但没有解析到 error TS 行——请人工看 ${LOG}`);
    process.exit(1);
}

if (editorErrors.length === 0 && unknownErrors.length === 0)
{
    console.log(`\n✅ editor 自身 0 类型错误；主仓错误 ${upstreamErrors.length} 条全在白名单内（超出白名单即失败）`);

    process.exit(0);
}

process.exit(1);
