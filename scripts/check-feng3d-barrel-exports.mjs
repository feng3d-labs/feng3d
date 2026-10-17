#!/usr/bin/env node
/**
 * 聚合桶可见性门禁（R1 存量，issue #592）。
 *
 * `packages/feng3d/src/index.ts` 用 `export * from '@feng3d/xxx'` 把子包再导出。
 * 聚合桶让「feng3d 到底依赖谁」在源码层面不可见，而 R1 现有的两条执行者
 * （`check-layer-direction.mjs` / `check-layer-deps.mjs`）判据取自各包 package.json，
 * 拦得住「新增一条向上依赖」，拦不住「从桶里漏掉一个已声明依赖」或「桶里导出了没声明的包」。
 *
 * 本脚本补的正是这一面，判据三条：
 *
 * 1. 桶里 `export * from '@feng3d/*'` 的每个包都必须在 `packages/feng3d/package.json` 的
 *    dependencies 里（防「用了却没声明」）；
 * 2. 桶里不得重复导出同一个包（防同一包出现两行、其中一行悄悄失效）；
 * 3. dependencies 里每个 `@feng3d/*` 要么出现在桶里、要么在 NON_BARREL_PACKAGES 白名单里
 *    并写明理由（防「声明了却从桶里漏掉」——这类漏掉会让 `import { X } from 'feng3d'` 静默失败）。
 *
 * **有意不做的强口径**：把 `export *` 拆成显式 `export { … } from …` 列表。
 * 那是公开 API 面的重排（examples / editor 大量写 `import { … } from 'feng3d'`），
 * 收益是可枚举性、成本是一次跨包迁移，见 issue #592 的评估与留账。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const INDEX_PATH = 'packages/feng3d/src/index.ts';
const PKG_PATH = 'packages/feng3d/package.json';

/**
 * 声明了、但**有意**不从聚合桶再导出的子包。
 *
 * 每条都必须写明理由——白名单是「显式的例外」，不是「懒得处理」。
 */
const NON_BARREL_PACKAGES = new Map([
    ['@feng3d/tsl', '着色器构造库：引擎内部单源生成 GLSL/WGSL，应用侧不直接使用'],
    ['@feng3d/webgpu', '渲染后端：应用要直接用它（WebGPU / RenderObject 等），由调用方显式 import'],
]);

function read(rel)
{
    return readFileSync(resolve(ROOT, rel), 'utf8');
}

const problems = [];

const indexText = read(INDEX_PATH);
const pkg = JSON.parse(read(PKG_PATH));

// 桶里的子包（只认 `export * from '@feng3d/xxx'`；`export * as ns from` 形态同样计入）
const barrelRe = /export\s*\*\s*(?:as\s+\w+\s*)?from\s*'(@feng3d\/[a-z0-9-]+)'/g;
const barrel = [];
let m;

while ((m = barrelRe.exec(indexText)) !== null) barrel.push(m[1]);

// 空转自证：解析不到就是判据坏了（改名 / 换了导出写法），不能平凡通过
if (barrel.length === 0)
{
    console.error(`❌ 在 ${INDEX_PATH} 里没扫到任何 \`export * from '@feng3d/*'\` —— 判据空转，先修脚本`);
    process.exit(1);
}

const declared = new Set(Object.keys(pkg.dependencies ?? {}).filter((d) => d.startsWith('@feng3d/')));
const seen = new Set();

for (const name of barrel)
{
    if (seen.has(name)) problems.push(`桶里重复导出 \`${name}\`（同一包出现两次，其中一行会静默失效）`);
    seen.add(name);
    if (!declared.has(name)) problems.push(`桶里导出了 \`${name}\`，但 ${PKG_PATH} 的 dependencies 里没有它（用了却没声明）`);
}

for (const name of declared)
{
    if (seen.has(name)) continue;
    if (!NON_BARREL_PACKAGES.has(name))
    {
        problems.push(`\`${name}\` 已声明为依赖、却既不在桶里也不在 NON_BARREL_PACKAGES 白名单里（声明了却从桶里漏掉）`);
    }
}

// 白名单里不许留已经进桶 / 已经不存在的包（防止白名单腐化成「永远不用看的角落」）
for (const name of NON_BARREL_PACKAGES.keys())
{
    if (!declared.has(name)) problems.push(`白名单里的 \`${name}\` 已不是 feng3d 的依赖，请从 NON_BARREL_PACKAGES 删掉`);
    else if (seen.has(name)) problems.push(`白名单里的 \`${name}\` 其实已经在桶里了，请从 NON_BARREL_PACKAGES 删掉`);
}

if (problems.length > 0)
{
    console.error('❌ 聚合桶与依赖声明不一致（issue #592 / R1）：');
    for (const p of problems) console.error(`   · ${p}`);
    process.exit(1);
}

const nonBarrel = [...NON_BARREL_PACKAGES.keys()].join(' / ');

console.log(`✅ 聚合桶可见性：桶里 ${barrel.length} 个 @feng3d 子包全部在 dependencies 里、无重复；`
    + `另有 ${NON_BARREL_PACKAGES.size} 个依赖有意不聚合（${nonBarrel}）`);
