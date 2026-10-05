/**
 * R2：零模块级副作用（运行时侧，issue #88；判据 AST 化见 issue #614）。
 *
 * 模块在 import 时执行代码，会让缓存无法按需分配、副作用无法关闭、tree-shaking 也判断不了
 * 模块能否整体消除。本脚本守三类：
 *
 *   1. **缓存创建**：模块级 `= new Map() / new WeakMap() / new Set() / new WeakSet()`
 *      （空参或只有泛型实参；泛型实参不影响判定，`new WeakSet<Components>()` 同样拦下——issue #606）。
 *      带字面量参数的 `new Set([...])` 是只读常量集合，不是按需缓存——只统计，不报错。
 *   2. **启动型调用**：定时器 / rAF / ticker 启动（`setInterval` / `setTimeout` /
 *      `requestAnimationFrame` / `runTickerFuncs` / `startTicker`）。
 *   3. **`globalThis` 写入**。
 *
 * ## 判据为什么是 AST（issue #614）
 *
 * 原判据是**行级**的（「行首无空白 = 模块顶层」+ 单行正则）。实测（`scripts/probe-r2-blindspots.mjs`）
 * `packages/` 下真正在 import 时执行的 `new` 有 **158 处**，两条行级脚本合计只看见 **97 处**，
 * 漏 **61 处**——四类盲区（类 `static` 字段 / `static` 块、顶层 IIFE、多行声明、
 * 模块级块 / 对象字面量 / 回调）全部由缩进造成。现在判据是「**顶层代码路径上的节点**」，
 * 实现与两条脚本的共用层在 `scripts/r2-module-scope.mjs`（先例：`scripts/check-editor-module-effects.mjs`）。
 *
 * 最直接的两个例子：`packages/feng3d/src/textures/createTexture.ts` 模块级 `if` 块里 7 处
 * `new ImageUtil`（`docs/CI.md` §1.1 自己就写着"`ImageUtil` 在模块加载期构造占位默认纹理"），
 * 以及 `packages/webgpu/src/caches/*` 里 30 处 `static map = new ChainMap()`——原先门禁都看不见
 * （`ChainMap` 是项目自有容器，不在本脚本的 `Map/WeakMap/Set/WeakSet` 候选名单里；那 30 处已由
 * ChainMap 批全部 lazy-init，基线键 −29）。
 *
 * ## 存量怎么办：与 `check-toplevel-new.mjs` 共用一份基线
 *
 * AST 化会一次性暴露出 46 个未登记的「文件::构造器」键（issue #614 实测；其中 12 处是
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

/** --strict：有基线外的违规即 exit 1（CI 用；默认只报告） */
const strict = process.argv.includes('--strict');
const ROOT = process.cwd();
const PACKAGES = join(ROOT, 'packages');

/** 「启动型」调用：定时器 / rAF / ticker 启动——这些必须显式化，不能在 import 时执行 */
const STARTUP_CALLS = /^(?:setInterval|setTimeout|requestAnimationFrame|runTickerFuncs|startTicker)$/;

/** 缓存容器名（空参形态才算缓存；带参数的 `new Set([...])` 是常量集合） */
const CACHE_NAMES = new Set(['Map', 'WeakMap', 'Set', 'WeakSet']);

/** 注册型调用（顶层注册模型改造范围，只统计不报错） */
const REGISTRATION_CALLS = /^(?:registerLogic|unregisterLogic)$/;

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

for (const file of collectTsFiles(PACKAGES))
{
    const rel = toRelative(ROOT, file);
    const isEntry = isEntryFile(rel);

    if (isEntry) stats.entryFiles++;

    const sourceFile = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);

    // 规则 1：模块级**缓存**（空参 / 只有泛型实参的 `new Map/WeakMap/Set/WeakSet()`）。
    for (const hit of collectModuleLevelNews(sourceFile))
    {
        stats.moduleLevelNews++;
        newsKeys.add(baselineKey(rel, hit.name));

        if (isEntry) stats.entryNews++;

        const label = CONTEXT_LABELS[hit.context] ?? hit.context;

        if (hit.argumentCount === 0 && CACHE_NAMES.has(hit.name))
        {
            if (isEntry) continue;                       // 入口页整类豁免（页面装配 + 应用启动）

            const where = `${rel}:${hit.line} 模块级 \`new ${hit.name}()\`（缓存应 lazy-init）[${label}]`;

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
        + '`WeakSet` / `WeakMap` / `Set` / `Map` 都一样，泛型实参不影响判定）；');
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
console.log(`   存量统计（不在本次门禁范围）：注册型顶层调用 ${stats.registeredCalls} 处、`
    + `其它顶层**裸调用语句** ${stats.otherTopLevelCalls} 处、只读常量集合 ${stats.constantSets} 处`);
console.log('   口径边界：模块级 `new` 的**全量**存量（含上面三类之外的构造）见'
    + ' `scripts/check-toplevel-new.mjs`；两条脚本重叠处**有意重复报告**（去重比漏网好）。');
