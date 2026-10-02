#!/usr/bin/env node
/**
 * **runtime 端产物通道**的验收（#277 任务 1+2 的最小一截；也是 #276 验收③的产物侧证据）。
 *
 * ## 它守的语义
 *
 * "游戏项目端"（第三端）的装载方式是 **构建时打入**（已决策 A，见
 * [packages/editor/docs/PLUGIN_TRIPLE_HALF.md](../packages/editor/docs/PLUGIN_TRIPLE_HALF.md) §3.5）。
 * 这个脚本把那条通道的**语义**钉住，全部用**真产物**验，不靠读代码：
 *
 * 1. **启用 → 进产物**：按"项目启用了哪些插件"生成入口 → 打包 → 产物里必须有它的 runtime 端；
 * 2. **未启用 → 不进产物**：没启用的插件，它的 runtime 端**不许**出现在产物里；
 * 3. **产物能在无编辑器环境跑**：产物自包含（引擎 reactivity 打进去），在 Node 里 import 它就能用——
 *    并且 `logic({ __type__: 'Rotate' })` **拿到行为**（这就是 #276 验收③"两端都有行为"的产物侧）；
 * 4. **产物不含编辑器 API**：runtime 端只依赖引擎——`check-runtime-half-deps.mjs` 在**源码级**判，
 *    这里在**产物级**再判一次（源码级漏了的情况：某个编辑器依赖被间接引进来）。
 *
 * **方法自证**：第 2 条的"看产物里有没有某个标识符"这个方法本身要可信——所以额外打一次
 * "两个都启用"的产物，断言那时标记**必须出现**。否则第 2 条的通过说明不了任何事
 * （与 `check-tree-shaking.mjs` 的两组对照同一思路）。
 *
 * ## 它**不是** #277 的全部
 *
 * #277 还要求：真实 `build` / `publish` 命令接到项目构建流程、修 `packages/editor/package.json`
 * 的 `files` 白名单、游戏项目服务端支持。本脚本只把"**runtime 端产物通道**"这一截立起来并守住。
 *
 * 用法：
 *   node scripts/check-runtime-artifact.mjs
 *
 * 退出码：0 全部通过；1 有失败。
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const WORK = join(ROOT, 'tmp', 'runtime-artifact');

rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });

/** esbuild 由 vitest → vite 依赖链带到 node_modules（已在根目录提升），不需要新增依赖 */
const esbuild = await import('esbuild').catch(() =>
{
    console.error('❌ 找不到 esbuild：它应随 vitest 的依赖链安装，先跑一次 `npm ci`');
    process.exit(1);
});

let total = 0;
let failed = 0;

/**
 * 记一条判据。
 *
 * @param {string} title 判据
 * @param {boolean} condition 是否通过
 * @param {string} detail 附加说明
 */
function check(title, condition, detail = '')
{
    total++;
    if (condition) console.log(`  PASS  ${title}${detail ? ` — ${detail}` : ''}`);
    else { failed++; console.log(`  FAIL  ${title}${detail ? ` — ${detail}` : ''}`); }
}

/**
 * 打一个产物（模拟"构建期把 runtime 端合并进游戏 bundle"）。
 *
 * @param {string} name 产物名
 * @param {string} code 入口源码
 * @returns {Promise<{ text: string, outfile: string }>} 产物文本与文件路径
 */
async function bundle(name, code)
{
    const entry = join(WORK, `entry-${name}.ts`);
    const outfile = join(WORK, `out-${name}.mjs`);

    writeFileSync(entry, code, 'utf8');

    await esbuild.build({
        entryPoints: [entry],
        outfile,
        bundle: true,
        format: 'esm',
        platform: 'node',
        target: 'es2022',
        logLevel: 'silent',
    });

    const { readFileSync } = await import('node:fs');

    return { text: readFileSync(outfile, 'utf8'), outfile };
}

/**
 * 生成"按项目启用状态"的产物入口。
 *
 * 这就是"启用状态参与构建"的最小形态：启用了哪个插件，入口里就 import + 安装哪个 runtime 半。
 *
 * @param {readonly string[]} enabledHalves 已启用的 runtime 半模块说明符
 * @returns {string} 入口源码
 */
function entryFor(enabledHalves)
{
    const imports = enabledHalves.map((spec, index) =>
        `import { install as install${index} } from '${spec}';`).join('\n');
    const calls = enabledHalves.map((_, index) => `install${index}();`).join('\n');

    return `${imports}\n\n${calls}\n\nexport const enabledCount = ${enabledHalves.length};\n`;
}

// ---------- 造两个"假插件包"的 runtime 半（对照组用） ----------
writeFileSync(join(WORK, 'fake-a.ts'), [
    '/** 假插件 A 的 runtime 半：装的时候在全局留一个独有标记（便于在产物里断言） */',
    'export function install(): void',
    '{',
    '    (globalThis as Record<string, unknown>).__FAKE_A_MARKER__ = "FAKE_A_MARKER";',
    '}',
].join('\n'), 'utf8');

writeFileSync(join(WORK, 'fake-b.ts'), [
    '/** 假插件 B 的 runtime 半（未启用时不该进产物） */',
    'export function install(): void',
    '{',
    '    (globalThis as Record<string, unknown>).__FAKE_B_MARKER__ = "FAKE_B_MARKER";',
    '}',
].join('\n'), 'utf8');

const fakeA = './fake-a.ts';
const fakeB = './fake-b.ts';

console.log('[runtime 端产物] #277 任务 1+2 的最小一截（服务 #276 验收③）');

// ---------- 判据 1：启用 → 进产物，且产物能在无编辑器环境跑 ----------
const rotateEntry = [
    "import { installRotateRuntime } from '@feng3d/editor-plugin-rotate/runtime';",
    "import { logic } from '@feng3d/reactivity';",
    '',
    'installRotateRuntime();',
    '',
    "const rotateLogic = logic({ __type__: 'Rotate', speed: 90 });",
    '',
    'export const angle = rotateLogic.update(1);',
    '',
].join('\n');

const rotateArtifact = await bundle('rotate', rotateEntry);
const loaded = await import(pathToFileURL(rotateArtifact.outfile).href);

check('产物里的 runtime 端真的跑起来了（无编辑器环境：只有 Node + 引擎包）',
    loaded.angle === 90, `logic().update(1) = ${loaded.angle}`);

check('产物里含样板包的 runtime 半（按启用状态打进去了）',
    rotateArtifact.text.includes('RotateLogic'));

// ---------- 判据 2：产物不含编辑器 API（与 check-runtime-half-deps 的源码级判据互补） ----------
const editorMarkers = ['EditorBridge', 'element-plus', 'MainLayout', 'createApp', 'editorSlots'];

for (const marker of editorMarkers)
{
    check(`产物不含编辑器标记「${marker}」`, !rotateArtifact.text.includes(marker));
}

// ---------- 判据 3：未启用 → 不进产物（含方法自证） ----------
const onlyA = await bundle('only-a', entryFor([fakeA]));

check('启用的插件 A 进了产物', onlyA.text.includes('FAKE_A_MARKER'));
check('**未启用的插件 B 没进产物**（按启用状态过滤）', !onlyA.text.includes('FAKE_B_MARKER'));

const bothAB = await bundle('both-ab', entryFor([fakeA, fakeB]));

check('方法自证：两个都启用时 B 的标记必须出现（否则上一条的通过没有意义）',
    bothAB.text.includes('FAKE_B_MARKER'));

// ---------- 判据 4：产物可重复构建（同一启用集合两次构建，行为一致） ----------
const onlyAAgain = await bundle('only-a-again', entryFor([fakeA]));
const loadedAgain = await import(pathToFileURL(onlyAAgain.outfile).href);

check('同一启用集合重复构建，行为一致（构建可复现）',
    loadedAgain.enabledCount === 1 && onlyAAgain.text.includes('FAKE_A_MARKER')
    && !onlyAAgain.text.includes('FAKE_B_MARKER'));

// ---------- 收尾 ----------
rmSync(WORK, { recursive: true, force: true });

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ runtime 端产物通道未通过——"未启用的插件不进产物"这条不能只写在文档里。');
    process.exit(1);
}

console.log('✅ runtime 端产物通道通过：启用进产物、未启用不进、产物无编辑器依赖且能跑');
