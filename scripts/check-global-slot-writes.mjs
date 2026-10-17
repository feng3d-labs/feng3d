/**
 * 引擎全局槽位写入门禁（R2 的盲区补丁，issue #679）。
 *
 * ## 为什么需要它
 *
 * `packages/filesystem/src/ReadFS.ts` / `HttpFS.ts` 在**模块顶层**写引擎全局槽位：
 *
 * ```ts
 * FS.fs = new ReadFS();        // import 这两个模块 = 改引擎全局装配
 * FS.basefs = new HttpFS();
 * ```
 *
 * 这正是 R2「零模块级副作用」要禁的形态，但它**不落在任何现有判据里**：
 * - `check-module-side-effects.mjs --strict` 的判据面是「缓存创建 / 启动型调用 / `globalThis` 写入」，
 *   `FS.fs = ...` 是**普通赋值**，不在范围内；
 * - `check-toplevel-new.mjs` 只统计模块级 `new`（`FS.fs = new ReadFS()` 会被算进去），
 *   但「赋给引擎全局槽位」这件事它不知道。
 *
 * 于是这个盲区一直存在、且留着也不会有人发现——本脚本把它补上（元规则：没有执行者的只能算建议）。
 *
 * ## 判据
 *
 * 模块级上下文（`module` / 类 `static` 字段与块 / 模块级调用回调）里对**全局槽位容器**的赋值，
 * 命中即失败；存量冻结在 `scripts/global-slot-writes-baseline.json`（键 `相对路径::容器`），
 * **新增即失败**、减少只提示。
 *
 * 槽位容器名单在 `scripts/r2-module-scope.mjs` 的 `GLOBAL_SLOT_CONTAINERS`（与缓存容器名单同一口径：
 * 显式登记，新增一个容器就要在那里加）。判据层与 `check-module-side-effects.mjs` 共用同一份 AST 实现。
 *
 * ## 自检
 *
 * 启动时先跑合成样例（该报的报、函数体内的不报、容器名单外的不报），失败即 exit 1——
 * 照 issue #652 的做法：判据自身也要有回归保护，否则「改了判据、门禁变成永远绿」没人发现。
 *
 * 用法：
 *   node scripts/check-global-slot-writes.mjs            # 校验（进 CI）
 *   node scripts/check-global-slot-writes.mjs --list     # 打印命中清单
 *   node scripts/check-global-slot-writes.mjs --update   # 重写基线（清理存量后收紧用）
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import {
    GLOBAL_SLOT_CONTAINERS,
    collectModuleLevelGlobalSlotWrites,
    collectTsFiles,
    toRelative,
} from './r2-module-scope.mjs';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const ROOT = process.cwd();
const BASELINE = resolve(ROOT, 'scripts/global-slot-writes-baseline.json');
const SCAN_DIRS = ['packages'];

const list = process.argv.includes('--list');
const update = process.argv.includes('--update');

// ---------- 判据自检（启动即跑，失败即 exit 1） ----------
/**
 * 合成样例：验证判据既不漏也不泛。
 *
 * 每条样例都写明「期望命中几条」，判据一改就会被这里拦住。
 */
const SELF_CASES = [
    {
        name: '模块顶层给 FS 槽位赋值 → 命中',
        code: "import { FS } from './FS';\nclass A {}\nFS.fs = new A();\n",
        expect: 1,
    },
    {
        name: '模块顶层给 FS.basefs 赋值 → 命中',
        code: "import { FS } from './FS';\nFS.basefs = makeFS();\n",
        expect: 1,
    },
    {
        name: 'ReadRS.rs 赋值 → 命中（名单内第二个容器）',
        code: "import { ReadRS } from './ReadRS';\nReadRS.rs = makeRS();\n",
        expect: 1,
    },
    {
        name: '函数体内赋值 → 不命中（运行时装配是允许的）',
        code: "import { FS } from './FS';\nexport function install() { FS.fs = makeFS(); }\n",
        expect: 0,
    },
    {
        name: '名单外的容器 → 不命中（判据不扩成「任何模块级属性赋值」）',
        code: "import { Other } from './Other';\nOther.x = 1;\n",
        expect: 0,
    },
    {
        name: '非赋值（读槽位）→ 不命中',
        code: "import { FS } from './FS';\nconst f = FS.fs;\n",
        expect: 0,
    },
];

function runSelfCheck()
{
    const problems = [];

    for (const item of SELF_CASES)
    {
        const sf = ts.createSourceFile('self-check.ts', item.code, ts.ScriptTarget.Latest, true);
        const hits = collectModuleLevelGlobalSlotWrites(sf);

        if (hits.length !== item.expect)
        {
            problems.push(`${item.name}：期望 ${item.expect} 条，实测 ${hits.length} 条`);
        }
    }

    // 名单自证：空名单会让判据平凡通过
    if (GLOBAL_SLOT_CONTAINERS.size === 0)
    {
        problems.push('GLOBAL_SLOT_CONTAINERS 为空——判据会平凡通过');
    }

    if (problems.length > 0)
    {
        console.error('❌ 判据自检失败（改判据时先修这里）：');
        for (const p of problems) console.error(`   · ${p}`);
        process.exit(1);
    }
    console.log(`判据自检通过（${SELF_CASES.length} 条合成样例 + 非空名单）`);
}

runSelfCheck();

// ---------- 扫描 ----------
const files = SCAN_DIRS.flatMap((dir) => collectTsFiles(resolve(ROOT, dir)));
const hits = [];

for (const file of files)
{
    const rel = toRelative(ROOT, file);
    const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);

    for (const hit of collectModuleLevelGlobalSlotWrites(sf))
    {
        hits.push({ rel, line: hit.line, text: hit.text, container: hit.container, key: `${rel}::${hit.container}` });
    }
}

if (list)
{
    for (const hit of hits) console.log(`  ${hit.rel}:${hit.line}  ${hit.text}`);
    console.log(`\n共 ${hits.length} 处`);
    process.exit(0);
}

// ---------- 按「文件::容器」聚合（行号会漂移，不进基线键） ----------
const counts = new Map();

for (const hit of hits) counts.set(hit.key, (counts.get(hit.key) || 0) + 1);

if (update)
{
    const baseline = {
        note: '模块顶层给**引擎全局槽位**赋值（R2 的盲区，issue #679）。键是「相对路径::容器名」，值是出现次数（不含行号：行号会随无关改动漂移）。槽位容器名单在 scripts/r2-module-scope.mjs 的 GLOBAL_SLOT_CONTAINERS。**新增即失败**；清理完跑 --update 收紧。',
        entries: Object.fromEntries([...counts].sort((a, b) => a[0].localeCompare(b[0]))),
    };

    writeFileSync(BASELINE, `${JSON.stringify(baseline, null, 4)}\n`, 'utf8');
    console.log(`✅ 已写入基线（${Object.keys(baseline.entries).length} 个位置、${hits.length} 处）`);
    process.exit(0);
}

let baseline;

try
{
    baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
}
catch
{
    console.error('❌ 读不到基线 scripts/global-slot-writes-baseline.json：先跑一次 --update 并提交进仓库');
    process.exit(1);
}

const known = baseline.entries ?? {};
const increased = [];
const decreased = [];

for (const [key, n] of counts)
{
    const before = known[key] ?? 0;

    if (n > before) increased.push({ key, before, after: n });
}

for (const [key, before] of Object.entries(known))
{
    const after = counts.get(key) ?? 0;

    if (after < before) decreased.push({ key, before, after });
}

const knownTotal = Object.values(known).reduce((a, b) => a + b, 0);

if (increased.length > 0)
{
    const addCount = increased.reduce((a, v) => a + (v.after - v.before), 0);

    console.error(`❌ 模块顶层新增了「给引擎全局槽位赋值」（R2：import 不该改引擎全局装配）：${addCount} 处`);
    increased.forEach((v) => console.error(`  + ${v.key}  ${v.before} → ${v.after} 次`));
    console.error('\n修法：改成显式装配函数（`installXxx()`，由调用方在启动时调用一次），');
    console.error('     或把装配挪进函数体——模块顶层只做声明。');
    process.exit(1);
}

if (knownTotal === 0 && hits.length === 0)
{
    console.log('✅ 全局槽位写入：模块顶层没有给引擎全局槽位赋值（基线为空，新增即失败）');
}
else
{
    console.log(`✅ 全局槽位写入：模块顶层无新增（存量 ${knownTotal} 处冻结在基线，当前 ${hits.length} 处）`);
}

if (decreased.length > 0)
{
    const goneCount = decreased.reduce((a, v) => a + (v.before - v.after), 0);

    console.log(`   （有 ${goneCount} 处存量已清理，可以跑 --update 收紧基线：${decreased.slice(0, 5).map((v) => v.key).join('、')}${decreased.length > 5 ? ' …' : ''}）`);
}