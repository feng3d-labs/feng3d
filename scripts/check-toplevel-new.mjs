/**
 * 模块级 `new` 的存量门禁（R2 的补强，issue #56 的副产品；判据 AST 化见 issue #614）。
 *
 * **与 `scripts/check-module-side-effects.mjs` 的分工**（issue #606 明确，消灭"我以为你管了"的夹缝）：
 *   - 那条脚本管**缓存形态**（空参 / 只有泛型实参的 `new Map/WeakMap/Set/WeakSet()`）、
 *     启动型调用（定时器 / rAF / ticker）与写 `globalThis`——**新增即失败**；
 *   - 本脚本管**其余模块级 `new`**——`export const x = new X()` 这类**声明形式**的构造，
 *     含 `new Set([...])` 只读常量集合、`new Float32Array([...])`、示例入口里的 `new GUI(...)`、
 *     以及库代码里的模块级单例。**存量冻结**，新增即失败。
 *
 * 两条脚本共用一份判据实现：`scripts/r2-module-scope.mjs`（issue #614 抽出）。
 *
 * 背景：issue #56 的根因 `new AudioContext()` 是模块顶层一个 IIFE 里的副作用，会在 import 时执行，
 * 浏览器因此报 "The AudioContext was not allowed to start"——它落在上面那条脚本的统计盲区里，
 * 所以要独立一条门禁兜底。
 *
 * **判据已从行级换成 AST（issue #614）**。换之前是「行首无空白 = 模块顶层」+ 单行正则，
 * 实测（`scripts/probe-r2-blindspots.mjs`）`packages/` 下真正在 import 时执行的 `new` 有 **158 处**，
 * 两条行级脚本合计只看见 **97 处**，漏 **61 处**（换算成「文件::构造器」是 46 个未登记的键，
 * 见下）。换成 AST 后下面四类盲区全部纳入判据：
 *
 *   ① 类 **`static` 字段 / `static` 块**初始化器（`private static map = new ChainMap()`，本仓 40 余处）；
 *   ② **顶层 IIFE**——issue #56 的根因 `new AudioContext()` 正是这个形态，原先三条判据都不看它；
 *   ③ **多行声明**（`const x =\n    new Map();`）；
 *   ④ 模块级**块 / 对象字面量 / 回调**里的缩进行（`{ a: new Set([...]) }`、`[...].forEach(() => new X())`）。
 *
 * 基线的**键**仍是「文件::构造器短名」，不含行号——行号会随无关改动漂移，导致门禁频繁误报。
 * 因此同一文件里再多一个**同名**构造器**不会**被本脚本发现（这是基线粒度的固有属性）；
 * 但缓存形态的那一类由 `check-module-side-effects.mjs --strict` 另行按"新增即失败"守，
 * 两条脚本重叠处**有意重复报告**（去重比漏网好）。
 *
 * **应用入口按路径豁免（issue #614 定夺）**：入口页在 import 时执行代码是它的固有语义
 * （不被 tree-shake、也没有"谁 import 它"的问题），所以入口页的模块级 `new` **不进基线**。
 * 入口定义是 `scripts/r2-module-scope.mjs` 里的 **`ENTRY_FILES` 显式清单**——**两条 R2 脚本共用同一份**
 * （本文原先没有任何入口概念，于是示例入口的 `new GUI(...)` 键默默进了基线，正是 #614 报的口径不一致）。
 * 清单刻意**不含**单个示例页（`packages/webgpu/examples/src/webgpu/` 各页面的 `index.ts`），
 * 理由、代价（入口页的真副作用一起放行，实测一处）与"将来怎么收紧"都写在 `ENTRY_FILES` 上方，
 * 摘要见 `docs/CI.md` §2.1「已知局限」。
 *
 * **那两处单例为什么仍冻结在基线里**（issue #606 后续复核，不是遗漏）：
 * `GlobalEmitter.ts::EventEmitter` 与 `WindowEventProxy.ts::EventProxy` 保持冻结——它们是**身份敏感的对象单例**
 * （`EventEmitter` 的构造会把自己写进三个 `static` 注册表，事件路由靠 `instanceof` 与对象身份），
 * lazy-init 等于公开 API 变更（`globalEmitter` 实测 77 处 / 20 文件、`windowEventProxy` 121 处 / 23 文件，
 * 并经 `feng3d` 公开入口 `export *` 出去）；而且只改这两行**并不能**让模块变 R2 干净——`EventEmitter`
 * 自身还有三个模块级 `private static ... = new Map()`，同样是 import 时执行。
 * 判定理由与建议的迁移路径见 docs/CI.md §2.1。
 *
 * 为什么不做成"直接报错"：全仓顶层 `new` 是大几十处的量级，其中既有真副作用
 * （示例入口的 `new GUI`、各种 FS/渲染器/管理器的单例），也有无害的只读常量
 * （`new Float32Array` / `new Vector3` / `new Matrix4x4` / `new Date` / `new RegExp`）。
 * 一次性全报只会让人把门禁当噪音忽略——这与 `check-module-side-effects.mjs` 里
 * "一次报一百多条只会让人把这条门禁当噪音忽略"的判断一致。
 * （存量规模**不写死在这个注释里**：它会随每次收紧而腐化，以脚本输出 / `--list` 为准。）
 *
 * 所以采用与 `check-layer-direction.mjs` 相同的**存量冻结**策略：
 *   - 基线里的（`文件 + 构造器` 组合）视为已知存量，放行；
 *   - 基线上**新增**的即失败——挡住"又一个模块级单例悄悄出现"；
 *   - 存量减少（有人清理了）也提示基线该更新，但不失败。
 *
 * 用法：
 *   node scripts/check-toplevel-new.mjs            # 校验（CI 用）
 *   node scripts/check-toplevel-new.mjs --update   # 重写基线
 *   node scripts/check-toplevel-new.mjs --list     # 打印全部存量（含入口豁免区块）
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import {
    baselineKey,
    collectModuleLevelNews,
    collectTsFiles,
    CONTEXT_LABELS,
    entryFileList,
    isEntryFile,
    missingEntryFiles,
    readBaseline,
    toRelative,
} from './r2-module-scope.mjs';

const ROOT = process.cwd();
const BASELINE = join(ROOT, 'scripts', 'toplevel-new-baseline.json');
const args = process.argv.slice(2);
const update = args.includes('--update');
const list = args.includes('--list');

/** 应用入口（页面入口）：清单在 `scripts/r2-module-scope.mjs` 的 `ENTRY_FILES`，两条 R2 脚本共用 */
const entries = entryFileList();

/** 入口清单的反向校验（登记项必须存在） */
const staleEntries = missingEntryFiles(ROOT);

/**
 * 扫描 `packages/` 下全部 import 时执行的 `new`。
 *
 * @returns {{ rel: string, line: number, name: string, context: string, key: string, entry: boolean }[]} 命中列表
 */
function scanAll()
{
    const rows = [];

    for (const file of collectTsFiles(join(ROOT, 'packages')))
    {
        const rel = toRelative(ROOT, file);
        const sourceFile = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
        const entry = isEntryFile(rel);

        for (const hit of collectModuleLevelNews(sourceFile))
        {
            rows.push({ rel, ...hit, key: baselineKey(rel, hit.name), entry });
        }
    }

    return rows;
}

const rows = scanAll();
const foundSet = new Set(rows.filter((row) => !row.entry).map((row) => row.key));
const entryRows = rows.filter((row) => row.entry);

// 入口清单的反向校验先跑：清单是"单一事实来源"，过期登记会让豁免范围与文档说的不一致。
if (staleEntries.length > 0)
{
    console.error(`❌ 应用入口清单里有不存在的登记项（${staleEntries.length} 个）：`);
    for (const rel of staleEntries) console.error(`  - ${rel}`);
    console.error('   清单在 scripts/r2-module-scope.mjs 的 ENTRY_FILES，两条 R2 脚本共用。');
    process.exit(1);
}

if (list)
{
    [...foundSet].sort().forEach((key) => console.log(`  ${key}`));
    console.log(`\n共 ${foundSet.size} 个「文件::构造器」组合（计入基线）`);
    console.log(`\n应用入口豁免清单（${entries.length} 个文件，见 scripts/r2-module-scope.mjs 的 ENTRY_FILES）：`);

    for (const entry of entries) console.log(`  ${entry.rel}  —— ${entry.reason}`);

    if (entryRows.length > 0)
    {
        console.log(`\n其中命中模块级 \`new\` 的（${new Set(entryRows.map((row) => row.rel)).size} 个文件 / ${entryRows.length} 处，不计入基线）：`);

        for (const row of entryRows) console.log(`  ${row.rel}:${row.line}  new ${row.name}()  [${CONTEXT_LABELS[row.context] ?? row.context}]`);
    }

    process.exit(0);
}

if (update)
{
    const baseline = {
        note: '模块级 `new` 的存量基线（R2 补强）。新增即失败；清理掉存量后请重跑 --update。'
            + '键是「相对路径::构造器名」，刻意不含行号——行号会随无关改动漂移，导致门禁频繁误报。'
            + '判据为 AST（issue #614）：模块顶层 / 类 static 字段与 static 块 / 模块级调用回调里的 `new`；'
            + '应用入口按路径豁免，清单在 scripts/r2-module-scope.mjs 的 ENTRY_FILES（两条 R2 脚本共用）。',
        entries: [...foundSet].sort(),
    };

    writeFileSync(BASELINE, `${JSON.stringify(baseline, null, 4)}\n`, 'utf8');
    console.log(`✅ 已写入基线（${baseline.entries.length} 个组合；另有入口清单豁免 ${entryRows.length} 处未计入）`);
    process.exit(0);
}

let known;

try
{
    known = readBaseline(ROOT);
}
catch
{
    console.error(`❌ 读不到基线 scripts/toplevel-new-baseline.json：先跑一次 --update 并提交进仓库`);
    process.exit(1);
}

const added = [...foundSet].filter((key) => !known.has(key));
const removed = [...known].filter((key) => !foundSet.has(key));

if (added.length > 0)
{
    console.error(`❌ 新增了模块级 \`new\`（R2）：${added.length} 处`);
    added.forEach((key) => console.error(`  - ${key}`));
    console.error('\n修法：把创建移进函数（lazy-init），或改成纯数据字面量。');
    console.error('     若确实是必须的模块级单例，需要在基线里显式登记并说明理由。');
    process.exit(1);
}

console.log(`✅ 模块级 \`new\` 存量未增长（基线 ${known.size} 个组合，当前 ${foundSet.size} 个；`
    + `AST 判据下 import 时执行 ${rows.length} 处，其中入口页豁免 ${entryRows.length} 处）`);

if (removed.length > 0)
{
    console.log(`   （有 ${removed.length} 个存量已被清理，可以跑 --update 收紧基线：${removed.slice(0, 5).join('、')}${removed.length > 5 ? ' …' : ''}）`);
}
