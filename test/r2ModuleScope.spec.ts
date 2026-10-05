import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
    CONTEXT_LABELS,
    MODULE_LEVEL_CONTEXTS,
    baselineKey,
    checkCacheNameLists,
    collectModuleLevelCalls,
    collectModuleLevelGlobalThisWrites,
    collectModuleLevelNews,
    collectTsFiles,
    diffCacheNameLists,
    entryFileList,
    extractEditorCacheNames,
    extractRuleCacheConstructors,
    isEntryFile,
    isImportTimeCode,
    missingEntryFiles,
    moduleContextOf,
    readBaseline,
    toRelative,
} from '../scripts/r2-module-scope.mjs';

/**
 * R2 判据层（`scripts/r2-module-scope.mjs`）的回归测试（issue #652 做法 1）。
 *
 * ## 为什么这份测试值得单独存在
 *
 * 这一层是 R2 四条门禁（lint 规则 + 两条 CI 脚本 + 产物级脚本里的两条）的共用判据，
 * 也是 R2 最复杂的一层：4 类模块级上下文 + 3 处透明包装剥壳 + 入口豁免 + 基线读取。
 * #614 把它抽出来时**没有留任何用例**，于是它的正确性只能靠"在真仓库上跑一遍 exit 0"
 * ——而判据漏判时真仓库当然也是 exit 0。
 *
 * #652 用一个可复现的破坏性实验证明了这个后果：把本文件的 `effectiveParent`（剥括号那处）
 * 打回"不剥括号"（**一处改动**），两条 R2 门禁**都 exit 0**，`check-toplevel-new.mjs`
 * 还把因此消失的键读成"有 1 个存量已被清理，可以跑 `--update` 收紧基线"——
 * **判据 bug 被伪装成存量清理**，照做会把欠账永久移出门禁视野。
 *
 * 所以本文件按 `packages/editor/test/bridgeSecurity.spec.ts:15` 的取向写：
 * **每个上下文至少一对正/反例**，"正常情况能过"单独存在时，把整条判据删掉也照样绿。
 *
 * 断言的是**行为**（这个 `new` 算不算 import 时执行、算哪一类），不是实现细节
 * （不看内部字段、不按行号定位节点、不断言私有函数）。
 */
function parse(code: string): ts.SourceFile
{
    // 第 4 个参数必须为 true：判据要向上走 `node.parent`，不设 parent 的话全是错觉
    return ts.createSourceFile('probe.ts', code, ts.ScriptTarget.Latest, true);
}

/** 取源码里第 `index`（0 起）个 `new` 表达式——用遍历定位，避免测试依赖缩进/换行 */
function newExpressionAt(file: ts.SourceFile, index: number): ts.NewExpression
{
    const found: ts.NewExpression[] = [];
    const visit = (node: ts.Node): void =>
    {
        if (ts.isNewExpression(node)) found.push(node);
        ts.forEachChild(node, visit);
    };

    visit(file);

    const hit = found[index];

    if (!hit) throw new Error(`源码里第 ${index} 个 new 表达式不存在（一共 ${found.length} 个）`);

    return hit;
}

/** 某个 `new` 的上下文分类 */
function contextOf(code: string, index = 0): string
{
    return moduleContextOf(newExpressionAt(parse(code), index));
}

/** 某个 `new` 是否落在 import 时执行的代码路径上 */
function importTimeOf(code: string, index = 0): boolean
{
    return isImportTimeCode(newExpressionAt(parse(code), index));
}

/**
 * 当前的临时合成仓库根（由 `withTempRoot` 设置；只在该函数的同步回调里有意义）。
 *
 * 为什么不做成给回调传参：`test/` 下的 `.ts` 上 core `no-unused-vars` 是**开着**的
 * （`eslint.config.js` 里 `files: ['scripts/…mjs', 'test/…ts']` 那个块），而它不认
 * TS 函数类型里的参数名——`function withTempRoot(run: (root: string) => void)` 里的 `root`
 * 会被报成"定义未使用"。回调不带参数就不存在这个坑。
 */
let tempRootPath = '';

/** 建一个临时目录当「合成仓库根」，跑完 `body` 后删掉 */
function withTempRoot(body: () => void): void
{
    tempRootPath = mkdtempSync(join(tmpdir(), 'r2-scope-'));

    try
    {
        body();
    }
    finally
    {
        rmSync(tempRootPath, { recursive: true, force: true });
        tempRootPath = '';
    }
}

const ROOT = process.cwd();

describe('R2 判据层：四类模块级上下文都算 import 时执行', () =>
{
    it('模块顶层（多行声明）：`const x =` 换行后的 `new Map()` 有前导空白，仍算模块级', () =>
    {
        const code = 'export const cache =\n    new Map<string, number>();';

        expect(contextOf(code)).toBe('module');
        expect(importTimeOf(code)).toBe(true);
    });

    it('模块顶层（缩进的顶层 `if` 块）：块里的 `new Set()` 算模块级', () =>
    {
        const code = 'if (globalThis.__flag)\n{\n    const s = new Set<string>();\n}';

        expect(contextOf(code)).toBe('module');
    });

    it('模块顶层（对象字面量）：字面量里的 `new Set()` 算模块级', () =>
    {
        const code = 'const registry = { entries: new Set<string>() };';

        expect(contextOf(code)).toBe('module');
    });

    it('类 `static` 字段初始化器：类声明在模块顶层时，初始化器在 import 时执行', () =>
    {
        const code = 'class A\n{\n    private static cache = new Map<string, number>();\n}';

        expect(contextOf(code)).toBe('static-field');
        expect(importTimeOf(code)).toBe(true);
    });

    it('类 `static` 块：块体在 import 时执行', () =>
    {
        const code = 'class A\n{\n    static\n    {\n        A.cache = new Map<string, number>();\n    }\n}';

        expect(contextOf(code)).toBe('static-block');
        expect(importTimeOf(code)).toBe(true);
    });

    it('模块级调用回调：`[...].forEach(() => new X())` 的回调体算模块级', () =>
    {
        const code = '[1, 2].forEach(() => { const s = new Set<string>(); });';

        expect(contextOf(code)).toBe('module-call-callback');
        expect(importTimeOf(code)).toBe(true);
    });

    it('四类上下文都在 `MODULE_LEVEL_CONTEXTS` 里（判据集合与分类名是一件事）', () =>
    {
        expect([...MODULE_LEVEL_CONTEXTS].sort()).toEqual(
            ['module', 'module-call-callback', 'static-block', 'static-field'],
        );
    });

    it('每个分类都有中文标签（报告里不许打出 [undefined]）', () =>
    {
        for (const context of [...MODULE_LEVEL_CONTEXTS, 'instance-field', 'class-other', 'in-function'])
        {
            expect(CONTEXT_LABELS[context as keyof typeof CONTEXT_LABELS]).toBeTruthy();
        }
    });
});

describe('R2 判据层：顶层 IIFE 必须被认成模块级（#652 破坏性实验改坏的就是这处）', () =>
{
    it('不带括号的 IIFE：`(function () {...})()` → 模块级', () =>
    {
        const code = 'const c = function ()\n{\n    return new Map<string, number>();\n}();';

        expect(contextOf(code)).toBe('module');
    });

    it('★ 带括号的箭头 IIFE：`(() => {...})()` 在 AST 里隔着 `ParenthesizedExpression`，仍须算模块级', () =>
    {
        // 这一条就是 #652 实测 6 的探针形态：判据"不剥括号"时它会被判成"函数体内"，
        // 于是带括号的 IIFE 整类静默漏网（真实实例：EditorBridge.ts 的
        // `const BRIDGE_CLIENT_ID = (() => {...})()`，import 时真的读 `location`）。
        const code = 'const c = (() =>\n{\n    const m = new Map<string, number>();\n    return m;\n})();';

        expect(contextOf(code)).toBe('module');
        expect(importTimeOf(code)).toBe(true);
    });

    it('★ 带括号的函数表达式 IIFE：`(function () {...})()` → 模块级', () =>
    {
        const code = 'const c = (function ()\n{\n    return new Map<string, number>();\n})();';

        expect(contextOf(code)).toBe('module');
    });

    it('★ 类型断言包着的 IIFE：`((() => {...}) as F)()` → 模块级（`AsExpression` 也是透明包装）', () =>
    {
        const code = 'const c = ((() => { const m = new Map<string, number>(); return m; }) as () => Map<string, number>)();';

        expect(contextOf(code)).toBe('module');
    });

    it('反例：函数表达式**赋给变量**（不是立即调用）→ 函数体内', () =>
    {
        const code = 'const make = function () { return new Map<string, number>(); };\nmake();';

        expect(contextOf(code)).toBe('in-function');
        expect(importTimeOf(code)).toBe(false);
    });

    it('反例：函数体内的 IIFE 仍是函数体内（IIFE 不"继承"模块级）', () =>
    {
        const code = 'export function outer() { return (() => new Map<string, number>())(); }';

        expect(contextOf(code)).toBe('in-function');
    });

    it('反例：模块级 IIFE 里**再套**一个函数 → 那层函数体内（import 时不会执行到）', () =>
    {
        const code = 'const c = (() => { const make = () => new Map<string, number>(); return make; })();';

        expect(contextOf(code)).toBe('in-function');
    });
});

describe('R2 判据层：不算模块级的形态（反例，防误报）', () =>
{
    it('函数声明体内 → `in-function`', () =>
    {
        const code = 'export function build() { return new Map<string, number>(); }';

        expect(contextOf(code)).toBe('in-function');
        expect(importTimeOf(code)).toBe(false);
    });

    it('赋给变量的箭头函数体内 → `in-function`', () =>
    {
        const code = 'const build = () => new Map<string, number>();';

        expect(contextOf(code)).toBe('in-function');
    });

    it('类实例字段初始化器 → `instance-field`（new 实例时才执行）', () =>
    {
        const code = 'class A\n{\n    private cache = new Map<string, number>();\n}';

        expect(contextOf(code)).toBe('instance-field');
        expect(importTimeOf(code)).toBe(false);
    });

    it('类方法体内 → `in-function`（不是 static 字段）', () =>
    {
        const code = 'class A\n{\n    static getCache() { return new Map<string, number>(); }\n}';

        expect(contextOf(code)).toBe('in-function');
    });

    it('函数体内调用回调里的 new → `in-function`（回调在函数里，import 时不执行）', () =>
    {
        const code = 'export function build() { [1].forEach(() => { const s = new Set<string>(); }); }';

        expect(contextOf(code)).toBe('in-function');
    });
});

describe('R2 判据层：收集口径（`collectModuleLevelNews` / calls / globalThis）', () =>
{
    it('一次收集出全部模块级 `new`，带上成因分类与行号；函数体与实例字段不进结果', () =>
    {
        const code = [
            'export const a =',
            '    new Map<string, number>();',
            'class A',
            '{',
            '    private static cache = new Set<string>();',
            '    private instanceCache = new WeakMap<object, object>();',
            '}',
            'export function build() { return new WeakSet<object>(); }',
            'const c = (() => new ChainMap<[object], string>())();',
        ].join('\n');

        const hits = collectModuleLevelNews(parse(code));

        expect(hits.map((hit) => `${hit.name}/${hit.context}@${hit.line}`)).toEqual([
            'Map/module@2',
            'Set/static-field@5',
            'ChainMap/module@9',
        ]);
    });

    it('实参个数被记下来（`new Set([...])` 是只读常量集合、`new Set()` 才是缓存，靠它区分）', () =>
    {
        const hits = collectModuleLevelNews(parse("export const s = new Set(['a', 'b']);\nconst t = new Set<string>();"));

        expect(hits.map((hit) => `${hit.name}:${hit.argumentCount}`)).toEqual(['Set:1', 'Set:0']);
    });

    it('顶层**裸调用语句**与声明形式的调用都收，靠 `isStatement` 区分（两条门禁的判据不同）', () =>
    {
        const code = [
            "registerLogic('A', A);",
            "export const B = registerLogic('B', null);",
            'export function boot() { setTimeout(() => {}, 0); }',
        ].join('\n');

        const hits = collectModuleLevelCalls(parse(code), () => true);

        expect(hits.map((hit) => `${hit.callee}/${hit.isStatement}@${hit.line}`)).toEqual([
            'registerLogic/true@1',
            'registerLogic/false@2',
        ]);
    });

    it('启动型调用只在模块级被收（函数体内的 `setTimeout` 是允许的显式启动）', () =>
    {
        const code = 'setTimeout(() => {}, 0);\nexport function boot() { setTimeout(() => {}, 0); }';
        const hits = collectModuleLevelCalls(parse(code), (callee) => callee === 'setTimeout');

        expect(hits.map((hit) => hit.line)).toEqual([1]);
    });

    it('`globalThis` 写入只在模块级被收（函数体内的写入是允许的显式安装）', () =>
    {
        const code = [
            'globalThis.__feng3d = {};',
            'export function install() { globalThis.__other = 1; }',
            'const o = {};',
            'o.other = 1;',
        ].join('\n');

        expect(collectModuleLevelGlobalThisWrites(parse(code)).map((hit) => hit.text)).toEqual(['globalThis.__feng3d']);
    });
});

describe('R2 判据层：应用入口清单（`ENTRY_FILES`，两条门禁共用）', () =>
{
    it('登记项必须真实存在——过期登记会让门禁失败（清单是唯一事实来源）', () =>
    {
        expect(missingEntryFiles(ROOT)).toEqual([]);
    });

    it('清单里的文件被认成入口（含编辑器挂载入口）', () =>
    {
        expect(isEntryFile('packages/editor/src/vue-app/main.ts')).toBe(true);
        expect(entryFileList().length).toBeGreaterThan(0);
    });

    it('每个登记项都写了"为什么它可以 import 即执行"的理由（不许只贴文件名）', () =>
    {
        for (const entry of entryFileList())
        {
            expect(entry.rel).toMatch(/^packages\//);
            expect(entry.reason.length).toBeGreaterThan(10);
        }
    });

    it('**未登记**的新入口不豁免（朝安全侧倒：门禁报错 → 人来登记，而不是静默放行）', () =>
    {
        expect(isEntryFile('packages/webgpu/examples/src/webgpu/hello/index.ts')).toBe(false);
        expect(isEntryFile('packages/editor/src/vue-app/other.ts')).toBe(false);
    });

    it('清单登记的文件被删 / 改名后，`missingEntryFiles` 会全部报出（合成根目录）', () =>
    {
        withTempRoot(() =>
        {
            expect(missingEntryFiles(tempRootPath)).toEqual(entryFileList().map((entry) => entry.rel));
        });
    });
});

describe('R2 判据层：基线读取与文件扫描口径', () =>
{
    it('`readBaseline` 读出的键与 `scripts/toplevel-new-baseline.json` 内容一致（数字不写死）', () =>
    {
        const raw = JSON.parse(readFileSync(join(ROOT, 'scripts', 'toplevel-new-baseline.json'), 'utf8'));
        const baseline = readBaseline(ROOT);

        expect(baseline.size).toBe(raw.entries.length);
        expect(baseline.size).toBeGreaterThan(0);
    });

    it('基线键的形状是「仓库根相对路径::构造器短名」（不含行号——行号会随无关改动漂移）', () =>
    {
        expect(baselineKey('packages/a/b.ts', 'Map')).toBe('packages/a/b.ts::Map');

        for (const key of readBaseline(ROOT))
        {
            expect(key).toMatch(/^packages\/.+::[A-Za-z_$][\w$]*$/);
        }
    });

    it('基线文件缺失时抛错（`check-toplevel-new.mjs` 靠它给出"先跑一次 --update"的可操作提示）', () =>
    {
        withTempRoot(() =>
        {
            expect(() => readBaseline(tempRootPath)).toThrow();
        });
    });

    it('扫描口径：跳过 `node_modules` 等目录，且**不含** `.spec.ts` / `.d.ts`（合成目录）', () =>
    {
        withTempRoot(() =>
        {
            const root = tempRootPath;

            writeFileSync(join(root, 'a.ts'), 'export const a = 1;\n', 'utf8');
            writeFileSync(join(root, 'a.spec.ts'), 'export const specCache = new Map();\n', 'utf8');
            writeFileSync(join(root, 'b.d.ts'), 'export declare const b: number;\n', 'utf8');
            mkdirSync(join(root, 'sub'));
            writeFileSync(join(root, 'sub', 'c.ts'), 'export const c = 1;\n', 'utf8');
            mkdirSync(join(root, 'node_modules'));
            writeFileSync(join(root, 'node_modules', 'd.ts'), 'export const d = 1;\n', 'utf8');

            const found = collectTsFiles(root).map((file) => toRelative(root, file)).sort();

            expect(found).toEqual(['a.ts', 'sub/c.ts']);
        });
    });

    it('反例：`.spec.ts` 里模块顶层的 `new Map()` 不会被扫描到（测试文件不在门禁范围内）', () =>
    {
        withTempRoot(() =>
        {
            const root = tempRootPath;

            writeFileSync(join(root, 'x.spec.ts'), 'const cache = new Map<string, number>();\n', 'utf8');

            expect(collectTsFiles(root)).toEqual([]);
        });
    });

    it('`toRelative` 统一成正斜杠（Windows 反斜杠不许进基线键）', () =>
    {
        expect(toRelative(join('root', 'pkg'), join('root', 'pkg', 'src', 'a.ts'))).toBe('src/a.ts');
    });
});

describe('R2 名单一致性（issue #652 做法 5：名单漂移必须 exit 1，不能靠人记）', () =>
{
    /**
     * 规范冻结的期望名单。
     *
     * 这不是"第 5 份实现"：它是**期望值**——脚本侧、自研规则、编辑器侧三份实现必须同时等于它，
     * 任何名字改动都要四处一起改，遗漏一处就会在这里红（这正是 #606 / #647 缺的那道门）。
     */
    const EXPECTED_CACHE_NAMES = ['Map', 'WeakMap', 'Set', 'WeakSet', 'ChainMap'];

    it('真实仓库里三份名单集合相等（脚本侧 = 自研规则 = 编辑器侧）', () =>
    {
        const result = checkCacheNameLists(ROOT, EXPECTED_CACHE_NAMES);

        expect(result.problems).toEqual([]);
        expect(result.ok).toBe(true);
        // 两侧都**解析成功**（解析失败会返回 null，那会被 diff 报成"解不出来"，而不是静默通过）
        expect(result.peers.rule).not.toBeNull();
        expect(result.peers.editor).not.toBeNull();
    });

    it('自研规则的名单含 `WeakSet`（#652 修掉的那处漂移，防它被改回去）', () =>
    {
        const source = readFileSync(join(ROOT, 'packages/eslint-plugin-feng3d/src/rules/no-module-side-effect.ts'), 'utf8');

        expect(extractRuleCacheConstructors(source)).toContain('WeakSet');
    });

    it('编辑器侧名单也从正则里解出来，并且含 `WeakSet`', () =>
    {
        const source = readFileSync(join(ROOT, 'scripts/check-editor-module-effects.mjs'), 'utf8');

        expect(extractEditorCacheNames(source)).toContain('WeakSet');
    });

    it('两侧名单少一个名字就会被报出来（合成名单：规则侧漏 `WeakSet`、多出 `Foo`）', () =>
    {
        const problems = diffCacheNameLists(['Map', 'WeakSet'], ['Map', 'Foo']);

        expect(problems).toHaveLength(3);
        expect(problems[0]).toContain('WeakSet');
        expect(problems[1]).toContain('Foo');
        expect(problems[2]).toContain('脚本侧');
        expect(problems[2]).toContain('对侧');
    });

    it('名单一致时没有任何差异描述', () =>
    {
        expect(diffCacheNameLists(['Map', 'Set'], ['Set', 'Map'])).toEqual([]);
    });

    it('解不出名单时明确报"解不出来"，**不**退化成"两份空名单相等"而静默通过', () =>
    {
        expect(diffCacheNameLists(['Map'], null)).toEqual([
            '名单解不出来（源文件缺失，或写法变了让解析失效）——判据已失效，先修解析再谈一致性',
        ]);
    });

    it('从规则源码里解析 `CACHE_CONSTRUCTORS`（合成源码）', () =>
    {
        expect(extractRuleCacheConstructors("const CACHE_CONSTRUCTORS = ['Map', 'ChainMap'];"))
            .toEqual(['Map', 'ChainMap']);
    });

    it('规则源码里找不到 / 写成空名单时返回 null（不能当成"空名单"）', () =>
    {
        expect(extractRuleCacheConstructors('const OTHER = 1;')).toBeNull();
        expect(extractRuleCacheConstructors('const CACHE_CONSTRUCTORS = [];')).toBeNull();
    });

    it('从编辑器侧正则里解析候选名（合成源码），解析不出时返回 null', () =>
    {
        const source = 'const MUTABLE_MODULE_CACHE = /^new\\s+(Map|WeakSet)\\b[^(]*\\(\\s*\\)$/;\n';

        expect(extractEditorCacheNames(source)).toEqual(['Map', 'WeakSet']);
        expect(extractEditorCacheNames('const X = 1;')).toBeNull();
        expect(extractEditorCacheNames('const MUTABLE_MODULE_CACHE = /^new\\s+(Map)\\b$/;')).toBeNull();
    });

    it('源文件缺失时也报"解不出来"（合成根目录）', () =>
    {
        withTempRoot(() =>
        {
            const result = checkCacheNameLists(tempRootPath, ['Map']);

            expect(result.ok).toBe(false);
            expect(result.peers.rule).toBeNull();
            expect(result.peers.editor).toBeNull();
            expect(result.problems.length).toBe(2);
        });
    });
});
