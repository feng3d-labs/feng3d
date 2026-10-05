/**
 * R2：零模块级副作用（运行时侧，issue #88；判据 AST 化见 issue #614）。
 *
 * 模块在 import 时执行代码，会让缓存无法按需分配、副作用无法关闭、tree-shaking 也判断不了
 * 模块能否整体消除。本脚本守三类：
 *
 *   1. **缓存创建**：模块级 `= new Map() / new WeakMap() / new Set() / new WeakSet() / new ChainMap()`。
 *      内置的四个容器要求**空参或只有泛型实参**（泛型实参不影响判定，`new WeakSet<Components>()` 同样拦下
 *      ——issue #606）；带字面量参数的 `new Set([...])` 是只读常量集合、不是按需缓存——只统计，不报错。
 *      项目自有的 `ChainMap` 与它们**分开登记、且不套用空参限制**（理由见下面
 *      `CACHE_NAMES` / `PROJECT_CACHE_NAMES` 的注释）。
 *   2. **启动型调用**：定时器 / rAF / ticker 启动（`setInterval` / `setTimeout` /
 *      `requestAnimationFrame` / `runTickerFuncs` / `startTicker`）。
 *   3. **`globalThis` 写入**。
 *
 * ## 判据为什么是 AST（issue #614）
 *
 * 原判据是**行级**的（「行首无空白 = 模块顶层」+ 单行正则）。实测（`scripts/probe-r2-blindspots.mjs`）
 * `packages/` 下真正在 import 时执行的 `new` 有 **158 处**，两条行级脚本合计只看见 **96 处**，
 * 漏 **62 处**——四类盲区（类 `static` 字段 / `static` 块、顶层 IIFE、多行声明、
 * 模块级块 / 对象字面量 / 回调）全部由缩进造成
 * （数字口径：`probe-r2-blindspots.mjs` 头注释的对照表；#614 当时的文档记的是 97 / 61，
 * 已按实测校正为 96 / 62，见 `docs/CI.md` §2.1 的「数字校正」）。现在判据是「**顶层代码路径上的节点**」，
 * 实现与两条脚本的共用层在 `scripts/r2-module-scope.mjs`（先例：`scripts/check-editor-module-effects.mjs`）。
 *
 * ## 门禁自身的回归保护（issue #652）
 *
 * 本脚本的三类判据此前**既无单测也无任何自检**——"判据写错时 CI 一路全绿"不是假设，
 * #652 用一个可复现的破坏性实验证明了（把共用层 `effectiveParent` 的剥括号改掉 →
 * 两条 R2 门禁**都 exit 0**，而且 `check-toplevel-new.mjs` 把它读成
 * "有 1 个存量已被清理，可以跑 `--update` 收紧基线"）。所以本批加了两层：
 *
 *   1. **判据层单测**：`test/r2ModuleScope.spec.ts` 直接 import `scripts/r2-module-scope.mjs`，
 *      对 4 类上下文 + 顶层 IIFE 剥壳 + 入口豁免 + 基线读取逐个断言（含反例）；
 *   2. **脚本内联合成样例自检**（本文件末尾的 `SELF_CHECKS`）：把合成片段喂给判据，
 *      断言"该报的报、不该报的不报"，**启动时先跑、失败即 exit 1**。
 *
 * ⚠️ **做法 2 的局限（必须如实说明，别把它当成万能）**：`SELF_CHECKS` 与被测判据
 * **同文件同进程**，判据写错时自检会**一起错**——它发现不了"两处都错"
 * （判据与自检共享同一个错误理解，例如都以为"不剥括号"才是对的）。
 * 它防的是**单点回归**（改判据时手滑、名单漂移），判据形状本身靠上面那份单测守。
 *
 * 名单漂移另有一道机器断言：启动时比对脚本侧 `CACHE_NAMES` / `PROJECT_CACHE_NAMES` 与
 * 自研规则 `CACHE_CONSTRUCTORS`、`check-editor-module-effects.mjs` 的 `MUTABLE_MODULE_CACHE`
 * （`checkCacheNameLists`，issue #652 做法 5；探针那份刻意冻结历史读数、**不比对**）。
 *
 * 最直接的两个例子：`packages/feng3d/src/textures/createTexture.ts` 模块级 `if` 块里 7 处
 * `new ImageUtil`（`docs/CI.md` §1.1 自己就写着"`ImageUtil` 在模块加载期构造占位默认纹理"），
 * 以及 `packages/webgpu/src/caches/*` 里 30 处 `static map = new ChainMap()`——换 AST 判据时
 * 这两批都是"原先门禁看不见"的盲区（后者还叠着"`ChainMap` 是项目自有容器、不在候选名单里"）。
 * 那 30 处已全部 lazy-init（基线键 −29）；**候选名单随后补上了 `ChainMap`**，
 * 所以现在再写 `static map = new ChainMap()` 会直接失败（存量已清零，扩名单不产生基线变动）。
 *
 * ## 存量怎么办：与 `check-toplevel-new.mjs` 共用一份基线
 *
 * AST 化会一次性暴露出 47 个未登记的「文件::构造器」键（issue #614 实测；其中 12 处是
 * 本该"新增即失败"的空参缓存，如 `EventEmitter` 的三个 `static ... = new Map()`——
 * 那三个已在 #614 欠账批改成 lazy-init：12 处清掉 9 处 / 7 个键，基线 135 → 128（rebase 到最新 master 后 125），
 * 剩下 3 处的保留理由见 `docs/CI.md` §2.1；ChainMap 批再清掉 30 处 / 29 个键，基线 125 →（#624 清掉 terrain 的 1 个键）124 → 95）。
 * 本脚本**不清零**，而是与 `scripts/check-toplevel-new.mjs` 读**同一份**存量基线
 * （`scripts/toplevel-new-baseline.json`）：
 *
 *   - 键**在基线里**→ 存量冻结，放行（属登记在册的欠账，不是白名单豁免）；
 *   - 键**不在基线里**→ `--strict` 下即失败——这才是"新增即失败"的真正含义。
 *
 * 粒度代价要说清：基线键是「文件::构造器」，所以**同一个文件里再加一个同名缓存不会失败**。
 * 这一条与 `check-toplevel-new.mjs` 共享（那一条本来就这个粒度），
 * 真正想收紧时得先把存量清零、再把基线收缩到空。
 *
 * ## 应用入口（issue #614 定夺）
 *
 * 应用入口页在 import 时执行代码是它的固有语义（不被 tree-shake、也没有"谁 import 它"的问题），
 * 所以**入口页整类豁免**——模块级 `new`（含缓存形态）、启动型调用、`globalThis` 写入都不报。
 * 这与本脚本原先的 `ENTRY_FILE`（命中即整文件 `return`）行为一致，换的只是"入口在哪里定义"：
 * 现在是 `scripts/r2-module-scope.mjs` 的 **`ENTRY_FILES` 显式清单**，**两条 R2 脚本共用同一份**
 * （原先那条 `ENTRY_FILE` 正则只在本脚本里，另一条脚本没有入口概念——25 个示例入口的
 * `new GUI(...)` 因此默默进了基线，正是 #614 报的口径不一致）。
 * 清单刻意**不含**单个示例页；理由、代价与"将来怎么收紧"写在 `ENTRY_FILES` 上方。
 * **代价**（issue #614 要求写清）：入口页里的真副作用一起放行，实测一处
 * （`packages/editor/src/vue-app/main.ts:93` 的模块级 `setTimeout`），细则见 `docs/CI.md` §2.1。
 *
 * 用法：`node scripts/check-module-side-effects.mjs [--strict]`
 * （`--strict`：有基线外的违规即 exit 1；CI 用它。默认只报告。）
 *
 * 为什么注册型调用只统计：全仓上百个 Logic 文件都靠顶层注册分发，一次性清零需要先改注册模型
 * （见 docs/ARCHITECTURE_V2.md §2.2 第 2 项的分期计划）。判据先守上面三类新增，注册模型的存量按分期改造。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import {
    baselineKey,
    checkCacheNameLists,
    collectModuleLevelCalls,
    collectModuleLevelGlobalThisWrites,
    collectModuleLevelNews,
    collectTsFiles,
    CONTEXT_LABELS,
    entryFileList,
    isEntryFile,
    missingEntryFiles,
    readBaseline,
    toRelative,
} from './r2-module-scope.mjs';
import { assertScanVolume } from './scan-volume.mjs';

/** --strict：有基线外的违规即 exit 1（CI 用；默认只报告） */
const strict = process.argv.includes('--strict');
const ROOT = process.cwd();
const PACKAGES = join(ROOT, 'packages');

/** 「启动型」调用：定时器 / rAF / ticker 启动——这些必须显式化，不能在 import 时执行 */
const STARTUP_CALLS = /^(?:setInterval|setTimeout|requestAnimationFrame|runTickerFuncs|startTicker)$/;

/**
 * 内置缓存容器名：**空参形态**才算按需缓存（`new Set([...])` 是只读常量集合，见下面的 else 分支）。
 */
const CACHE_NAMES = new Set(['Map', 'WeakMap', 'Set', 'WeakSet']);

/**
 * **项目自有**缓存容器名：不套用空参限制，任何实参形态都判为缓存创建。
 *
 * ### 为什么 `ChainMap` 算「缓存容器」
 *
 * `ChainMap` 定义在 `packages/webgpu/src/utils/ChainMap.ts`（`ChainMap<K extends readonly unknown[], V>`），
 * 并由 `packages/webgpu/src/index.ts` 公开导出（`export * from './utils/ChainMap'`）。它是
 * **`Map` 的封装**：内部用 `WeakMap` 逐级嵌套（键数组 → 值），并用 `wrapKey` 把字面量键包成对象，
 * 对外只暴露 `get` / `set` / `delete` / `size`——语义上就是一张「键 → 值」的**查表缓存**，
 * 没有任何"构造即计算"的其它职责。在本仓的唯一用途也是缓存：`packages/webgpu/src/caches/*` 的
 * 30 处身份键缓存（`WGPUBuffer` / `WGPUTexture` / … 的 `getInstance` 查表）。
 * 所以它在 import 期执行的性质与 `new Map()` 完全同类——**必须 lazy-init**。
 *
 * ### 为什么它不套用「空参才算」这条限制
 *
 * 内置容器需要空参限制，是因为 `new Set([...])` / `new Map([[...]])` 有**只读常量表**这种合法写法
 * （构造参数决定了它不是"按需分配"）。`ChainMap` 没有这种用法：它的键是运行时对象、
 * 构造不接收任何数据，只有"空 / 泛型实参"一种形态。
 * 核实记录（2026-10-05）：`ChainMap` **未声明 `constructor`**，因此 `new ChainMap()` 与
 * `new ChainMap<[Device, Texture], V>()` 的实参个数都是 0，两种写法本来就落在空参判据里；
 * 这里仍然**不套空参限制**，是为了让"将来给它加可选构造参数（容量 / 比较函数）"也不产生漏洞
 * ——取向与两条 R2 门禁一致：宁可多报（去重比漏网好）。
 *
 * ### 判据局限（与 `check-imperative-construction.mjs` 同类）
 *
 * 名单按**构造器短名**匹配、**不看导入来源**（`scripts/r2-module-scope.mjs` 的 `constructorName`）。
 * 本仓现状下全仓只有一处 `ChainMap` 定义、也只用在这一种缓存语义上（误报面实测为 0，见 `docs/CI.md` §2.1）；
 * 若将来某个包定义了同名的**本地** `ChainMap`（不同语义），会被误报——那时要么改掉同名，
 * 要么在这里按路径豁免，**不要**为了让它变绿而把真违规说成误报。
 */
const PROJECT_CACHE_NAMES = new Set(['ChainMap']);

/** 注册型调用（顶层注册模型改造范围，只统计不报错） */
const REGISTRATION_CALLS = /^(?:registerLogic|unregisterLogic)$/;

/**
 * 判一条「模块级 `new`」命中是否算**缓存创建**（本脚本规则 1 的判据）。
 *
 * 抽成函数是为了让下面的 `SELF_CHECKS` 能直接喂合成样例——判据写在扫描循环里时没法自检。
 *
 * @param {{ name: string, argumentCount: number }} hit `collectModuleLevelNews` 的一条命中
 * @returns {boolean} 是缓存创建则 true
 */
function isCacheCreation(hit)
{
    // 内置容器：空参（含"只有泛型实参"）才算按需缓存。
    // 项目自有容器（`ChainMap`）：不看实参个数——它没有"构造即常量表"的合法写法（理由见名单注释）。
    return (hit.argumentCount === 0 && CACHE_NAMES.has(hit.name))
        || PROJECT_CACHE_NAMES.has(hit.name);
}

/** 脚本侧的缓存容器名单（内置 + 项目自有）：既是判据的输入，也是名单一致性断言的**基准** */
const SCRIPT_CACHE_NAMES = [...CACHE_NAMES, ...PROJECT_CACHE_NAMES];

// ---- 做法 5（issue #652）：名单一致性断言 ----
// 这份名单在本仓有四份、靠人手工同步（#606 / #647 反复踩的就是这条）：漏改一处只表现为
// "某个新写法没人拦"，而门禁照样绿。探针那份刻意冻结历史读数、不参与比对。
const cacheNameLists = checkCacheNameLists(ROOT, SCRIPT_CACHE_NAMES);

if (!cacheNameLists.ok)
{
    console.error('❌ R2 缓存容器名单不一致（issue #652 做法 5）：');

    for (const problem of cacheNameLists.problems) console.error(`  - ${problem}`);

    console.error('   基准 = 本脚本的 CACHE_NAMES + PROJECT_CACHE_NAMES；对侧有两份：');
    console.error('     packages/eslint-plugin-feng3d/src/rules/no-module-side-effect.ts 的 CACHE_CONSTRUCTORS');
    console.error('     scripts/check-editor-module-effects.mjs 的 MUTABLE_MODULE_CACHE');
    console.error('   名单漂移 = 某个新写法没人拦而门禁照样绿，先补名单再谈门禁结论。');
    process.exit(1);
}

// ---- 做法 2（issue #652）：脚本内联合成样例自检 ----
//
// 门禁最怕永远绿（`check-runtime-half-deps.mjs` 的原话），而本脚本的三类判据此前既无单测、
// 也无自检。这里把合成片段直接喂给判据，断言"该报的报、不该报的不报"。
//
// ⚠️ **局限（如实写在这里，别把它当万能）**：自检与判据**同文件同进程**，判据写错时自检会
// **一起错**——它发现不了"两处都错"（判据与自检共享同一个错误理解），只能防**单点回归**
// （改判据时手滑 / 名单漂移）。判据形状本身由 `test/r2ModuleScope.spec.ts` 守。
const SELF_CHECKS = [
    {
        kind: 'cache',
        title: '模块顶层多行声明里的 `new Map()` 拦下',
        code: 'export const a =\n    new Map<string, number>();',
        expect: ['Map/module'],
    },
    {
        kind: 'cache',
        title: '泛型实参不挡匹配：`new WeakSet<T>()` 拦下（#606）',
        code: 'export const a = new WeakSet<Foo>();',
        expect: ['WeakSet/module'],
    },
    {
        kind: 'cache',
        title: '类 static 字段初始化器里的 `new Map()` 拦下',
        code: 'class A\n{\n    private static cache = new Map<string, number>();\n}',
        expect: ['Map/static-field'],
    },
    {
        kind: 'cache',
        title: '类 static 块里的 `new ChainMap()` 拦下（上下文 + 项目自有名单一起判）',
        code: 'class A\n{\n    static\n    {\n        A.cache = new ChainMap<[A], string>();\n    }\n}',
        expect: ['ChainMap/static-block'],
    },
    {
        kind: 'cache',
        title: '★ 带括号 IIFE 里的 `new Map()` 拦下（#652 实测 6 改坏的就是这一处）',
        code: 'const c = (() =>\n{\n    const m = new Map<string, number>();\n    return m;\n})();',
        expect: ['Map/module'],
    },
    {
        kind: 'cache',
        title: '模块级调用回调里的 `new Set()` 拦下',
        code: '[1, 2].forEach(() => { const s = new Set<string>(); });',
        expect: ['Set/module-call-callback'],
    },
    {
        kind: 'cache',
        title: '函数体内的 `new Map()` 不拦（函数被调用时才执行）',
        code: 'export function f() { return new Map<string, number>(); }',
        expect: [],
    },
    {
        kind: 'cache',
        title: '类实例字段里的 `new Map()` 不拦（new 实例时才执行）',
        code: 'class A\n{\n    private cache = new Map<string, number>();\n}',
        expect: [],
    },
    {
        kind: 'cache',
        title: '`new Set([...])` 只读常量集合不拦（只统计）',
        code: "export const s = new Set(['a', 'b']);",
        expect: [],
    },
    {
        kind: 'startup',
        title: '模块级启动型调用 `setTimeout(...)` 拦下',
        code: 'setTimeout(() => { work(); }, 0);',
        expect: ['setTimeout'],
    },
    {
        kind: 'startup',
        title: '函数体内的 `setTimeout(...)` 不拦（显式启动是允许的）',
        code: 'export function boot() { setTimeout(() => { work(); }, 0); }',
        expect: [],
    },
    {
        kind: 'global',
        title: '模块级写 `globalThis` 拦下',
        code: 'globalThis.__feng3d = {};',
        expect: ['globalThis.__feng3d'],
    },
    {
        kind: 'global',
        title: '函数体内的 `globalThis` 写入不拦（显式安装函数是允许的）',
        code: 'export function install() { globalThis.__feng3d = {}; }',
        expect: [],
    },
];

/**
 * 把一段合成源码喂给判据，返回实际命中的字符串数组（`名字/上下文`、调用名、或写入文本）。
 *
 * @param {{ kind: string, code: string }} check 一条自检
 * @returns {string[]} 实际命中
 */
function runSelfCheck(check)
{
    const sourceFile = ts.createSourceFile('__r2_self_check__.ts', check.code, ts.ScriptTarget.Latest, true);

    if (check.kind === 'cache')
    {
        return collectModuleLevelNews(sourceFile)
            .filter(isCacheCreation)
            .map((hit) => `${hit.name}/${hit.context}`);
    }
    if (check.kind === 'startup')
    {
        return collectModuleLevelCalls(sourceFile, () => true)
            .filter((hit) => STARTUP_CALLS.test(hit.callee))
            .map((hit) => hit.callee);
    }

    return collectModuleLevelGlobalThisWrites(sourceFile).map((hit) => hit.text);
}

let selfCheckFailed = 0;

console.log('--- 自检（判据喂合成样例，issue #652 做法 2）---');

for (const check of SELF_CHECKS)
{
    const actual = runSelfCheck(check);
    const ok = actual.join('|') === check.expect.join('|');

    if (!ok) selfCheckFailed++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${check.title}`
        + (ok ? '' : `（期望 [${check.expect.join(', ')}]，实际 [${actual.join(', ')}]）`));
}

if (selfCheckFailed > 0)
{
    console.error(`❌ 判据自检失败 ${selfCheckFailed} 条：判据被改坏了，先修判据再谈门禁结论（issue #652）。`);
    process.exit(1);
}

/** 应用入口（页面入口）：清单在 `scripts/r2-module-scope.mjs` 的 `ENTRY_FILES`，两条 R2 脚本共用 */
const entries = entryFileList();

/** 入口清单的反向校验（登记项必须存在），与判据无关，错了就是配置错 */
const staleEntries = missingEntryFiles(ROOT);

/** 存量基线：键在其中的视为登记在册的欠账，放行 */
const baseline = readBaseline(ROOT);

/** 基线外的违规（会导致 `--strict` 失败） */
const problems = [];

/** 基线内的存量（放行，但在报告里透明列出量级） */
const frozen = [];

/** 统计（不报错，只用于输出里说明存量） */
const stats = {
    constantSets: 0, registeredCalls: 0, otherTopLevelCalls: 0,
    entryFiles: 0, entryNews: 0, entryCalls: 0, moduleLevelNews: 0,
};

/** 记录模块级 `new` 的「文件::构造器」键（报告里与探针读数对照用） */
const newsKeys = new Set();

const tsFiles = collectTsFiles(PACKAGES);

assertScanVolume({
    label: 'R2 模块级副作用扫描（packages/ 下全部 .ts）',
    count: tsFiles.length,
    min: 1,
    detail: '扫描根：packages/（scripts/r2-module-scope.mjs 的 collectTsFiles）',
});

for (const file of tsFiles)
{
    const rel = toRelative(ROOT, file);
    const isEntry = isEntryFile(rel);

    if (isEntry) stats.entryFiles++;

    const sourceFile = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);

    // 规则 1：模块级**缓存**（内置容器的空参 / 只有泛型实参形态，加项目自有的 `ChainMap`）。
    for (const hit of collectModuleLevelNews(sourceFile))
    {
        stats.moduleLevelNews++;
        newsKeys.add(baselineKey(rel, hit.name));

        if (isEntry) stats.entryNews++;

        const label = CONTEXT_LABELS[hit.context] ?? hit.context;

        if (isCacheCreation(hit))
        {
            if (isEntry) continue;                       // 入口页整类豁免（页面装配 + 应用启动）

            const written = hit.argumentCount > 0 ? `new ${hit.name}(...)` : `new ${hit.name}()`;
            const where = `${rel}:${hit.line} 模块级 \`${written}\`（缓存应 lazy-init）[${label}]`;

            if (baseline.has(baselineKey(rel, hit.name))) frozen.push(where);
            else problems.push(where);
        }
        else if (hit.name === 'Set' && hit.argumentCount > 0)
        {
            stats.constantSets++;                        // 只读常量集合：只统计
        }
    }

    // 规则 2：模块级「启动型」调用 + 顶层纯调用语句的统计（注册型与其它分开，两者都不进判据）。
    for (const hit of collectModuleLevelCalls(sourceFile, () => true))
    {
        if (STARTUP_CALLS.test(hit.callee))
        {
            if (isEntry) { stats.entryCalls++; continue; }   // 入口页整类豁免
            problems.push(`${rel}:${hit.line} 模块级启动型调用 \`${hit.callee}(\`（应在显式函数里启动）`);
            continue;
        }
        if (!hit.isStatement) continue;                  // 声明形式（`export const x = foo()`）由另一条脚本的基线管
        if (REGISTRATION_CALLS.test(hit.callee)) stats.registeredCalls++;
        else stats.otherTopLevelCalls++;
    }

    // 规则 3：模块级写 `globalThis`。
    for (const hit of collectModuleLevelGlobalThisWrites(sourceFile))
    {
        if (isEntry) { stats.entryCalls++; continue; }       // 入口页整类豁免
        problems.push(`${rel}:${hit.line} 模块级写 globalThis \`${hit.text}\``);
    }
}

// 入口清单的反向校验先跑：清单是"单一事实来源"，过期的登记项会让豁免范围悄悄失真。
if (staleEntries.length > 0)
{
    console.error(`❌ 应用入口清单里有不存在的登记项（${staleEntries.length} 个）：`);
    for (const rel of staleEntries) console.error(`  - ${rel}`);
    console.error('   清单在 scripts/r2-module-scope.mjs 的 ENTRY_FILES，两条 R2 脚本共用；');
    console.error('   文件被删 / 改名后请同步更新清单（过期登记 = 豁免范围与文档说的不一致）。');
    process.exit(1);
}

if (problems.length > 0)
{
    console.error(`❌ 模块级副作用（R2，issue #88）：${problems.length} 处基线外的违规`);
    console.error('   （判据为 AST：模块顶层 / 类 static 字段与 static 块 / 模块级调用回调；'
        + '应用入口清单里的文件整类豁免，代价见 docs/CI.md §2.1）');

    for (const problem of problems) console.error(`  - ${problem}`);
    console.error('\n修法：缓存改 lazy-init（`let cache = null; function getCache()`，'
        + '`WeakSet` / `WeakMap` / `Set` / `Map` 都一样，泛型实参不影响判定；'
        + '项目自有的 `ChainMap` 同样算缓存容器，见本脚本的候选名单注释）；');
    console.error('模块级的初始化代码移进显式函数（如 Ticker.startTicker），不要在 import 时执行；');
    console.error('globalThis 写入移到显式安装函数里，由入口或使用者调用。');

    if (frozen.length > 0)
    {
        console.error(`\nℹ️  另有 ${frozen.length} 处已在基线 scripts/toplevel-new-baseline.json 里的存量（本次放行，属欠账）。`);
    }

    if (strict) process.exit(1);
    console.log('⚠️  以上为基线外的新增，默认只报告；CI 用 --strict 让它们失败。');
    process.exit(0);
}

console.log('✅ 模块级副作用检查通过（R2，AST 判据）');
console.log(`   扫描 packages/ 下 .ts：import 时执行的 \`new\` ${stats.moduleLevelNews} 处 / `
    + `${newsKeys.size} 个「文件::构造器」键；启动型调用 0 处；globalThis 写入 0 处`);
console.log(`   应用入口豁免（清单 ${entries.length} 个文件，见 scripts/r2-module-scope.mjs 的 ENTRY_FILES）：`
    + `${stats.entryNews} 处 \`new\` / ${stats.entryCalls} 处启动型调用或 globalThis 写入`
    + '——入口页 import 即执行是固有语义，真副作用**有意放行**，代价见 docs/CI.md §2.1');
console.log(`   存量冻结（基线 ${baseline.size} 个组合）：缓存创建 ${frozen.length} 处已登记放行`);
console.log(`   缓存容器候选名单：内置 \`Map\` / \`WeakMap\` / \`Set\` / \`WeakSet\`（限空参形态）`
    + `+ 项目自有 \`ChainMap\`（不看实参，定义见 packages/webgpu/src/utils/ChainMap.ts）`);
console.log(`   门禁自身的保护（issue #652）：判据自检 ${SELF_CHECKS.length} 条全过、`
    + `名单一致性断言通过（脚本侧 vs 自研规则 \`CACHE_CONSTRUCTORS\` vs 编辑器侧 \`MUTABLE_MODULE_CACHE\`）；`
    + '判据层单测见 test/r2ModuleScope.spec.ts');
console.log(`   存量统计（不在本次门禁范围）：注册型顶层调用 ${stats.registeredCalls} 处、`
    + `其它顶层**裸调用语句** ${stats.otherTopLevelCalls} 处、只读常量集合 ${stats.constantSets} 处`);
console.log('   口径边界：模块级 `new` 的**全量**存量（含上面三类之外的构造）见'
    + ' `scripts/check-toplevel-new.mjs`；两条脚本重叠处**有意重复报告**（去重比漏网好）。');
