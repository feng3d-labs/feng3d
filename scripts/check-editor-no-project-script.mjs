/**
 * 门禁：编辑器**不再**依赖"项目脚本（`project.js`）"那条旧链路（#271 收尾 / D12）。
 *
 * ## 为什么需要它
 *
 * `EditorAsset.runProjectScript()` 会读 `project.js` 并 `eval()`。而那条链路**实际不可用**——
 * `src/run.ts:8` 的注释写得很清楚：`project.js` 要由"编辑器内浏览器 TypeScript services"编译，
 * 而**编译器本体从未加载**，D12 已把"编辑器内编译"整体取消。更糟的是它失败只 `console.warn`，
 * 正是 #271 说的"失败被吞掉"同款。
 *
 * 删掉之后，这条门禁负责**不许它再长回来**：源码里不得出现 `runProjectScript`，
 * 模板清单里不得再带 `project.js`。
 *
 * ## 判据
 *
 * 1. `packages/editor/src/**` 里**没有** `runProjectScript`（标识符级，排除注释）；
 * 2. `EditorRS.ts` 的 `templateurls` **不含** `project.js` 条目；
 * 3. **方法自证**：判据函数喂正/负样例（该报的报、不该报的不报）——
 *    照 issue #652 的做法：判据写错时门禁会静默全绿，所以判据自己也要能被验。
 *
 * 退出码：0 = 通过；1 = 有违规或自证失败。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = process.cwd();
const EDITOR_SRC = resolve(ROOT, 'packages/editor/src');
const EDITOR_RS = resolve(EDITOR_SRC, 'assets/EditorRS.ts');

/** 采集一个目录下所有 `.ts` / `.vue` 文件 */
function collect(dir)
{
    const found = [];

    for (const entry of readdirSync(dir))
    {
        const full = join(dir, entry);

        if (statSync(full).isDirectory()) found.push(...collect(full));
        else if (entry.endsWith('.ts') || entry.endsWith('.vue')) found.push(full);
    }

    return found;
}

/**
 * 判据 1 的**判据函数**（抽出来是为了能自检）。
 *
 * 只看**代码**：注释里提到 `runProjectScript` 是说明（例如"它已删"），不算违规——
 * 与 `editor-singleton-survey.mjs` 的口径一致（先砍行尾注释、再排除整行注释）。
 *
 * @param {string} source 源码
 * @returns {boolean} 是否命中（true = 违规）
 */
function hasRunProjectScript(source)
{
    return source
        .split('\n')
        .map((line) => line.replace(/\/\/.*$/, ''))
        .filter((line) => !/^\s*(\/\*|\*)/.test(line))
        .some((line) => /\brunProjectScript\b/.test(line));
}

/**
 * 判据 2 的判据函数：模板清单里是否还有 `project.js` 条目。
 *
 * @param {string} source `EditorRS.ts` 源码
 * @returns {boolean} 是否命中（true = 违规）
 */
function hasProjectJsTemplate(source)
{
    return source
        .split('\n')
        .map((line) => line.replace(/\/\/.*$/, ''))
        .some((line) => /resource\/template\/project\.js/.test(line));
}

// ---------- 自证（issue #652 做法 2） ----------
const SELF_CHECKS = [
    { title: '代码里出现 `runProjectScript` → 报', run: () => hasRunProjectScript('await this.assetManager.runProjectScript();'), expect: true },
    { title: '注释里提到 `runProjectScript` → 不报', run: () => hasRunProjectScript('// `runProjectScript()` 已删（#271 收尾）'), expect: false },
    { title: '模板清单带 `project.js` → 报', run: () => hasProjectJsTemplate("    ['./resource/template/project.js', 'project.js'],"), expect: true },
    { title: '模板清单不带 → 不报', run: () => hasProjectJsTemplate("    ['./resource/template/app.js', 'app.js'],"), expect: false },
];

let selfFailed = 0;

console.log('--- 自证（判据喂合成样例，issue #652 做法 2）---');

for (const check of SELF_CHECKS)
{
    const actual = check.run();
    const ok = actual === check.expect;

    if (!ok) selfFailed += 1;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${check.title}`);
}

if (selfFailed > 0)
{
    console.error(`\n❌ 判据自检失败 ${selfFailed} 条：判据被改坏了，先修判据再谈门禁结论（issue #652）。`);
    process.exit(1);
}

// ---------- 判据 1：源码里不得有 runProjectScript ----------
const offenders = collect(EDITOR_SRC)
    .filter((file) => hasRunProjectScript(readFileSync(file, 'utf8')))
    .map((file) => relative(ROOT, file).split('\\').join('/'));

// ---------- 判据 2：模板清单不得带 project.js ----------
const templateHasProjectJs = hasProjectJsTemplate(readFileSync(EDITOR_RS, 'utf8'));

console.log('');
console.log('--- 判据 ---');
console.log(`  ${offenders.length === 0 ? 'PASS' : 'FAIL'}  源码里没有 \`runProjectScript\`（#271 收尾：那条链路不可用）`
    + (offenders.length > 0 ? ` — 命中：${offenders.join(' / ')}` : ''));
console.log(`  ${!templateHasProjectJs ? 'PASS' : 'FAIL'}  模板清单里没有 \`project.js\` 条目`
    + (templateHasProjectJs ? ' — 它会把不可用的旧链路带回每个新项目' : ''));

const failed = (offenders.length > 0 ? 1 : 0) + (templateHasProjectJs ? 1 : 0);

console.log('');
console.log(`共 ${SELF_CHECKS.length + 2} 项：通过 ${SELF_CHECKS.length + 2 - failed - selfFailed}，失败 ${failed + selfFailed}`);

if (failed > 0)
{
    console.error('\n❌ 编辑器又在依赖"项目脚本（project.js）"那条旧链路了（#271 / D12）。');
    console.error('   它要由"编辑器内浏览器 TypeScript services"编译，而编译器本体从未加载——失败还只 console.warn。');
    process.exit(1);
}

console.log('✅ 编辑器不再依赖项目脚本（project.js）那条旧链路');
