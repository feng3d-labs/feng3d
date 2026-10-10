#!/usr/bin/env node
/**
 * **检查器接线门禁**：每个检查器都要有执行者。
 *
 * ## 为什么需要它
 *
 * 本仓的元规则是「**每条规范必须有机器执行者**——无执行者的只能写进『建议』，不算规范」
 * （根 `AGENTS.md` §15）。但**执行者自己也可能没有执行者**：
 *
 * 一个 `scripts/check-*.mjs` 写完、放在目录里、**却没人调用** —— 它就是**空转**：
 * 作者本地跑一次、看见绿，之后永远不再跑；而看目录会以为"这一条有门禁守着"。
 * 这类疏漏在本仓**真实发生过**：`check-editor-boot.mjs`、`check-editor-dead-code.mjs`
 * 等一批都曾在 `gates:host` 之外，靠人记得手动跑（盘点#266 时也踩到同类问题：
 * "有没有执行者"要同时查 `scripts/`、`test/`、workflow、`package.json` 四处，手工查必漏）。
 *
 * 这条判据把它变成机器问题：**`check-*.mjs` 必须被某个 workflow 或 `package.json` 的
 * script 引用**，而且**被引用的脚本必须真的存在**（防"接线指向空气"）。
 *
 * ## 判据
 *
 * | # | 判据 | 少了它会漏掉什么 |
 * |---|---|---|
 * | 1 | 每个 `scripts/check-*.mjs` 都被引用 | 写了门禁却没人跑（空转） |
 * | 2 | 被引用的 `scripts/**.mjs` **都存在** | 接线指向已删除/改名的脚本（跑起来才报 ENOENT） |
 * | 3 | 扫到的 workflow ≥ 2、引用的脚本 ≥ 20 | 扫描器坏了（判据 1 会**平凡通过**） |
 * | 4 | 本脚本**自己**也在被引用之列 | 它自己成了孤儿——判据 1 的反例 |
 *
 * 判据 3 是**空转自证**：判据 1 的形式是"对集合里的每个元素断言"，集合空了它就永远通过，
 * 所以必须先证明集合非空（本仓实测 3 个 workflow、40 个 `check-*.mjs`）。
 *
 * 退出码：0 通过；1 有失败。
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = process.cwd();
const WORKFLOW_DIR = resolve(ROOT, '.github', 'workflows');
const SCRIPTS_DIR = resolve(ROOT, 'scripts');

let total = 0;
let failed = 0;

/**
 * 记一条判据。
 *
 * @param {string} title 判据
 * @param {boolean} condition 是否通过
 * @param {string} [detail] 附加说明
 */
function check(title, condition, detail = '')
{
    total += 1;
    if (!condition) failed += 1;
    console.log(`  ${condition ? 'PASS' : 'FAIL'}  ${title}${detail ? ` — ${detail}` : ''}`);
}

// ---------- 采集 ----------

const workflows = readdirSync(WORKFLOW_DIR).filter((name) => /\.ya?ml$/.test(name));
const workflowText = workflows.map((name) => readFileSync(join(WORKFLOW_DIR, name), 'utf8')).join('\n');
const packageText = readFileSync(resolve(ROOT, 'package.json'), 'utf8');

/** 所有被引用的 `scripts/**` 相对路径（来自 workflow 与根 package.json） */
const referenced = new Set();
const ALL_TEXT = `${workflowText}\n${packageText}`;

for (const matched of ALL_TEXT.matchAll(/scripts\/([A-Za-z0-9._/-]+\.mjs)/g))
{
    referenced.add(matched[1]);
}

const checkers = readdirSync(SCRIPTS_DIR).filter((name) => /^check-.*\.mjs$/.test(name));

// ---------- 判据 3：空转自证（先证明集合非空，否则判据 1 会平凡通过）----------

check('扫描器扫到了多个 workflow（集合非空）', workflows.length >= 2, `${workflows.length} 个：${workflows.join(' / ')}`);
check('扫描器扫到了足够多的脚本引用（集合非空）', referenced.size >= 20, `${referenced.size} 条引用`);
check('扫描器扫到了足够多的检查器（集合非空）', checkers.length >= 20, `${checkers.length} 个 check-*.mjs`);

// ---------- 判据 1：每个检查器都要有执行者 ----------

const orphans = checkers.filter((name) => !referenced.has(name));

check('★ 每个 `scripts/check-*.mjs` 都被某个 workflow 或 package.json 的 script 引用',
    orphans.length === 0,
    orphans.length === 0 ? `检查器 ${checkers.length} 个全都有执行者` : `孤儿：${orphans.join(' / ')}`);

// ---------- 判据 2：被引用的脚本必须存在（防"接线指向空气"）----------

const missing = [...referenced].filter((relative) => !existsSync(join(SCRIPTS_DIR, relative)));

check('★ 被引用的每一个 `scripts/**.mjs` 都真的存在',
    missing.length === 0,
    missing.length === 0 ? `引用 ${referenced.size} 条全都存在` : `接线指向不存在的文件：${missing.join(' / ')}`);

// ---------- 判据 4：本脚本自己也得被引用（判据 1 的反例，自指）----------

check('★ 本脚本自己在被引用之列（它不许自己成为孤儿）',
    referenced.has('check-verifier-wiring.mjs'),
    referenced.has('check-verifier-wiring.mjs') ? '已接线' : '把 check-verifier-wiring.mjs 加进 gates:host');

// ---------- 判据 5：**可达性**（"被引用" ≠ "真的会跑到"）----------
//
// 判据 1 只要求"被引用"。但**引用它的那个 script 本身可能是孤儿** ——
// 例如某个 `check-x.mjs` 只挂在 `npm run foo` 里，而 `foo` 从来没有任何 workflow 调用。
// 那样它一样是空转，而判据 1 会判它"已接线"。
//
// 所以这里从每个 workflow 的 `run:` 出发递归展开（npm script → `pre` 钩子 → 子 script），
// 得到"**CI 上真的会跑到的脚本集合**"，再与全部检查器对照。
//
// ⚠️ **写这条判据时踩到的坑**（留在这里给下一个人）：第一版只处理 npm script body 的**第一段**，
// 而 `prelint:ci` 的 body 是一整串 `&&` —— 于是它把 **24 个其实可达的**检查器
// 误报成"不可达"。**判据自己有 bug，就会制造假结论**，而假结论比没有判据更坏：
// 它会让人去改一份本来正确的文档。所以下面每条结论都配了空转自证。
const packageScripts = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')).scripts;
const reachable = new Set();
const visitedScripts = new Set();

/** 展开一条命令（**必须先按 `&&` 拆开**，再逐段处理——见上面那个坑） */
function walkCommand(command)
{
    for (const piece of command.split(' && '))
    {
        const trimmed = piece.trim();

        if (trimmed !== '') walkPiece(trimmed);
    }
}

/** 处理一段命令 */
function walkPiece(command)
{
    const npmMatched = command.match(/^npm (?:run )?([\w:.-]+)(\s|$)/);

    if (npmMatched)
    {
        const name = npmMatched[1];

        if (visitedScripts.has(name)) return;

        visitedScripts.add(name);

        // npm 会自动跑 `pre<name>` 钩子
        const pre = packageScripts[`pre${name}`];

        if (typeof pre === 'string') walkCommand(pre);

        const body = packageScripts[name];

        if (typeof body === 'string') walkCommand(body);
        return;
    }

    for (const matched of command.matchAll(/(?:node\s+)([\w./-]+\.mjs)/g)) reachable.add(matched[1].replace(/^\.\//, ''));
}

for (const name of workflows)
{
    const lines = readFileSync(join(WORKFLOW_DIR, name), 'utf8').split(/\r?\n/);

    for (const line of lines)
    {
        const matched = line.match(/^\s*run:\s*(.+)$/);

        if (matched) walkCommand(matched[1].trim().replace(/^['"]|['"]$/g, ''));
    }
}

const unreachable = checkers.filter((name) => !reachable.has(`scripts/${name}`));

check('扫描器扫到了足够多的可达脚本（集合非空）', reachable.size >= 10, `${reachable.size} 个可达的 .mjs`);

check('★ 每个检查器都能从某个 workflow 出发**走到**（不只是「被引用」）',
    unreachable.length === 0,
    unreachable.length === 0 ? `${checkers.length} 个全部可达` : `到不了：${unreachable.join(', ')}`);

// ---------- 判据 6：每个 `scripts/*.mjs` 要么**可达**、要么**文档里说得清** ----------
//
// 判据 5 只覆盖 `check-*.mjs`（42 个），而 `scripts/` 下共 77 个 `.mjs`。
// 其余那些（`editor-*` / 工具脚本 / vite provider）大多是**手动或 e2e 专用**，那没问题 ——
// 但要求**文档里说得清用法**（本仓惯例：`packages/editor/AGENTS.md` 逐个写了用法）。
// 既没人跑、文档也没提的，就是"写了却谁也不跑"。
//
// ⚠️ **这条判据的第一版给出了假结论**（"1 个孤儿 `migrate-scene-json.mjs`"）——
// 根因是我把文档集合**写死成 5 份**，而它记在 `docs/migrations/SERIALIZATION_MIGRATION.md` 里。
// 加上上一轮"24 个不可达"，**连续两轮的否定性结论都是假的**，根因都是扫描器没扫全。
// 所以：**"某某没人跑/没被提到"这类结论，必须自证"我扫全了"** —— 下面两条空转自证就是干这个的。
function collectDocs(dir, out = [])
{
    for (const name of readdirSync(dir))
    {
        // **必须排除 `tmp/`**：那是本地用来放大段评论 / PR body 的临时目录（不入库），
        // 它会让"扫到多少份 .md"在本地虚高（实测 206 vs CI 58），
        // 也会让"这个脚本有没有文档"的判定在本地偏松。
        if (['node_modules', 'dist', '.git', 'coverage', '.verify', '.temp', 'tmp'].includes(name)) continue;

        const full = join(dir, name);

        if (statSync(full).isDirectory()) collectDocs(full, out);
        else if (name.endsWith('.md')) out.push(full);
    }

    return out;
}

const docs = collectDocs(ROOT);
const docText = docs.map((one) => readFileSync(one, 'utf8')).join('\n');
const allScripts = readdirSync(SCRIPTS_DIR).filter((name) => name.endsWith('.mjs'));
const undocumented = allScripts.filter((name) => !reachable.has(`scripts/${name}`) && !docText.includes(name));

check('扫描器扫到了足够多的 .md（证明「没被提到」的结论是扫全之后得出的）', docs.length >= 40, `${docs.length} 份 .md（仓库内，不含 tmp/）`);
check('扫描器扫到了足够多的 .mjs（集合非空）', allScripts.length >= 50, `${allScripts.length} 个 .mjs`);

check('★ 每个 scripts/*.mjs 要么能从 workflow 走到、要么文档里说得清',
    undocumented.length === 0,
    undocumented.length === 0 ? `${allScripts.length} 个都可达或有文档` : `既不可达又没文档：${undocumented.join(', ')}`);

// ---------- 判据 7：§2.1.2 声称的「回归保护」确实存在且数量对得上 ----------
//
// §2.1.2 专门讲"**门禁自身的可靠性**"。它声称的四个数字会随"改判据"而腐化，
// 而它们恰恰是"判据坏了能不能被发现"的保证 —— 所以值得像包数一样钉住。
//
// 实现上**跑那两个脚本并读它自报的数字**（而不是去数源码里的常量）——
// 因为"自报"才是它们真正执行的东西，读常量可能与实际执行脱节。
/** 上次 runScript 的错误（供"读不到"时区分"没输出"与"跑不起来"） */
let lastRunError = null;

function runScript(script)
{
    lastRunError = null;

    const result = spawnSync(process.execPath, [`scripts/${script}`], { encoding: 'utf8', cwd: ROOT });

    if (result.error)
    {
        lastRunError = String(result.error.message ?? result.error);
    }
    else if (result.status !== 0)
    {
        lastRunError = `退出码 ${result.status}`;
    }

    // **两流都要**：`execFileSync` 只回 stdout，而自检那句可能走 stderr（实测因此读不到）
    return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

/** 从"自检段"里数 PASS/FAIL 行（比找"共 N 条"稳：实测 `check-toplevel-new` 没有那句话） */
function selfCheckLines(script)
{
    const out = runScript(script);
    const lines = out.split(/\r?\n/);
    const start = lines.findIndex((line) => /---\s*自检/.test(line));

    if (start < 0) return null;

    let count = 0;

    for (let index = start + 1; index < lines.length; index += 1)
    {
        if (/^---/.test(lines[index])) break;
        if (/PASS|FAIL/.test(lines[index])) count += 1;
    }

    return count;
}

const moduleEffectsSelfChecks = Number(runScript('check-module-side-effects.mjs').match(/判据自检 (\d+) 条/)?.[1] ?? NaN);
const toplevelNewSelfChecks = selfCheckLines('check-toplevel-new.mjs');

check('★ check-module-side-effects 的判据自检条数与 §2.1.2 声称的一致（13）',
    moduleEffectsSelfChecks === 13,
    `实测 ${Number.isNaN(moduleEffectsSelfChecks) ? `读不到（${lastRunError ?? '无错误信息'}）` : moduleEffectsSelfChecks} 条`);

check('★ check-toplevel-new 的判据自检条数与 §2.1.2 声称的一致（12）',
    toplevelNewSelfChecks === 12,
    `实测 ${toplevelNewSelfChecks ?? `读不到（${lastRunError ?? '无错误信息'}）`} 条`);

check('★ test/r2ModuleScope.spec.ts 存在，且 it( 条数与 §2.1.2 声称的一致（46）',
    (() =>
    {
        const path = resolve(ROOT, 'test/r2ModuleScope.spec.ts');

        if (!existsSync(path)) return false;

        return (readFileSync(path, 'utf8').match(/\bit\(/g) ?? []).length === 46;
    })(),
    (() =>
    {
        const path = resolve(ROOT, 'test/r2ModuleScope.spec.ts');

        if (!existsSync(path)) return '文件不存在';

        return `实测 ${(readFileSync(path, 'utf8').match(/\bit\(/g) ?? []).length} 条 it(`;
    })());

check('★ test/coverageProviderMerge.spec.ts 存在（§2.1.2 把它列为 coverage provider 的回归保护）',
    existsSync(resolve(ROOT, 'test/coverageProviderMerge.spec.ts')),
    existsSync(resolve(ROOT, 'test/coverageProviderMerge.spec.ts')) ? '存在' : '**不存在**');

// ---------- 结论 ----------

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 检查器接线未通过 —— 写了门禁却没人跑，等于没有门禁（元规则：每条规范必须有执行者）。');
    process.exit(1);
}

console.log(`✅ 检查器接线通过：${checkers.length} 个检查器都有执行者，${referenced.size} 条引用都指向真实文件`);
