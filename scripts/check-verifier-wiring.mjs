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
import { existsSync, readFileSync, readdirSync } from 'node:fs';
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

// ---------- 结论 ----------

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 检查器接线未通过 —— 写了门禁却没人跑，等于没有门禁（元规则：每条规范必须有执行者）。');
    process.exit(1);
}

console.log(`✅ 检查器接线通过：${checkers.length} 个检查器都有执行者，${referenced.size} 条引用都指向真实文件`);
