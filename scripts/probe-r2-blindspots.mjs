/**
 * R2 门禁覆盖率探针（issue #606 后续；为「行级判据 vs AST 判据」的差距留一份可复现的读数）。
 *
 * 两条 R2 门禁脚本（`check-module-side-effects.mjs` / `check-toplevel-new.mjs`）的判据都是**行级**的：
 * 「行首无空白 = 模块顶层」+ 单行正则。本探针用 TypeScript AST 独立算一遍「真正在 import 时执行的 `new`」，
 * 再按同一行级规则判断门禁能不能看见它，从而给出**漏网清单 + 成因分类 + 换成 AST 判据后的基线新增量**。
 *
 * 用法（只读，不改仓库、不写任何文件）：
 *   node scripts/probe-r2-blindspots.mjs          # 汇总 + 每类前 40 条
 *   node scripts/probe-r2-blindspots.mjs --all    # 打印全部漏网条目
 *
 * **它不是门禁**，刻意不进 CI：结论本身是「判据不够用」，在收紧判据（改 AST）之前它只会一直红着，
 * 放进 CI 就是一条永远红的噪声。`check-module-side-effects.mjs` / `check-toplevel-new.mjs` 才是门禁。
 *
 * 2026-10-05 的读数（就是它促成 issue #606 的后续 issue）：
 *   `packages/` 下 `new` 共 1409 处 → import 时真的执行 **158** 处 → 两条行级脚本只看见 **97** 处
 *   → 漏 **61** 处（换算成「文件::构造器」是 44 个未登记基线键），其中 **12 处是空参缓存**
 *   （`new Map/WeakMap/Set/WeakSet()`，本该按 `check-module-side-effects.mjs --strict` 的
 *   「新增即失败」拦下）。
 *
 * 四类盲区成因（都能在本仓现状里指到实例）：
 *   ① 类 `static` 字段 / `static` 块初始化器：类声明在模块顶层时，初始化器在 import 时执行
 *      （`private static map = new ChainMap()`，webgpu 的 caches 里 20 余处）；
 *   ② 顶层 IIFE：issue #56 的根因 `new AudioContext()` 就是这个形态，至今三条判据都不看它；
 *   ③ 多行声明：`const x =\n    new Map();`（`new` 所在行有前导空白）；
 *   ④ 模块级块 / 对象字面量 / 回调里的缩进行（`if (...) { const s = new Set(); }`、
 *      `{ a: new Set([...]) }`、`[...].forEach(() => new X())`）。
 *
 * 另外自研 eslint 规则 `feng3d/no-module-side-effect`（AST 判据）也不覆盖：`WeakSet`
 * （候选名单只有 `Map/WeakMap/Set`）、顶层 IIFE 里的 `new Map()`、类字段初始化器。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import ts from 'typescript';

const ROOT = process.cwd();
const PRINT_ALL = process.argv.includes('--all');
const SKIP_DIRS = new Set(['node_modules', 'dist', 'lib', 'public', '.git', 'tmp']);

/** 与 check-toplevel-new.mjs 完全一致的行级判据 */
const TOPLEVEL_NEW_RE = /new\s+([A-Za-z_$][\w$.]*)\s*(?:<[^(]*>)?\s*\(/;
/** 与 check-module-side-effects.mjs 完全一致的缓存判据 */
const CACHE_RE = /^(?:export\s+)?(?:const|let|var)\s+\w+\s*(?::[^=]+)?=\s*new\s+(Map|WeakMap|Set|WeakSet)\b[^(]*\(\s*\)\s*;?\s*$/;
/** 成因分类的中文名（输出用） */
const CTX_LABEL = {
    'module': '模块顶层（多行声明 / 顶层块 / 对象字面量 / IIFE）',
    'static-field': '类 static 字段初始化器',
    'static-block': '类 static 块',
    'module-call-callback': '模块级调用回调（如 [...].forEach(...)）',
};

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
            const gp = p.parent;

            if (gp && ts.isCallExpression(gp) && gp.expression === p) { n = gp; continue; }   // IIFE → 继续向上看
            if (gp && ts.isCallExpression(gp) && gp.arguments.includes(p))                   // 作为回调传给某个调用
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
                // 缓存判据只认「空参 / 只有泛型实参」的 Map/WeakMap/Set/WeakSet
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

console.log('## 若把判据换成 AST：基线会新增的键（收紧面）');
console.log(`  漏网键（文件::构造器）：${missedKeys.size} 个，其中不在现基线（${baseline.size} 个）里的：${addedKeys.length} 个`);
for (const k of addedKeys) console.log(`      + ${k}`);
console.log('');

console.log('## check-module-side-effects 漏掉的「空参缓存」（本该「新增即失败」的那一类）');
console.log(`  ${cacheMissed.length} 处`);
for (const r of cacheMissed) console.log(`      ${r.rel}:${r.line}  [${CTX_LABEL[r.ctx] ?? r.ctx}]  new ${r.name}()`);
console.log('');

console.log('## 类 static 字段 / static 块里的模块级 `new`（三条判据全都不看）');
console.log(`  ${staticRows.length} 处 / ${new Set(staticRows.map((r) => r.rel)).size} 文件 / ${new Set(staticRows.map((r) => r.key)).size} 个键`);
console.log('');
console.log('提示：本脚本只读、不是门禁；收紧判据（改 AST）与量级评估见 docs/CI.md §2.1「已知局限」。');
