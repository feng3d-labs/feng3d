/**
 * R2 门禁覆盖率探针（issue #606 后续 → 判据 AST 化见 issue #614）。
 *
 * **它量的是「行级判据 vs AST 判据」的差距**：两条 R2 门禁脚本原先的判据都是行级的
 * （「行首无空白 = 模块顶层」+ 单行正则）。本探针用 TypeScript AST 独立算一遍
 * 「真正在 import 时执行的 `new`」，再按同一行级规则判断门禁能不能看见它，
 * 从而给出**漏网清单 + 成因分类 + 换成 AST 判据后的基线新增量**。
 *
 * 判据**已经**在 issue #614 里换成了 AST（实现是 `scripts/r2-module-scope.mjs`，
 * 两条门禁共用）。所以本探针现在的用途变成**独立复核**：它用另一份实现算同一批数字
 * （总数 + 每个「文件::构造器」键），与门禁的输出对得上，才说明门禁的 AST 层没写错。
 * 它仍然**不是门禁**、刻意不进 CI——它的结论是"判据够不够用"，不是"代码有没有违规"。
 *
 * 用法（只读，不改仓库、不写任何文件）：
 *   node scripts/probe-r2-blindspots.mjs          # 汇总 + 每类前 40 条
 *   node scripts/probe-r2-blindspots.mjs --all    # 打印全部漏网条目
 *
 * 读数记录（`packages/` 全量；#614 欠账批在 `202dbfe47` 上用两份实现各跑一遍复算过）：
 *
 * | 口径 | 修掉探针自身的 IIFE 缺陷之前 | 之后（现在的输出） |
 * |---|---|---|
 * | `new` 总出现处 | 1408 | 1408 |
 * | import 时真的执行 | 157 处 / 136 键 | **158 处 / 137 键** |
 * | 两条行级脚本能看见 | 96 处 | 96 处 |
 * | 真漏网 | 61 处 | **62 处** |
 * | 其中空参缓存（本该「新增即失败」） | 12 处 | 12 处 |
 *
 * #614 那批的文档、提交信息与脚本注释里记的是「1409 / 159 处 / 138 键 / 97 处」——整体**偏大 1**，
 * 本批按实测校正（差值"漏 62 处"两端一致，那一项原本就是对的）。
 *
 * **"之后"那一列是本批（issue #614）顺手修掉的探针自身缺陷**：原先的 `ctxOf` 用
 * `CallExpression.expression === 函数节点` 认 IIFE，而最常见的写法 `(() => { ... })()`
 * 在 AST 里隔着 `ParenthesizedExpression`——于是**带括号的 IIFE 整类被判成"函数体内"**，
 * 探针自称覆盖的"IIFE 盲区"其实一直**没被覆盖**。修正后多出来的那一处正是
 * `packages/editor/src/bridge/EditorBridge.ts:50-60` 的
 * `const BRIDGE_CLIENT_ID = (() => {...})()`（IIFE 里 `new URLSearchParams(window.location.search)`）。
 *
 * **空参缓存的读数会随清欠账下降**：12 处 →（#614 欠账批）**3 处**，对应门禁基线 135 键 → **125 键**
 * （128 是本批清掉 7 个空参缓存键后的值；rebase 到最新 master 时又随 3 个文件删除/迁移降到 125）。
 * 剩下 3 处是 `packages/assets/src/AssetData.ts` 的 2 处（公开 `static` 资源登记表，
 * 属公开 API 形态、本批按理由保留）与 `packages/webgpu/test_web/index.ts:423` 的 1 处
 * （`DOMContentLoaded` 回调内的局部变量，保守判据的**已知假阳性**）——处置明细见 `docs/CI.md` §2.1。
 *
 * **本仓读数会随清欠账继续下降**（ChainMap 批，2026-10-05）：`new ChainMap()` 30 处 → **0 处**，
 * 上面 ① 的 `static-field` 盲区从 **33 处 / 31 键** 降到 **3 处 / 2 键**，
 * 门禁基线 125 键 →（#624 清掉 terrain 的 1 个键）124 → **95 键**；import 期执行的 `new` 从 146 处（127 键）降到 **115 处（97 键）**。
 *
 * 四类盲区成因（都能在本仓现状里指到实例）：
 *   ① 类 `static` 字段 / `static` 块初始化器：类声明在模块顶层时，初始化器在 import 时执行
 *      （典型是 `static map = new ChainMap()`——webgpu 的 caches 里原有 30 处、已全部 lazy-init；
 *      现存 3 处见上面的 `static-field` 分类）；
 *   ② 顶层 IIFE：issue #56 的根因 `new AudioContext()` 就是这个形态（实例见上）；
 *   ③ 多行声明：`const x =\n    new Map();`（`new` 所在行有前导空白）；
 *   ④ 模块级块 / 对象字面量 / 回调里的缩进行（`if (...) { const s = new Set(); }`、
 *      `{ a: new Set([...]) }`、`[...].forEach(() => new X())`）。
 *
 * 另外自研 eslint 规则 `feng3d/no-module-side-effect`（AST 判据）也不覆盖：顶层 IIFE 里的 `new Map()`、
 * 类字段初始化器（`isModuleScope` 见到函数节点 / `ClassBody` 就放行）。
 * **`WeakSet` 那条缺口已不存在**（issue #652 补进规则层，理由与核实过程见 `docs/CI.md` §2.1.1 边界 4）：
 * 规则层与脚本层的候选名单现在是同一集合，且由 `scripts/check-module-side-effects.mjs` 启动时的
 * `checkCacheNameLists` 断言守着——本探针的 `CACHE_RE` **刻意不在**那份断言的范围里（它要冻结历史读数）。
 *
 * 上面这张表是**历史读数**；本机再复测（issue #652 落地时、rebase 到当时的 master 之后）的实时输出是
 * `全库 1423 / import 期 117 处（96 键）/ 行级可见 94 处 / 漏 24 处`，与 `docs/CI.md` §2.1 的「再复测」一致。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import ts from 'typescript';

const ROOT = process.cwd();
const PRINT_ALL = process.argv.includes('--all');
const SKIP_DIRS = new Set(['node_modules', 'dist', 'lib', 'public', '.git', 'tmp']);

/** 旧（行级）check-toplevel-new.mjs 的判据 */
const TOPLEVEL_NEW_RE = /new\s+([A-Za-z_$][\w$.]*)\s*(?:<[^(]*>)?\s*\(/;
/**
 * 旧（行级）check-module-side-effects.mjs 的**缓存**判据。
 *
 * 刻意**不含 `ChainMap`**：这一栏量的是"换成 AST 判据前后，行级判据能看见多少"，
 * 而那一版候选名单就是 `Map/WeakMap/Set/WeakSet`（`ChainMap` 是后来才补进 AST 判据的
 * 项目自有容器，且它在 `packages/` 下的模块级存量已是 0 处）。改这个正则会篡改历史读数。
 */
const CACHE_RE = /^(?:export\s+)?(?:const|let|var)\s+\w+\s*(?::[^=]+)?=\s*new\s+(Map|WeakMap|Set|WeakSet)\b[^(]*\(\s*\)\s*;?\s*$/;
/** 成因分类的中文名（输出用） */
const CTX_LABEL = {
    'module': '模块顶层（多行声明 / 顶层块 / 对象字面量 / IIFE）',
    'static-field': '类 static 字段初始化器',
    'static-block': '类 static 块',
    'module-call-callback': '模块级调用回调（如 [...].forEach(...)）',
};

/**
 * 「透明」包装表达式（括号 / 类型断言）——剥掉后还是同一个表达式。
 *
 * **本次修正（issue #614 的破坏性实验实测）**：本探针最初的 `ctxOf` 用
 * `grand.expression === parent` 认 IIFE，而最常见的写法 `(() => { ... })()` 在 AST 里是
 * `CallExpression.expression === ParenthesizedExpression(ArrowFunction)`——比对不成立，
 * 于是**带括号的 IIFE 整类被判成"函数体内"**，`moduleRows` 里根本没有它们：
 * 文件头写的"② 顶层 IIFE"盲区其实**没有被这份探针覆盖**。
 * 现在两侧（探针与 `scripts/r2-module-scope.mjs`）都用同一套剥壳逻辑。
 */
const TRANSPARENT_WRAPPERS = new Set([
    ts.SyntaxKind.ParenthesizedExpression,
    ts.SyntaxKind.AsExpression,
    ts.SyntaxKind.TypeAssertionExpression,
    ts.SyntaxKind.NonNullExpression,
    ts.SyntaxKind.SatisfiesExpression,
]);

/**
 * 剥掉括号 / 类型断言等透明包装。
 *
 * @param {import('typescript').Node | undefined} node 节点
 * @returns {import('typescript').Node | undefined} 剥掉包装后的节点
 */
function unwrapExpression(node)
{
    let current = node;

    while (current && TRANSPARENT_WRAPPERS.has(current.kind)) current = current.expression;

    return current;
}

/**
 * 函数节点的有效父节点：先向上穿过括号 / 类型断言等透明包装。
 *
 * `(() => { ... })()` 里箭头函数的直接父是 `ParenthesizedExpression`，再上一层才是 `CallExpression`。
 *
 * @param {import('typescript').Node} node 节点
 * @returns {import('typescript').Node | undefined} 有效父节点
 */
function effectiveParent(node)
{
    let parent = node.parent;

    while (parent && TRANSPARENT_WRAPPERS.has(parent.kind)) parent = parent.parent;

    return parent;
}

/** `new` 出现处所在行（1 基）与整行文本 */
function lineInfo(text, start)
{
    const before = text.slice(0, start);
    const lineStart = before.lastIndexOf('\n') + 1;
    const lineEnd = text.indexOf('\n', start);

    return {
        line: before.split('\n').length,
        text: text.slice(lineStart, lineEnd < 0 ? text.length : lineEnd),
    };
}

/** 行级判据能不能看见这一处（行首无空白 + 行级正则命中） */
function lineVisible(text, start)
{
    const { text: line } = lineInfo(text, start);

    if (/^\s/.test(line)) return false;

    return TOPLEVEL_NEW_RE.test(line);
}

/** 这一处是否满足 check-module-side-effects 的缓存判据（整行匹配） */
function cacheVisible(text, start)
{
    const { text: line } = lineInfo(text, start);

    if (/^\s/.test(line)) return false;

    return CACHE_RE.test(line.trim());
}

/**
 * 从 `new` 节点向上判断它是否真的在 import 时执行，并给出成因分类。
 *
 * 关键点三个：① 直接调用的函数表达式（IIFE）**继续向上看**，不当作"函数体内"；
 * ② 作为回调传给某个调用的函数只在最终落在模块顶层时才算模块级（保守：`[...].forEach` 会命中）；
 * ③ 类 `static` 字段 / `static` 块算模块级，实例字段不算。
 */
function ctxOf(node)
{
    let n = node;
    let passedAsCallback = false;

    while (n.parent)
    {
        const p = n.parent;

        if (ts.isFunctionLike(p))
        {
            const gp = effectiveParent(p);

            if (gp && ts.isCallExpression(gp) && unwrapExpression(gp.expression) === p) { n = gp; continue; }   // IIFE → 继续向上看
            if (gp && ts.isCallExpression(gp) && gp.arguments.some((argument) => unwrapExpression(argument) === p))  // 作为回调传给某个调用
            {
                passedAsCallback = true;
                n = gp;
                continue;
            }

            return 'in-function';                                                           // 函数声明 / 赋给变量的函数
        }
        if (p.kind === ts.SyntaxKind.ClassStaticBlockDeclaration) return 'static-block';

        if (ts.isPropertyDeclaration(p) && p.parent
            && (p.parent.kind === ts.SyntaxKind.ClassDeclaration || p.parent.kind === ts.SyntaxKind.ClassExpression))
        {
            return (ts.getCombinedModifierFlags(p) & ts.ModifierFlags.Static) ? 'static-field' : 'instance-field';
        }
        if (p.kind === ts.SyntaxKind.ClassDeclaration || p.kind === ts.SyntaxKind.ClassExpression) return 'class-other';
        if (ts.isSourceFile(p)) return passedAsCallback ? 'module-call-callback' : 'module';

        n = p;
    }

    return 'module';
}

function walk(dir, out = [])
{
    for (const name of readdirSync(dir))
    {
        if (SKIP_DIRS.has(name)) continue;

        const full = join(dir, name);

        if (statSync(full).isDirectory()) walk(full, out);
        else if (name.endsWith('.ts') && !name.endsWith('.spec.ts') && !name.endsWith('.d.ts')) out.push(full);
    }

    return out;
}

/** 真正在 import 时执行的成因集合 */
const MODULE_LEVEL = new Set(['module', 'static-field', 'static-block', 'module-call-callback']);
const CACHE_NAMES = /^(Map|WeakMap|Set|WeakSet)$/;

const rows = [];

for (const file of walk(join(ROOT, 'packages')))
{
    const rel = relative(ROOT, file).split(sep).join('/');
    const text = readFileSync(file, 'utf8');
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);

    const visit = (node) =>
    {
        if (ts.isNewExpression(node))
        {
            const start = node.getStart(sf);
            const { line } = lineInfo(text, start);
            const name = node.expression.getText(sf);
            const emptyArgs = (node.arguments?.length ?? 0) === 0;

            rows.push({
                rel,
                name,
                line,
                ctx: ctxOf(node),
                visible: lineVisible(text, start),
                cache: cacheVisible(text, start),
                // 缓存判据（旧行级那一版）只认「空参 / 只有泛型实参」的 Map/WeakMap/Set/WeakSet；
                // `ChainMap` 不在这一档里——它是项目自有容器，由 AST 判据单列（本仓模块级存量 0 处）
                emptyCache: emptyArgs && CACHE_NAMES.test(name),
                key: `${rel}::${name.split('.').pop()}`,
            });
        }
        ts.forEachChild(node, visit);
    };
    visit(sf);
}

const baseline = new Set(JSON.parse(readFileSync(join(ROOT, 'scripts', 'toplevel-new-baseline.json'), 'utf8')).entries);
const moduleRows = rows.filter((r) => MODULE_LEVEL.has(r.ctx));
const visibleRows = rows.filter((r) => r.visible);
const missed = moduleRows.filter((r) => !r.visible).sort((a, b) => (a.rel + a.line).localeCompare(b.rel + b.line));

const byCtx = new Map();

for (const r of missed) byCtx.set(r.ctx, [...(byCtx.get(r.ctx) ?? []), r]);

const missedKeys = new Set(missed.map((r) => r.key));
const addedKeys = [...missedKeys].filter((k) => !baseline.has(k)).sort();
const cacheMissed = moduleRows.filter((r) => r.emptyCache && !r.cache);
const staticRows = moduleRows.filter((r) => r.ctx === 'static-field' || r.ctx === 'static-block');

const printRows = (list) =>
{
    const shown = PRINT_ALL ? list : list.slice(0, 40);

    for (const r of shown) console.log(`      ${r.rel}:${r.line}  new ${r.name}${(r.emptyCache ? '()' : '(…)')}`);

    if (!PRINT_ALL && list.length > shown.length) console.log(`      … 另 ${list.length - shown.length} 处（--all 打印全部）`);
};

console.log('## 概览');
console.log(`  AST 全库 \`new\` 出现处：${rows.length}`);
console.log(`  其中在 import 时执行（模块级 / 类 static / 模块级回调）：${moduleRows.length}`);
console.log(`  两条行级门禁能看见（行首无空白 + 行级正则命中）：${visibleRows.length}`);
console.log(`  ⇒ 真漏网（模块级但行级判据看不见）：${missed.length}`);
console.log('');

console.log('## 漏网按成因分类');
for (const [ctx, list] of byCtx)
{
    console.log(`  [${ctx}] ${CTX_LABEL[ctx] ?? ctx}：${list.length} 处`);
    printRows(list);
}
console.log('');

// 口径说明：本探针量的始终是「**行级**判据能看见多少」，而两条门禁**当前已是 AST**（#614）
// ——所以下面两段的"看不见 / 全都不看"是对**行级**口径说的、不是对当前门禁说的：
// 这些键现在的 AST 门禁都看得见（类 static 字段 / 块那一档在 eslint 规则层仍不看）。
console.log('## 历史对照（假定行级判据）：换成 AST 时基线会新增的键（这些键当前的 AST 门禁已看得见）');
console.log(`  漏网键（文件::构造器）：${missedKeys.size} 个，其中不在现基线（${baseline.size} 个）里的：${addedKeys.length} 个`);
for (const k of addedKeys) console.log(`      + ${k}`);
console.log('');

console.log('## check-module-side-effects 漏掉的「空参缓存」（本该「新增即失败」的那一类）');
console.log(`  ${cacheMissed.length} 处`);
for (const r of cacheMissed) console.log(`      ${r.rel}:${r.line}  [${CTX_LABEL[r.ctx] ?? r.ctx}]  new ${r.name}()`);
console.log('');

console.log('## 类 static 字段 / static 块里的模块级 `new`（行级口径看不见；#614 后两条 AST 脚本已覆盖这一档，eslint 规则层仍不看）');
console.log(`  ${staticRows.length} 处 / ${new Set(staticRows.map((r) => r.rel)).size} 文件 / ${new Set(staticRows.map((r) => r.key)).size} 个键`);
console.log('');
console.log('提示：本脚本只读、不是门禁；收紧判据（改 AST）与量级评估见 docs/CI.md §2.1.1「已知局限」。');
