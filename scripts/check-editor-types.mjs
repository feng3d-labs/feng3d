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
const UPSTREAM = /\/(feng3d|polyfill|math|webgpu|reactivity|serialization|assets|objectview|terrain|particlesystem|shortcut|filesystem|tsl)\//;

/** 从错误行里取出文件路径（`path(line,col): error TS…`） */
function errorPath(line)
{
    const matched = line.match(/^([^()]+)\(\d+,\d+\):\s*error TS/);

    return (matched ? matched[1] : '').replace(/\\/g, '/');
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
const upstreamErrors = errors.filter((line) => !isEditorError(line) && UPSTREAM.test(errorPath(line)));
const unknownErrors = errors.filter((line) => !isEditorError(line) && !UPSTREAM.test(errorPath(line)));

if (upstreamErrors.length > 0)
{
    console.log(`\n主仓源码噪音 ${upstreamErrors.length} 条（已知，见 issue #133，不计入门禁）：`);
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
    console.log(`\n✅ editor 自身 0 类型错误（主仓噪音 ${upstreamErrors.length} 条已单列）`);

    process.exit(0);
}

process.exit(1);
