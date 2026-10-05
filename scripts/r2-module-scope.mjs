/**
 * R2 判据的共享 AST 层（issue #614）。
 *
 * ## 为什么要有这个文件
 *
 * R2（零模块级副作用）原先由**两条独立脚本**守着，两条的判据都是**行级**的
 * （「行首无空白 = 模块顶层」+ 单行正则）：
 *
 *   - `scripts/check-module-side-effects.mjs`（缓存 / 启动型调用 / `globalThis` 写入）
 *   - `scripts/check-toplevel-new.mjs`（其余模块级 `new`，存量冻结在基线里）
 *
 * 行级判据实测漏掉 4 成 import 期真会执行的 `new`（`scripts/probe-r2-blindspots.mjs`
 * 的读数：158 处真执行 → 行级只看见 96 处 → 漏 62 处；#614 当时的文档记的是 97 / 61，
 * 已按实测校正）。issue #614 要求把判据换成 AST。
 * 换的时候**两条脚本必须用同一把尺子**——否则"口径不一致"会换个地方重演
 * （这正是 issue #606 与 #614 反复报的同一类问题：两条门禁互相以为对方管了）。
 * 所以这里把「什么算 import 时执行」「哪些文件算应用入口」「基线怎么读」三件事抽成一份实现。
 *
 * ## 判据：顶层代码路径上的节点
 *
 * `new` / 调用 / 赋值只要落在下面四类上下文里，就是 **import 时真的会执行**：
 *
 * | 上下文 | 例子 | 为什么行级判据看不见 |
 * |---|---|---|
 * | `module` | `const x =` 换行后的 `new Map()`、顶层 `if` 块、对象字面量、顶层 IIFE | `new` 所在行有前导空白 |
 * | `static-field` | `private static map = new ChainMap()` | 类体缩进；且类声明在模块顶层时初始化器在 import 时执行 |
 * | `static-block` | `static { foo = new Map(); }` | 同上 |
 * | `module-call-callback` | `[...].forEach(() => new X())`、`new Promise((r) => r(new X()))` | 回调体缩进 |
 *
 * 实例字段（`instance-field`）、类体内其它位置（`class-other`）、函数体（`in-function`）
 * 都**不算**——它们要等 `new` 实例或函数被调用时才执行。
 *
 * ## 保守性（有意为之，不是缺陷）
 *
 * `module-call-callback` 只看「函数表达式被当作参数传给某个调用」，**不判断那个调用是否立即执行回调**。
 * 于是 `document.addEventListener('DOMContentLoaded', () => { const s = new Set(); })` 也会命中——
 * 严格说那不是 import 期执行。判定做不到精确（`addEventListener` 与 `forEach` 在语法上无区别，
 * 要精确就得维护一份"哪个 API 会同步调回调"的名单，那本身就会腐化）。
 * 取向与两条门禁一致：**宁可多报**（去重比漏网好）。真有这类命中，它会作为存量进基线，
 * 不影响门禁的"新增即失败"语义。
 *
 * ## 应用入口（页面入口）：显式清单，两条脚本共用
 *
 * 清单就是下面的 `ENTRY_FILES`——**两条 R2 脚本问的是同一个地方**（issue #614 的"单一事实来源"）。
 *
 * 为什么必须是"共用一份显式清单"：原先只有 `check-module-side-effects.mjs` 有一条 `ENTRY_FILE` 正则，
 * `check-toplevel-new.mjs` 完全没有入口概念——同一个文件在一条脚本里被豁免、在另一条里进基线，
 * 25 个示例入口的 `new GUI(...)` 键就是这样**默默**进了基线（这正是 #614 报的口径不一致）。
 * 现在加/减入口只改 `ENTRY_FILES` 一个地方，两条脚本的读数不可能再分叉。
 *
 * 为什么不做成"扫 html 的 `<script src>`"这种自动推断（`check-examples-imports.mjs` 用的是那种）：
 * 那会把 20 余个**单个示例页**（`packages/webgpu/examples/src/webgpu/` 各页面的 `index.ts`）也算成入口，
 * 它们模块级的 `new GUI(...)` / `new Stats(...)` / `new Float32Array(...)`（实测 25 个键）就从门禁视野里消失。
 * 本清单刻意只收**应用外壳 / 示例集合的入口页**（理由写在各条目上）；取向与两条门禁一致：
 * **宁可多报**（#606："去重比漏网好"）。
 * 要放宽（把单个示例页也豁免）只需往清单里加条目，基线会相应减少——量级见 `docs/CI.md` §2.1。
 *
 * ## 被豁免意味着什么（取舍，issue #614 要求写清）
 *
 * 清单里的文件在 import 时执行代码是**固有语义**（入口不被 tree-shake、也没有"谁 import 它"的问题），
 * 所以两条脚本对它**整类豁免**：模块级 `new`（含缓存形态）、启动型调用、`globalThis` 写入都不报。
 * 这与 `check-module-side-effects.mjs` 原先的 `ENTRY_FILE`（命中即整文件 `return`）行为一致，
 * 换的只是"入口定义在哪、由谁读"。
 *
 * **代价是真的，不是理论**：入口页里的真副作用（issue #56 那类 import 时启动的代码）**不会被拦**。
 * 实测本仓现在有**一处**：`packages/editor/src/vue-app/main.ts:93` 的模块级
 * `setTimeout(async () => {...}, 0)`（推迟主题初始化），它在 import 时启动一个宏任务。
 * 旧判据同样豁免它（该文件本来就在 `ENTRY_FILE` 里），所以本批**没有放松**；
 * 但换成 AST 判据后这类位置**不会被自动发现**，只能靠 code review。
 *
 * **风险边界**：豁免只覆盖 `ENTRY_FILES` 里的文件，**库代码（会被别人 import 的模块）一律不豁免**——
 * "缓存必须 lazy-init / import 时不要启动 / 不要写 `globalThis`" 这三条对库仍然是硬的。
 *
 * **将来若要收紧**，两条路（都要先改**入口文件本身**，不是改判据）：
 *   ① 清单只豁免"模块级 `new`"，启动型调用与 `globalThis` 写入照旧判——需先把入口页的启动行为
 *      改成显式 bootstrap 并有人调用（`vue-app/main.ts` 的 `setTimeout` 就是现成的例子）；
 *   ② 取消豁免、把入口页的存量登记进基线。
 * 为什么这一批不走这两条：入口页的启动行为（`app.mount()`、`installFieldTooltip()`、`setTimeout(init)`）
 * 本身就是"应用启动"的固有语义，判死后只剩"包一层函数"这种假修法（副作用一点没少，判据却看不见了），
 * 而那不叫收紧，叫把问题藏起来。
 *
 * ## 这一层自己的回归保护（issue #652）
 *
 * 本文件是 R2 最复杂、写错时最贵的一层（4 类上下文 + 3 处透明包装剥壳 + 入口豁免 + 基线读取），
 * 而 #614 抽出它时**没有留任何用例**。后果在 #652 里被复现了：把 `effectiveParent` 打回
 * "不剥括号"（一处改动）后，两条 R2 门禁**都 exit 0**，`check-toplevel-new.mjs` 还把消失的键
 * 读成"存量已被清理、可以 `--update` 收紧基线"。现在三层守着：
 *
 *   1. `test/r2ModuleScope.spec.ts`——直接 import 本文件，对每个判据断言正/反例
 *      （**顶层 IIFE 的剥壳**是重点，那正是被改坏的地方）；
 *   2. `check-module-side-effects.mjs` / `check-toplevel-new.mjs` 的脚本内合成样例自检
 *      （各 13 / 12 条，启动时先跑、失败即 exit 1）；
 *   3. {@link checkCacheNameLists}——三份缓存容器名单的集合一致性断言。
 *
 * **②的局限要如实说**：自检与被测判据同文件同进程，判据写错时自检会一起错，
 * 发现不了"两处都错"，只防单点回归。判据形状靠 ①（独立文件、独立进程、断言行为）。
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import ts from 'typescript';

/**
 * 应用入口（页面入口）清单：**两条 R2 脚本共用的唯一入口定义**。
 *
 * 键是**仓库根相对路径**（正斜杠）。值是"为什么它可以在 import 时执行代码"——
 * 写下来是为了下一个人加清单前先读一遍，而不是顺手把报错的文件名贴进来。
 * 反向校验由 {@link missingEntryFiles} 做：文件被删/改名后，过期的登记项会让门禁失败。
 */
const ENTRY_FILES = new Map([
    ['packages/reactivity/examples/index.ts',
        '示例集合的**导航页**：模块级构建重定向表（`const validRedirects = new Map()`），import 即执行是它的职责'],
    ['packages/webgpu/examples/index.ts',
        '示例集合的**导航页**：同上'],
    ['packages/editor/src/vue-app/main.ts',
        '编辑器**应用挂载入口**：挂载 Vue 应用、安装 objectview 组件与内置插件（见 check-editor-module-effects.mjs 的白名单）'],
]);


/** 递归扫描时跳过的目录（与两条门禁原先各自的 SKIP 取并集） */
const SKIP_DIRS = new Set(['node_modules', 'dist', 'lib', 'public', '.git', 'tmp']);

/**
 * 「透明」包装表达式：剥掉它们之后还是同一个表达式。
 *
 * 必要性是**破坏性实验实测出来的**（issue #614）：最常见的 IIFE 写法是
 * `(() => { ... })()`，它在 AST 里是
 * `CallExpression.expression === ParenthesizedExpression(ArrowFunction)`。
 * 只比对 `CallExpression.expression === 函数节点` 会漏掉整类带括号的 IIFE
 * ——`scripts/probe-r2-blindspots.mjs` 最初的 `ctxOf` 就是这个写法，于是"IIFE 盲区"
 * 其实一直没被覆盖（测出来的探针 `__r2-probe-2.ts` 没让门禁失败才发现）。
 */
const TRANSPARENT_WRAPPERS = new Set([
    ts.SyntaxKind.ParenthesizedExpression,
    ts.SyntaxKind.AsExpression,
    ts.SyntaxKind.TypeAssertionExpression,
    ts.SyntaxKind.NonNullExpression,
    ts.SyntaxKind.SatisfiesExpression,
]);

/**
 * 剥掉括号 / 类型断言等透明包装，返回真正的表达式节点。
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
 * 函数节点的**有效父节点**：先向上穿过括号 / 类型断言等透明包装。
 *
 * 与 `unwrapExpression` 是同一件事的两个方向，缺一不可：
 * `(() => { ... })()` 里箭头函数的直接父是 `ParenthesizedExpression`，
 * 再上一层才是 `CallExpression`——不穿透就会把整类带括号 IIFE 判成"函数体内"。
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

/**
 * 「import 时真的会执行」的上下文分类。
 *
 * 集合内容即判据：判断一个节点是否 import 期执行，等价于问
 * `MODULE_LEVEL_CONTEXTS.has(moduleContextOf(node))`。
 */
export const MODULE_LEVEL_CONTEXTS = new Set(['module', 'static-field', 'static-block', 'module-call-callback']);

/** 上下文分类的中文标签（报告与文档用；键与 `moduleContextOf` 的返回值一致） */
export const CONTEXT_LABELS = {
    'module': '模块顶层（多行声明 / 顶层块 / 对象字面量 / IIFE）',
    'static-field': '类 static 字段初始化器',
    'static-block': '类 static 块',
    'module-call-callback': '模块级调用回调（如 [...].forEach(...)）',
    'instance-field': '类实例字段初始化器（new 实例时才执行）',
    'class-other': '类体内其它位置',
    'in-function': '函数体内（含赋给变量的函数）',
};

/**
 * 从节点向上判断它是否真的在 import 时执行，并给出成因分类。
 *
 * 三个关键点：① 直接调用的函数表达式（IIFE）**继续向上看**，不当作"函数体内"；
 * ② 作为回调传给某个调用的函数只在最终落在模块顶层时才算模块级（保守，见文件头）；
 * ③ 类 `static` 字段 / `static` 块算模块级，实例字段不算。
 *
 * @param {import('typescript').Node} node 起始节点（`new` / 调用 / 赋值都行）
 * @returns {string} 上下文分类，取值见 {@link CONTEXT_LABELS}
 */
export function moduleContextOf(node)
{
    let current = node;
    let passedAsCallback = false;

    while (current.parent)
    {
        const parent = current.parent;

        if (ts.isFunctionLike(parent))
        {
            const grand = effectiveParent(parent);

            if (grand && ts.isCallExpression(grand) && unwrapExpression(grand.expression) === parent)
            {
                current = grand;                                 // IIFE（含 `(() => {...})()` 这种带括号的写法）→ 继续向上看
                continue;
            }
            if (grand && ts.isCallExpression(grand) && grand.arguments.some((argument) => unwrapExpression(argument) === parent))
            {
                passedAsCallback = true;                         // 作为回调传给某个调用
                current = grand;
                continue;
            }

            return 'in-function';                                // 函数声明 / 赋给变量的函数
        }
        if (parent.kind === ts.SyntaxKind.ClassStaticBlockDeclaration) return 'static-block';
        if (ts.isPropertyDeclaration(parent) && parent.parent
            && (parent.parent.kind === ts.SyntaxKind.ClassDeclaration || parent.parent.kind === ts.SyntaxKind.ClassExpression))
        {
            return (ts.getCombinedModifierFlags(parent) & ts.ModifierFlags.Static) ? 'static-field' : 'instance-field';
        }
        if (parent.kind === ts.SyntaxKind.ClassDeclaration || parent.kind === ts.SyntaxKind.ClassExpression) return 'class-other';
        if (ts.isSourceFile(parent)) return passedAsCallback ? 'module-call-callback' : 'module';

        current = parent;
    }

    return 'module';
}

/**
 * 节点是否落在「import 时真的会执行」的代码路径上。
 *
 * @param {import('typescript').Node} node 节点
 * @returns {boolean} 是则 true
 */
export function isImportTimeCode(node)
{
    return MODULE_LEVEL_CONTEXTS.has(moduleContextOf(node));
}

/**
 * 递归收集待扫描的 `.ts` 文件（排除 `.spec.ts` 与 `.d.ts`）。
 *
 * 两条门禁原先在"是否跳过 `test` 目录"上不同（`check-module-side-effects` 跳过、
 * `check-toplevel-new` 不跳）；实测两种口径在本仓读数**零差异**（没有模块级 `new` 落在
 * 各包的 `test` 目录下的非 spec `.ts` 里），所以统一为这一份实现，不再各留一个开关——
 * 口径分叉本身就是 issue #606 / #614 反复出问题的地方。
 *
 * @param {string} dir 起始目录（绝对路径）
 * @param {string[]} [out] 累积器
 * @returns {string[]} 文件绝对路径
 */
export function collectTsFiles(dir, out = [])
{
    for (const name of readdirSync(dir))
    {
        if (SKIP_DIRS.has(name)) continue;

        const full = join(dir, name);

        if (statSync(full).isDirectory()) collectTsFiles(full, out);
        else if (name.endsWith('.ts') && !name.endsWith('.spec.ts') && !name.endsWith('.d.ts')) out.push(full);
    }

    return out;
}

/**
 * 节点所在行号（1 起）。
 *
 * @param {import('typescript').SourceFile} sourceFile 源文件
 * @param {import('typescript').Node} node 节点
 * @returns {number} 行号
 */
export function lineOf(sourceFile, node)
{
    return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

/**
 * 统一路径写法（仓库根相对、正斜杠）——基线键与报告都用它，避免 Windows 反斜杠进基线。
 *
 * @param {string} root 仓库根
 * @param {string} file 绝对路径
 * @returns {string} 相对路径
 */
export function toRelative(root, file)
{
    return relative(root, file).split(sep).join('/');
}

/**
 * 构造器名的短名（`new a.b.C()` → `C`）。
 *
 * 存量基线的键里没有一个含点（#614 时的 90 个、本批收紧后的 128 个、rebase 到最新 master 后的 125 个都没有），
 * 所以短名与旧正则捕获的完整名在现状下等价；
 * 取短名是为了让 `new THREE.Vector3()` 与 `new Vector3()` 归入同一模式。
 *
 * @param {string} text 表达式文本
 * @returns {string} 短名
 */
function constructorName(text)
{
    return text.split('.').pop();
}

/**
 * 收集一个文件里**在 import 时执行**的 `new`。
 *
 * @param {import('typescript').SourceFile} sourceFile 源文件
 * @returns {{ line: number, name: string, context: string, argumentCount: number }[]} 命中列表
 */
export function collectModuleLevelNews(sourceFile)
{
    const found = [];
    const visit = (node) =>
    {
        if (ts.isNewExpression(node) && isImportTimeCode(node))
        {
            found.push({
                line: lineOf(sourceFile, node),
                name: constructorName(node.expression.getText(sourceFile)),
                context: moduleContextOf(node),
                argumentCount: node.arguments?.length ?? 0,
            });
        }
        ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return found;
}

/**
 * 收集一个文件里**在 import 时执行**的调用表达式，交给调用方按 callee 名过滤。
 *
 * `isStatement` 标出它是「顶层纯调用语句」（`foo(...)` 单独成句）还是**声明形式**
 * （`export const x = foo()`）——前者是旧判据里的"裸调用语句"，后者不在本判据内
 * （声明形式的模块级构造由 `check-toplevel-new.mjs` 的基线管）。
 *
 * @param {import('typescript').SourceFile} sourceFile 源文件
 * @param {(callee: string) => boolean} matches callee 名（源码文本，如 `setInterval`）的判定
 * @returns {{ line: number, callee: string, isStatement: boolean }[]} 命中列表
 */
export function collectModuleLevelCalls(sourceFile, matches)
{
    const found = [];
    const visit = (node) =>
    {
        if (ts.isCallExpression(node) && isImportTimeCode(node))
        {
            const callee = node.expression.getText(sourceFile);

            if (matches(callee)) found.push({ line: lineOf(sourceFile, node), callee, isStatement: ts.isExpressionStatement(node.parent) });
        }
        ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return found;
}

/**
 * 收集一个文件里**在 import 时执行**的 `globalThis.xxx = ...` 写入。
 *
 * @param {import('typescript').SourceFile} sourceFile 源文件
 * @returns {{ line: number, text: string }[]} 命中列表
 */
export function collectModuleLevelGlobalThisWrites(sourceFile)
{
    const found = [];
    const visit = (node) =>
    {
        if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && isImportTimeCode(node))
        {
            const left = node.left.getText(sourceFile);

            if (/^globalThis\s*\./.test(left)) found.push({ line: lineOf(sourceFile, node), text: left });
        }
        ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return found;
}

/**
 * 某个仓库根相对路径是否是应用入口（页面入口）。
 *
 * @param {string} rel 相对路径（正斜杠）
 * @returns {boolean} 是则 true
 */
export function isEntryFile(rel)
{
    return ENTRY_FILES.has(rel);
}

/**
 * 入口清单的只读视图（报告用：把"豁免了谁"打在输出里，避免豁免变成看不见的特权）。
 *
 * @returns {{ rel: string, reason: string }[]} 清单条目
 */
export function entryFileList()
{
    return [...ENTRY_FILES].map(([rel, reason]) => ({ rel, reason }));
}

/**
 * 反向校验入口清单：登记项必须**真实存在**。
 *
 * 清单是"合法豁免点"的显式登记，文件被删 / 改名后过期条目不该静默留着
 * （与 `scripts/check-editor-module-effects.mjs` 的白名单反向校验同一取向）。
 * 反过来，**清单漏登记**不会静默：新入口的文件不豁免 → 门禁报错 → 人会发现并来登记。
 * 两个方向都朝安全侧倒。
 *
 * @param {string} root 仓库根
 * @returns {string[]} 不存在的登记项
 */
export function missingEntryFiles(root)
{
    return [...ENTRY_FILES.keys()].filter((rel) => !existsSync(join(root, rel)));
}

/**
 * 读取模块级 `new` 的存量基线（`scripts/toplevel-new-baseline.json`）。
 *
 * 两条脚本读**同一份**基线：`check-module-side-effects.mjs` 用它把已实测的存量缓存
 * （issue #614 实测 12 处空参缓存；本批清掉 9 处 / 7 个键后剩 3 处）放行，只对基线外的新增失败；
 * `check-toplevel-new.mjs` 用它做"存量冻结、新增即失败"。
 *
 * @param {string} root 仓库根
 * @returns {Set<string>} 基线键（「相对路径::构造器短名」）
 */
export function readBaseline(root)
{
    const file = join(root, 'scripts', 'toplevel-new-baseline.json');

    return new Set(JSON.parse(readFileSync(file, 'utf8')).entries);
}

/**
 * 基线键的构造（单一来源，避免两条脚本各拼一次字符串拼出不同格式）。
 *
 * 键刻意**不含行号**：行号会随无关改动漂移，导致门禁频繁误报。
 *
 * @param {string} rel 相对路径
 * @param {string} name 构造器短名
 * @returns {string} 基线键
 */
export function baselineKey(rel, name)
{
    return `${rel}::${name}`;
}

/* ------------------------------------------------------------------------- *
 * 名单一致性判据（做法 5，issue #652）
 * ------------------------------------------------------------------------- */

/**
 * R2 的「缓存容器候选名单」在本仓存在**四份**（issue #652 实测 5）：
 *
 * | 位置 | 形态 | 本判据是否比对 |
 * |---|---|---|
 * | `scripts/check-module-side-effects.mjs` 的 `CACHE_NAMES` / `PROJECT_CACHE_NAMES` | `Set` | **基准**（由调用方传入） |
 * | `packages/eslint-plugin-feng3d/src/rules/no-module-side-effect.ts` 的 `CACHE_CONSTRUCTORS` | 数组字面量 | ✅ |
 * | `scripts/check-editor-module-effects.mjs` 的 `MUTABLE_MODULE_CACHE` | 正则的候选组 | ✅ |
 * | `scripts/probe-r2-blindspots.mjs` 的 `CACHE_RE` | 正则 | ❌ **刻意排除** |
 *
 * 最后一份**刻意不比对**：探针文件头写着它要"冻结历史读数"——它的名字集合必须停在
 * 与历史报告可比的那一刻，跟着门禁一起改会让"上一批 / 这一批"的读数不可比。
 *
 * **为什么必须机器断言**：#606 / #647 反复踩的就是这条——名单各写一份、靠人手工同步，
 * 漏改一处只表现为"某个新写法没人拦"，而门禁照样绿（`ChainMap` 那次是手工同步三处的，
 * `WeakSet` 那次就漏了规则层）。断言把"名单漂移"从"靠人读代码 + 破坏性实验"变成 exit 1。
 *
 * **为什么是"集合相等"而不是"脚本侧是超集"**：两个方向都有实际失效模式——
 * ① 脚本侧有、规则侧没有（`WeakSet` 的真实历史）：规则层漏报，属安全的漏；
 * ② 规则侧有、脚本侧没有：CI 门禁漏报而 lint 报，开发者在编辑器里被一条**门禁不认**的规则
 *    拦住，比漏报更难诊断。既然本批已经把 `WeakSet` 补齐（规则侧当初是**漏了**、不是有意：
 *    见 `f71a074ae` 的提交信息"判据漏了名字，不是策略有意放过"），两份就该严格相等，
 *    多出的差集一律当配置错处理。**允许的差集只剩"形态"**（规则层 `isModuleScope` 不覆盖
 *    类字段 / IIFE、脚本层对项目自有容器不套空参限制），那是判据能力差异，不是名单差异。
 */

/** 对侧名单所在的源文件（仓库根相对路径） */
export const PEER_CACHE_LIST_FILES = {
    rule: 'packages/eslint-plugin-feng3d/src/rules/no-module-side-effect.ts',
    editor: 'scripts/check-editor-module-effects.mjs',
};

/**
 * 从自研规则源码文本里解出 `CACHE_CONSTRUCTORS` 的名单。
 *
 * **解不出来返回 `null`**，不是"空名单"：解析失败必须让调用方失败，否则"正则突然匹配不上"
 * 会退化成"两份空名单相等"而静默通过（这正是本批要防的那类失效）。
 *
 * @param {string} source `no-module-side-effect.ts` 的源码文本
 * @returns {string[] | null} 构造器名；解析不出为 null
 */
export function extractRuleCacheConstructors(source)
{
    const declaration = /CACHE_CONSTRUCTORS\s*=\s*\[([^\]]*)\]/.exec(source);

    if (!declaration) return null;

    const names = [...declaration[1].matchAll(/'([A-Za-z_$][\w$]*)'/g)].map((match) => match[1]);

    return names.length > 0 ? names : null;
}

/**
 * 从 `check-editor-module-effects.mjs` 源码文本里解出 `MUTABLE_MODULE_CACHE` 正则的候选名。
 *
 * 该名单在那边是正则的**第一个捕获组**（`(Map|WeakMap|Set|WeakSet|ChainMap)`），
 * 取到 `;` 为止的一段即可——正则字面量里不含分号。要求组里至少有 `|`（≥2 个候选），
 * 免得匹配到正则里别的括号（如 `[^(]`）而读出错误答案。
 *
 * @param {string} source `check-editor-module-effects.mjs` 的源码文本
 * @returns {string[] | null} 构造器名；解析不出为 null
 */
export function extractEditorCacheNames(source)
{
    const start = source.indexOf('MUTABLE_MODULE_CACHE');

    if (start < 0) return null;

    const semicolon = source.indexOf(';', start);
    const declaration = source.slice(start, semicolon < 0 ? source.length : semicolon);
    const group = /\(([A-Za-z_$][\w$|]*)\)/.exec(declaration);

    if (!group || !group[1].includes('|')) return null;

    const names = group[1].split('|').filter(Boolean);

    return names.length > 0 ? names : null;
}

/**
 * 比对一份对侧名单与脚本侧名单，返回人类的差异描述（空数组 = 一致）。
 *
 * @param {Iterable<string>} scriptNames 脚本侧名单（`CACHE_NAMES` + `PROJECT_CACHE_NAMES`）
 * @param {string[] | null} peerNames 对侧名单；`null` 表示解不出来
 * @returns {string[]} 差异描述
 */
export function diffCacheNameLists(scriptNames, peerNames)
{
    const script = [...scriptNames].sort();

    if (peerNames === null)
    {
        return ['名单解不出来（源文件缺失，或写法变了让解析失效）——判据已失效，先修解析再谈一致性'];
    }

    const peer = [...peerNames].sort();
    const missing = script.filter((name) => !peer.includes(name));
    const extra = peer.filter((name) => !script.includes(name));

    if (missing.length === 0 && extra.length === 0) return [];

    return [
        `脚本侧有而对侧没有：${missing.length > 0 ? missing.join('、') : '（无）'}`,
        `对侧有而脚本侧没有：${extra.length > 0 ? extra.join('、') : '（无）'}`,
        `脚本侧 [${script.join('、')}] vs 对侧 [${peer.join('、')}]`,
    ];
}

/**
 * 名单一致性断言：脚本侧名单必须与两份对侧名单**集合相等**。
 *
 * 由 `scripts/check-module-side-effects.mjs` 在启动时调用（不一致即 exit 1），
 * 也被 `test/r2ModuleScope.spec.ts` 直接调用——这样"名单漂移"既进 CI 的脚本步骤、
 * 也进单元测试，不必等有人想起去读代码。
 *
 * @param {string} root 仓库根
 * @param {Iterable<string>} scriptNames 脚本侧名单（内置 + 项目自有）
 * @returns {{ ok: boolean, problems: string[], peers: Record<string, string[] | null> }} 断言结果
 */
export function checkCacheNameLists(root, scriptNames)
{
    const problems = [];
    const peers = {};

    for (const [key, rel] of Object.entries(PEER_CACHE_LIST_FILES))
    {
        const file = join(root, rel);
        const source = existsSync(file) ? readFileSync(file, 'utf8') : null;
        const names = source === null ? null
            : (key === 'rule' ? extractRuleCacheConstructors(source) : extractEditorCacheNames(source));

        peers[key] = names;

        for (const problem of diffCacheNameLists(scriptNames, names)) problems.push(`${rel}：${problem}`);
    }

    return { ok: problems.length === 0, problems, peers };
}
