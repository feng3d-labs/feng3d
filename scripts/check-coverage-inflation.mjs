#!/usr/bin/env node
/**
 * 覆盖率虚高检测（issue #645 方案 C）：登记「被间接 import、实际从未执行」的文件。
 *
 * ## 背景
 *
 * `vitest.config.ts` 的 `coverage.include`（把 `packages/<包>/src` 下全部 `.ts` 纳入）
 * 是「全量纳入」语义（没被任何测试触及的文件也进分母）。但实测发现：**只被其它模块间接 `import`、
 * 自身一行都没执行**的模块会被 vitest v8 provider 整份算成 100%。
 *
 * 后果是这张覆盖率表**只能上不能下**：给这些文件补一个真正会执行到代码的用例 →
 * 读数"跌"一大截（#640 把 `webgpu` 从 60.0 打到 40.1），看着像质量退步、其实是虚高消失。
 * 机制证据（`NODE_V8_COVERAGE` 原始数据准确、`ast-v8-to-istanbul` 的 `convert()` 也准确
 * ⇒ 失真在 vitest v8 provider 的 TS / sourcemap 映射链）见 issue #645 与 `docs/CI.md` §1.3 / §2.1。
 *
 * 本脚本做的是方案 C：**不动 `include` 语义、不动阈值**，只把「已知虚高文件」冻结成基线，
 * **新增即失败**——让「又有一个文件悄悄被算成 100%」变成可见。
 *
 * ## 判据（对 issue #645 原判据的改进）
 *
 * issue #645 用的判据是「**全部语句**计数全等、且**全部函数**计数也等于同一个数」。
 * 它有两个问题：① 命中大量纯 enum / 常量模块（100% 是真的，纯误报）；
 * ② 漏掉「语句计数已被 getter 访问打破、但函数计数仍被整份夸大」的文件
 * （#645 实测 `webgpu` 有 6 个：265 条语句躲过该判据）。
 *
 * 本脚本改用 **V4 判据**，直接盯住失真的本质——**函数计数**：
 *
 * > 一个文件的**全部函数计数完全相等**（记为 `N > 0`），且 `N` 等于该文件
 * > **「模块顶层语句」的计数**（即 `N` = 模块加载次数）。
 *
 * 为什么这样更准：
 *
 * - **真实执行的代码不可能这样**。v8 provider 失真时把「模块顶层块执行了 N 次」
 *   摊到该模块**每个函数**上，于是 `constructor` / `_onCreate` / getter 全被算作执行了 N 次；
 *   真执行时不同函数的调用次数几乎必然互不相同（实测 `math/src/geom/euler.ts` 是 5/6/7/15/16…）。
 * - **能抓 6 个漏网**。它们的语句计数被 getter 访问打破（如 `1/2/73` 三种值），
 *   但函数计数仍是 `73`（= 加载次数）⇒ 旧判据看不见、V4 看得见。
 * - **不再命中纯 enum / 常量**。这类模块被整份夸大**是正常的**（编译成模块级 IIFE，
 *   加载即全执行，100% 是真的），脚本按源码形态自动判为 `real-const` 并**不计入虚高清单**
 *   （但仍统计打印，见 `--list`）。
 * - **「模块顶层语句」不靠猜**：用 istanbul `fnMap[i].loc`（函数体范围）反选出
 *   **不在任何函数体内**的语句，其计数最大值就是加载次数。这条修正很关键——
 *   若拿「全部语句计数的最大值」当加载次数，会把 `MinMaxCurveVector3.ts`（`getValue` 真被调用 93 次）、
 *   `ParticleSystemShapeHemisphere.ts`（`calcParticlePosDir` 真被调用 300 次）、
 *   `editor/src/plugins/index.ts`（`installBuiltinPlugins` 真被调用 37 次）这类**真执行**的文件误报进来。
 *
 * ## 实测（2026-10-05，`origin/master` `69309811b`，678 个受统计文件）
 *
 * | 判据 | 命中 | 其中纯 enum / 常量（误报） |
 * |---|---|---|
 * | issue #645 原判据（语句全等 = 函数全等） | 32 | 27（84%） |
 * | **本脚本 V4（函数全等 = 顶层语句计数）** | **13** | **0** |
 *
 * V4 命中 13 个 / 448 条语句，**含 #645 点名的全部 6 个漏网文件**（`WGPUCanvasContext` /
 * `WGPURenderPassColorAttachment` / `WGPUTimestampQuery` / `WGPURenderBundle` /
 * `WGPUCanvasTexture` / `WGPUExternalTexture`，合计 265 条语句），并多抓到
 * `Keyboard.ts` / `webgpu/src/data/Texture.ts` / `webgpu/src/data/Buffer.ts` /
 * `WGPUBindGroupLayout.ts` 等同型文件。
 *
 * **已知残留**（有意不追求 100% 精确，方案 C 本就是「登记 + 复核」）：
 * ① 函数计数**不全等**、只有个别函数被夸大的文件（如 `WGPUTexture.ts` 的 `map` / `_writeTextures`）
 *    不命中——它不影响「整份 100%」的判断，只影响该文件的函数覆盖率读数；
 * ② `WindowEventProxy.ts`（2 条语句、1 个箭头函数）属边缘命中：它 100% 基本是真的，
 *    但箭头函数计数确实被算成加载次数（54），登记在基线里无害。
 *
 * ## 用法
 *
 * ```bash
 * npm run test:coverage                                     # 先产出 coverage/coverage-final.json
 * node scripts/check-coverage-inflation.mjs                 # 校验（= --check，CI 用）
 * node scripts/check-coverage-inflation.mjs --update        # 重写基线
 * node scripts/check-coverage-inflation.mjs --list          # 打印全部候选（含 real-const）
 * node scripts/check-coverage-inflation.mjs --stats         # 打印判据与统计
 * ```
 *
 * ## 为什么 `vitest.config.ts` 要加 `json` reporter
 *
 * 本判据要**逐语句、逐函数**的命中次数，原配置只有 `text-summary` + `json-summary`
 * （都只有汇总百分比），所以本批同时给 `coverage.reporter` 加了 `json`
 * （产物 `coverage/coverage-final.json`）。代价见 `vitest.config.ts` 里的注释：
 * 实测产物 **7.2 MB**（595 个文件）、序列化开销 < 1 s，相对整轮 `test:coverage` 可忽略；
 * 产物在 `coverage/`（`.gitignore` 已忽略）且 CI 不上传（issue #642）。
 *
 * ## 怎么进 CI 的（以及为什么不挂 `prelint:ci`）
 *
 * **`prelint:ci` 是错的接入点**：`ci.yml` 的质量门禁 job 第一步就是 `npm run lint:ci`，
 * 而覆盖率产物要到第 12 步 `npm run test:coverage` 才产生——挂在 `prelint:ci` 上，
 * CI 里它**永远**读不到产物、只能跳过，等于没有门禁（本地"先跑覆盖率再跑 lint"才会偶然生效）。
 * 所以本脚本挂在 **`test:coverage` 之后**（根 `package.json` 的
 * `"test:coverage": "vitest run --coverage && node scripts/check-coverage-inflation.mjs"`）：
 * 产物就在同一条命令里产生，CI 第 12 步天然会跑到它，**不需要改 `.github/workflows/`**
 * （本仓推送凭据没有 `workflow` scope，见 `AGENTS.md` §16 与 `docs/CI.md` §2.1）。
 * 等有 `workflow` scope 时，可把它提成紧跟第 12 步的独立步骤（脚本本身无需改动）。
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const COVERAGE = join(ROOT, 'coverage', 'coverage-final.json');
const BASELINE = join(ROOT, 'scripts', 'coverage-inflation-baseline.json');
const BASELINE_REL = 'scripts/coverage-inflation-baseline.json';

const args = process.argv.slice(2);
const update = args.includes('--update');
const list = args.includes('--list');
const stats = args.includes('--stats');

// ---------------------------------------------------------------------------
// 1. 判据
// ---------------------------------------------------------------------------

/**
 * 取一个 sourcemap 位置的"行尾列"。
 *
 * `coverage-final.json` 里 `end.column` 经常是 `null`（= 到行尾），直接参与比较会漏判，
 * 故统一折算成一个极大值。
 *
 * @param pos `{ line, column }`
 * @returns 列号（`null` 视为行尾）
 */
function endColumn(pos)
{
    return pos.column === null || pos.column === undefined ? Number.MAX_SAFE_INTEGER : pos.column;
}

/**
 * 判断位置 `pos` 是否落在范围 `loc` 内（闭区间）。
 *
 * @param loc `{ start, end }`
 * @param pos `{ line, column }`
 * @returns 是否包含
 */
function containsPos(loc, pos)
{
    if (loc.start.line > pos.line) return false;
    if (loc.start.line === pos.line && loc.start.column > (pos.column ?? 0)) return false;
    if (loc.end.line < pos.line) return false;
    if (loc.end.line === pos.line && endColumn(loc.end) < (pos.column ?? 0)) return false;

    return true;
}

/**
 * 判断源文件是否"常量 / 枚举形态"——即**加载即全执行**、100% 为真。
 *
 * 判据：删掉注释与 `import` 后，源码里没有任何可执行函数体
 * （`class` / `function` / 箭头函数 / getter-setter）。命中说明整个模块的代码
 * 都在模块顶层（enum 编译产物、`export *` 桶、纯字面量常量表），
 * 这类文件的"所有计数都等于加载次数"是**真实**的，不是虚高。
 *
 * @param file 绝对路径
 * @returns 是否常量 / 枚举形态
 */
function isConstOnlySource(file)
{
    let code;

    try
    {
        code = readFileSync(file, 'utf8');
    }
    catch
    {
        return false;
    }

    const body = code
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/\/\/[^\n]*/g, ' ')
        .replace(/^import[\s\S]*?from\s+'[^']*';$/gm, ' ')
        .replace(/^import\s+'[^']*';$/gm, ' ');

    return !/\bclass\b|\bfunction\b|=>|\bget\s+[A-Za-z_$]|\bset\s+[A-Za-z_$]/.test(body);
}

/**
 * 从 `coverage-final.json` 的一个条目里读出判据所需的数据。
 *
 * @param data istanbul 覆盖数据
 * @returns 解析结果；无法判定时返回 `null`
 */
function analyse(data)
{
    const statementMap = data.statementMap ?? {};
    const fnMap = data.fnMap ?? {};
    const s = data.s ?? {};
    const f = data.f ?? {};

    const fnValues = Object.values(f);

    // 判据第一步：必须有函数，且**全部函数计数完全相等**
    if (fnValues.length === 0) return null;

    const uniqueFn = [...new Set(fnValues)];

    if (uniqueFn.length !== 1 || uniqueFn[0] <= 0) return null;

    const loadCount = uniqueFn[0];
    const fnRanges = Object.values(fnMap).filter((fn) => fn.loc !== undefined).map((fn) => fn.loc);

    // 没有任何函数的函数体范围时无法反选"模块顶层语句"，放弃判定（避免把全部语句当顶层而误报）
    if (fnRanges.length === 0) return null;

    const statements = Object.entries(statementMap).map(([key, loc]) => ({ loc, count: s[key] }));
    const topLevel = statements.filter((st) => !fnRanges.some((range) => containsPos(range, st.loc.start)));

    if (topLevel.length === 0) return null;

    // 判据第二步：加载次数 == 模块顶层语句的最大计数
    if (Math.max(...topLevel.map((st) => st.count)) !== loadCount) return null;

    return {
        statements: statements.length,
        coveredStatements: statements.filter((st) => st.count > 0).length,
        functions: fnValues.length,
        loadCount,
        topLevelStatements: topLevel.length,
    };
}

// ---------------------------------------------------------------------------
// 2. 扫描
// ---------------------------------------------------------------------------

/**
 * 扫描覆盖率产物，返回按文件分类的结果。
 *
 * @returns `{ candidates, realConst, files }`
 */
function scan()
{
    if (!existsSync(COVERAGE))
    {
        console.error(`❌ 读不到 coverage/coverage-final.json：请先跑 \`npm run test:coverage\`（它含 json reporter）。`);
        process.exit(2);
    }

    const json = JSON.parse(readFileSync(COVERAGE, 'utf8'));
    const candidates = [];
    const realConst = [];
    let files = 0;

    for (const [absPath, data] of Object.entries(json))
    {
        const normalized = absPath.replace(/\\/g, '/');
        const marker = normalized.lastIndexOf('/packages/');

        if (marker === -1) continue;

        const rel = normalized.slice(marker + 1);

        // 只认 packages/<包>/src/ 下的源码（与 vitest.config.ts 的 include 一致）
        if (!/^packages\/[^/]+\/src\//.test(rel)) continue;

        files += 1;

        const parsed = analyse(data);

        if (parsed === null) continue;

        const pkg = rel.split('/')[1];
        const verdict = isConstOnlySource(join(ROOT, rel)) ? 'real-const' : 'inflated';
        const item = { rel, pkg, ...parsed, verdict };

        (verdict === 'inflated' ? candidates : realConst).push(item);
    }

    candidates.sort((a, b) => bw(a) - bw(b) || a.rel.localeCompare(b.rel));
    realConst.sort((a, b) => bw(a) - bw(b) || a.rel.localeCompare(b.rel));

    return { candidates, realConst, files };
}

/** 排序权重：先按语句数降序（重的排前面） */
function bw(item)
{
    return -item.statements;
}

/** 按包分组 */
function groupByPackage(items)
{
    const groups = new Map();

    for (const item of items)
    {
        const bucket = groups.get(item.pkg) ?? [];

        bucket.push(item);
        groups.set(item.pkg, bucket);
    }

    return [...groups].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
}

// ---------------------------------------------------------------------------
// 3. 主流程
// ---------------------------------------------------------------------------

const { candidates, realConst, files } = scan();
const totalStatements = candidates.reduce((sum, item) => sum + item.statements, 0);

if (stats)
{
    console.log('判据（V4，issue #645 方案 C）：');
    console.log('  一个文件的**全部函数计数完全相等**（= N > 0），且 N 等于该文件「模块顶层语句」的计数（= 模块加载次数）。');
    console.log('  「模块顶层语句」= 不在任何 fnMap.loc（函数体范围）内的语句；其计数最大值即加载次数。');
    console.log('  源码为常量 / 枚举形态（无 class / function / 箭头函数 / getter-setter）时判为 `real-const`——');
    console.log('  这类模块加载即全执行，100% 是真的，不计入虚高清单。');
    console.log('');
    console.log(`受统计文件：${files} 个`);
    console.log(`虚高候选（inflated）：${candidates.length} 个 / ${totalStatements} 条语句`);
    console.log(`判为真 100%（real-const）：${realConst.length} 个 / ${realConst.reduce((sum, item) => sum + item.statements, 0)} 条语句`);
    process.exit(0);
}

if (list)
{
    console.log(`=== 虚高候选（inflated，${candidates.length} 个 / ${totalStatements} 条语句）===`);

    for (const [pkg, items] of groupByPackage(candidates))
    {
        console.log(`\n[${pkg}] ${items.length} 个 / ${items.reduce((sum, item) => sum + item.statements, 0)} 条语句`);

        for (const item of items)
        {
            console.log(`  ${item.rel}  语句 ${item.coveredStatements}/${item.statements}  函数 ${item.functions}  加载次数 ${item.loadCount}`);
        }
    }

    console.log(`\n=== 判为真 100%（real-const，${realConst.length} 个）===`);
    realConst.forEach((item) => console.log(`  ${item.rel}  语句 ${item.statements}  加载次数 ${item.loadCount}`));
    process.exit(0);
}

if (update)
{
    const entries = {};

    for (const item of candidates)
    {
        entries[item.rel] = {
            statements: item.statements,
            coveredStatements: item.coveredStatements,
            functions: item.functions,
            loadCount: item.loadCount,
            note: '函数计数被整份算成模块加载次数（vitest v8 provider 的映射失真），该文件读数不可信',
        };
    }

    const baseline = {
        note: `覆盖率虚高文件基线（issue #645 方案 C，2026-10-05 在 origin/master 69309811b 上登记）：只登记判据命中且**源码含可执行体**的文件（inflated）。判据见 scripts/check-coverage-inflation.mjs 头部注释：文件的全部函数计数完全相等（= N），且 N 等于该文件「模块顶层语句」的计数（= 模块加载次数）。纯 enum / 常量模块（real-const）**有意不登记**——它们加载即全执行、100% 是真的。新增 inflated 条目即失败；修好一个（补齐测试使其真执行）后跑 --update 收紧基线。`,
        criteria: 'all-function-counts-equal && equals-top-level-statement-count && !const-only-source',
        entries,
    };

    writeFileSync(BASELINE, `${JSON.stringify(baseline, null, 4)}\n`, 'utf8');
    console.log(`✅ 已写入基线 ${BASELINE_REL}（${Object.keys(entries).length} 个文件 / ${totalStatements} 条语句）`);
    process.exit(0);
}

// 默认（以及显式 --check）：与基线比对
if (!existsSync(BASELINE))
{
    console.error(`❌ 读不到基线 ${BASELINE_REL}：先跑一次 \`node scripts/check-coverage-inflation.mjs --update\` 并提交进仓库`);
    process.exit(1);
}

const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
const known = baseline.entries ?? {};
const current = new Map(candidates.map((item) => [item.rel, item]));

const added = candidates.filter((item) => known[item.rel] === undefined);
const fixed = Object.keys(known).filter((rel) => !current.has(rel));
const changed = candidates.filter((item) =>
{
    const before = known[item.rel];

    return before !== undefined
        && (before.statements !== item.statements
            || before.functions !== item.functions
            || before.loadCount !== item.loadCount
            || before.coveredStatements !== item.coveredStatements);
});

console.log(`覆盖率虚高检测（issue #645 方案 C）：受统计文件 ${files} 个；`
    + `虚高候选 ${candidates.length} 个 / ${totalStatements} 条语句（基线冻结 ${Object.keys(known).length} 个；`
    + `另有 real-const ${realConst.length} 个不计入）`);

if (added.length > 0)
{
    console.error(`\n❌ 新增了「覆盖率虚高」文件：${added.length} 个 / ${added.reduce((sum, item) => sum + item.statements, 0)} 条语句`);
    console.error('   它们的全部函数计数完全相等，且等于模块加载次数——真实执行的代码不会长这样，');
    console.error('   即：该文件被别的模块间接 import 了，但自身一行都没被执行，却被整份算成 100%。');
    console.error('');

    for (const item of added)
    {
        console.error(`   + ${item.rel}  语句 ${item.coveredStatements}/${item.statements}  函数 ${item.functions}  加载次数 ${item.loadCount}`);
    }

    console.error('');
    console.error('修法（三选一）：① 给它补一个真正会执行到代码的用例（推荐，读数会「跌」但那是虚高消失）；');
    console.error('              ② 若它确实是常量 / 枚举形态，检查是否被误判（见脚本 --stats 的判据说明）；');
    console.error('              ③ 若确认是已存在的虚高、本批不处理，跑 --update 把它登记进基线（会冻结虚高，需在 PR 里说明理由）。');
    process.exit(1);
}

if (fixed.length > 0)
{
    console.log(`\nℹ 基线里这 ${fixed.length} 个文件已不再命中判据（多半是补齐测试、虚高消失——好事）：`);
    fixed.slice(0, 10).forEach((rel) => console.log(`   - ${rel}`));
    if (fixed.length > 10) console.log(`   … 另 ${fixed.length - 10} 个`);
    console.log('   若确认是真实进步，跑 --update 收紧基线。');
}

if (changed.length > 0)
{
    console.log(`\nℹ 基线里这 ${changed.length} 个文件的读数变了（请复核是否为正常增长）：`);

    for (const item of changed)
    {
        const before = known[item.rel];

        console.log(`   ~ ${item.rel}  语句覆盖 ${before.coveredStatements}/${before.statements} → ${item.coveredStatements}/${item.statements}`
            + `  函数 ${before.functions} → ${item.functions}  加载次数 ${before.loadCount} → ${item.loadCount}`);
    }
}

console.log(`\n✅ 没有新增覆盖率虚高文件（基线 ${Object.keys(known).length} 个已冻结，当前命中 ${candidates.length} 个）`);
