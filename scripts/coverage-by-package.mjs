#!/usr/bin/env node
/**
 * 按包汇总覆盖率（issue #367）。
 *
 * `vitest.config.ts` 的 `json-summary` reporter 产出 `coverage/coverage-summary.json`，
 * 但它的 key 是**绝对路径**（Windows 上是 `C:\...\packages\addons\src\index.ts`），
 * 所以要先归一化分隔符再按 `packages/<包名>/` 聚合。
 *
 * 用法：
 *   node scripts/coverage-by-package.mjs            # 打印 Markdown 表格
 *   node scripts/coverage-by-package.mjs --check     # 与 docs/CI.md §1.3 的表比对，不一致则非零退出
 *
 * `--check` 比对三部分（issue #667 收尾把第三部分补上）：
 *   - 分包**行覆盖率**：留 ±0.5 个百分点容差（环境差异，见 TOLERANCE 注释）；
 *   - 分包**文件数**（`已覆盖/总数`）：**漂移只警告、不阻塞**（见 {@link drifts} 的注释）；
 *     但**写歪了解析不出来**仍是失败（那是文档坏了，不是漂移）；
 *   - **全局阈值表**（§1.3 的「指标 | 阈值 | 实测基线 | 余量」4 行）：实测基线留
 *     {@link TOLERANCE} 容差，**阈值列与 `vitest.config.ts` 的 `coverage.thresholds`**
 *     **精确比对**（防「阈值改了、文档没改」）。
 *
 * 文件数为什么要进 `--check`（issue #134 A3 收尾批）：这一列原先"只供人看"，
 * 结果 math 从 `67/76` 一路漂到 `70/79` 而**没有任何门禁发现**——是 A3 的子代理
 * 人工比对时才察觉的。文件数随新增文件跳变确实比百分比频繁，但它跳变时**必然**
 * 有人加了文件（正常情况会连带同步文档），所以"不一致"几乎总是文档腐化而非环境抖动。
 * 注意：覆盖率有约 ±0.1 个百分点的跑动（issue #356 实测过），所以只有行覆盖率留容差。
 *
 * **2026-10-05（issue #731，方向 B）修订**：文件列的漂移**降级为警告**。理由是"文档腐化"
 * 与"代码坏了"是两类事 —— #731 记录的 4 次 rebase 全部是前者（别人加文件没同步表），
 * 而后者（某个文件被漏测）由**行覆盖率那一列**抓得住（少覆盖一个文件，跌幅通常远超 0.5）。
 * 继续把前者当失败，只会让人反复为"与本次改动无关的原因"重跑覆盖率与解冲突。
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SUMMARY = join(ROOT, 'coverage', 'coverage-summary.json');
const CI_DOC = join(ROOT, 'docs', 'CI.md');
const VITEST_CONFIG = join(ROOT, 'vitest.config.ts');

/**
 * 比对容差（百分点）。
 *
 * 本机同一环境下两次跑的差异在 ±0.1 量级，但 **CI 与本机之间还可能有额外差异**，
 * 所以接进 CI（issue #369）时把它从 0.11 放宽到 0.5。
 *
 * ⚠️ 这个容差是为了**容忍环境差异**，不是为了容忍文档腐化——它仍能抓住
 * `particlesystem` 那种 25.3 → 0.1 量级的偏差，那才是这张表要防的事。
 * **不要再把它继续放大**；若 CI 上真的差得超过它，正确做法是把这条检查降级为
 * 非阻塞提示并说明原因，而不是放宽到它永远不报。
 */
const TOLERANCE = 0.5;

/**
 * 逐包放宽的容差（百分点）。
 *
 * 默认容差（{@link TOLERANCE} = 0.5）挡不住**同一份被测代码在 CI 上 run-to-run 的摆动**时，
 * 就在这里按包登记一个实测的摆动幅度。**登记门槛：给出实测证据**（同一个 commit 的多次 run
 * 读数、以及本机读数），并在注释里写明证据来源；**不许**拿它当"测试没过"的逃生口。
 *
 * `feng3d`：2026-10-05（`@feng3d/ui` 四批迁移批）实测——**同一个 commit（`48531998b`…`65ec0bc89`，
 * 两者被测代码完全相同、只差两个文档/脚本文件）的两次 CI run 分别给出 66.4 与 67.1**
 * （run `37256357717` = 66.4、run `37256948216` = 67.1），本机连续多轮稳定 **67.1**；
 * 两次 run 都是 246 个测试文件 / 2805 个用例全过、分母完全相同（92/108 文件）。
 * 也就是说：**CI 上这个包的读数在 66.4 ~ 67.1 之间摆（0.7），本机读的是上限**。
 * 该摆动疑似来自 `@feng3d/ui` 的测试所触达的那批 feng3d 文件里的**时序敏感路径**
 * （帧驱动 / effect 调度：只跑 `packages/feng3d/src` 的测试时 feng3d 是 57.6% / 70 文件，
 * ui 的测试把它抬到 67.1% / 92 文件），**未逐行定位**，已在 issue #642 记录。
 * 故本包单独放宽到 **0.8**（覆盖 0.7 的摆动 + 0.1 的常规抖动）；**摆动消除后应收回本行**。
 */
const PACKAGE_TOLERANCES = new Map([
    ['feng3d', 0.8],
]);

/** 取某个包的比对容差（未登记的用默认 {@link TOLERANCE}） */
function toleranceOf(name)
{
    return PACKAGE_TOLERANCES.get(name) ?? TOLERANCE;
}

/**
 * 解析文档表格「文件」列的 `已覆盖/总数`（如 `70/79`）。
 *
 * 不是这个形式就返回 `null` —— 调用方会把它当成一条 problem 报出来，
 * **不静默放过**（否则一个写歪的单元格就能让该包逃过文件数校验）。
 */
function parseFileCell(cell)
{
    const matched = /^(\d+)\s*\/\s*(\d+)$/.exec(cell.trim());

    return matched === null ? null : { covered: Number(matched[1]), total: Number(matched[2]) };
}

/**
 * docs/CI.md §1.3 **全局阈值表**的表头（「指标 | 阈值 | 实测基线 | 余量」）。
 *
 * 用表头唯一定位这张表，而不是按行内容匹配——文档里还有别的表可能以「语句」之类开头。
 */
const GLOBAL_TABLE_HEADER = /^\|\s*指标\s*\|\s*阈值\s*\|/;

/** 全局阈值表的指标名 → `coverage-summary.json` 的 `total` 字段 */
const GLOBAL_METRIC_KEYS = new Map([
    ['语句', 'statements'],
    ['分支', 'branches'],
    ['函数', 'functions'],
    ['行', 'lines'],
]);

/**
 * 解析 docs/CI.md §1.3 的**全局阈值表**（4 行：语句 / 分支 / 函数 / 行）。
 *
 * 这张表此前「至今没有任何门禁校验」（文档原话），issue #667 收尾把它纳入 `--check`。
 *
 * 解析不到表头、行数不足 4、或某一行的「实测基线」不是 `xx.xx%` 形式时返回 `null`
 * ——调用方把它当成一条 problem 报出来，**不静默放过**（否则一个写歪的单元格就能让整张表逃过校验）。
 *
 * @param doc docs/CI.md 全文
 * @returns `{ metric, threshold, baseline }[]` 或 `null`
 */
function parseGlobalThresholdRows(doc)
{
    const lines = doc.split('\n');
    const header = lines.findIndex((line) => GLOBAL_TABLE_HEADER.test(line));

    if (header === -1) return null;

    const out = [];

    // header + 1 是 `|---|---|---|---|` 分隔行，之后逐行读指标
    for (let i = header + 2; i < lines.length && out.length < 4; i++)
    {
        const cells = lines[i].split('|').map((cell) => cell.trim());

        // 4 列表格行 split 后是 6 段（首尾各一个空串）；空行或结构变了就停
        if (cells.length < 6) break;

        const pct = /^([\d.]+)%/.exec(cells[3]);

        if (pct === null) return null;

        out.push({ metric: cells[1], threshold: Number(cells[2]), baseline: Number(pct[1]) });
    }

    return out.length === 4 ? out : null;
}

/**
 * 解析 `vitest.config.ts` 的 `coverage.thresholds`（4 项整数）。
 *
 * 文档阈值表的阈值列必须与它一致——否则「阈值改了、文档没改」这类腐化仍然要靠人眼看出来。
 * 解析不到时返回 `null`（调用方报 problem，不静默）。
 *
 * @param text vitest.config.ts 全文
 * @returns 形如 `{ statements, branches, functions, lines }` 或 `null`
 */
function parseConfigThresholds(text)
{
    const block = /thresholds:\s*\{([\s\S]*?)\}/.exec(text);

    if (block === null) return null;

    const out = {};

    for (const matched of block[1].matchAll(/(statements|branches|functions|lines)\s*:\s*(\d+)/g))
    {
        out[matched[1]] = Number(matched[2]);
    }

    return Object.keys(out).length === 4 ? out : null;
}

/**
 * {@link parseGlobalThresholdRows} 的合成样例自检。
 *
 * 判据写歪（正则改坏、表结构假设变化）时，真文档照样能被「解析出 0 行然后跳过」——
 * 与 `scripts/r2-module-scope.mjs` 的自检同一个道理：**启动时先跑，失败即退出**。
 */
function selfCheckGlobalTableParser()
{
    const sample = [
        '| 指标 | 阈值 | 实测基线（某某批） | 余量 |',
        '|---|---|---|---|',
        '| 语句 | 52 | 54.69%（18398/33638） | 2.69 |',
        '| 分支 | 42 | 44.56%（6706/15046） | 2.56 |',
        '| 函数 | 49 | 51.56%（2971/5762） | 2.56 |',
        '| 行 | 52 | 54.65%（16403/30012） | 2.65 |',
    ].join('\n');
    const parsed = parseGlobalThresholdRows(sample);

    if (parsed === null
        || parsed.length !== 4
        || parsed[0].metric !== '语句'
        || parsed[3].metric !== '行'
        || parsed[3].baseline !== 54.65
        || parsed[0].threshold !== 52)
    {
        console.error('❌ coverage-by-package 的全局阈值表解析自检未通过（parseGlobalThresholdRows 被改坏？）');
        process.exit(1);
    }
}

/**
 * 已查明的**真实平台差异**（行覆盖率）。
 *
 * `path` 包里有路径分隔符相关的分支：Windows 本地走一条、Linux CI 走另一条，
 * 于是同一份代码本地 90.9 / CI 90.2（差 0.7，超出 TOLERANCE）。这不是文档腐化，
 * 所以**不能**靠"按本地读数改文档"来消掉——那样 CI 上会反过来报错。
 *
 * 登记后的行为：
 *   - **非 CI 环境**：跳过该包的本地行覆盖率比对，但一定打印一行提示（不静默），
 *     并要求文档写的是登记在案的 CI 值（写歪了照样失败）；
 *   - **CI 环境**（`process.env.CI`）：照常比对，文档必须与 CI 实测一致；
 *   - **文件数永不豁免**：它与平台无关。
 *
 * ⚠️ 这里只登记**已查明原因**的平台差异，不许拿它当"测试没过"的逃生口。
 * 详见 docs/CI.md §1.3 表下方的说明。
 */
const PLATFORM_DIFFS = new Map([
    ['path', { ci: 90.2 }],
]);

/** 从 coverage-summary.json 按包聚合（按行数加权，不用"平均百分比"——那是错的算法） */
function collectByPackage()
{
    let json;
    try
    {
        json = JSON.parse(readFileSync(SUMMARY, 'utf8'));
    }
    catch
    {
        throw new Error(`读不到 ${SUMMARY}，请先跑 \`npm run test:coverage\``);
    }

    const byPackage = new Map();

    for (const [path, metrics] of Object.entries(json))
    {
        if (path === 'total') continue;

        // key 是绝对路径且用平台分隔符（Windows 上是反斜杠），先归一化
        const normalized = path.replace(/\\/g, '/');
        const matched = normalized.match(/\/packages\/([^/]+)\//);

        if (!matched) continue;

        const name = matched[1];
        const entry = byPackage.get(name) ?? {
            statements: [0, 0], branches: [0, 0], functions: [0, 0], lines: [0, 0],
            files: 0, coveredFiles: 0,
        };

        // 「文件覆盖」这一列是本脚本自己对每个条的判断：该文件有任何一行被命中即算"有覆盖"。
        // 加它的原因（issue #371）：只看百分比分不出"0.1% 因为整包只测了 1 个文件"和
        // "0.1% 因为测试被 exclude 了"——前者要补测试，后者是配置 bug，应对完全不同。
        //
        // ✅ **issue #667 之后这一列已可信**：此前它**高估**覆盖文件数——只被其它模块间接
        // `import`、自身一行都没执行的模块会被 v8 provider 整份算成 100%（`lines.covered > 0`
        // 必然为真），实测 `webgpu` 的 `58/132` 里有 9 个是虚高文件。issue #667 修掉了根因
        // （内置 v8 provider 跨 worker 合并 V8 coverage 时丢函数条目，见
        // `scripts/vitest-v8-coverage-provider.mjs`），那些文件现在按真实覆盖参与判断：
        // `webgpu` 的文件数仍是 `58/132`，但原因是 `WGPURenderPassColorAttachment.ts` 这类文件
        // **确实有 3 条顶层语句被执行**，不是虚高。
        //
        // 仍然**不**用 `scripts/check-coverage-inflation.mjs` 的判据替换它：
        //   ① 本脚本只读 `coverage-summary.json`（汇总百分比）；判"当前是否仍虚高"必须额外读
        //      `coverage-final.json`（逐语句逐函数明细），会把这条轻量脚本变重；
        //   ② 基线里的文件**不等于**"当前仍虚高"（补了测试后它仍在基线里，直到 `--update` 收紧），
        //      直接拿基线去扣除会反向出错。
        // 函数级失真（含修复后残留的 5 个「函数计数被夸大、语句真实」文件）由
        // `scripts/check-coverage-inflation.mjs`（随 `test:coverage` 进 CI）独立守住，
        // 它的 `--list` 输出可与本表对照阅读。
        entry.files += 1;
        if (metrics.lines.covered > 0) entry.coveredFiles += 1;

        for (const key of ['statements', 'branches', 'functions', 'lines'])
        {
            entry[key][0] += metrics[key].covered;
            entry[key][1] += metrics[key].total;
        }

        byPackage.set(name, entry);
    }

    const rows = [];
    for (const [name, entry] of byPackage)
    {
        const pct = (pair) => (pair[1] === 0 ? 0 : (pair[0] * 100) / pair[1]);
        rows.push({
            name,
            files: entry.files,
            coveredFiles: entry.coveredFiles,
            statements: pct(entry.statements),
            branches: pct(entry.branches),
            functions: pct(entry.functions),
            lines: pct(entry.lines),
            linesTotal: entry.lines[1],
        });
    }

    // 按行覆盖率降序（与 §1.3 原表的"分档"意图一致：一眼看出谁高谁低）
    rows.sort((a, b) => b.lines - a.lines);

    return { rows, total: json.total, jsonEntries: Object.keys(json).filter((k) => k !== 'total').length };
}

const { rows, total, jsonEntries } = collectByPackage();
const fmt = (n) => `${n.toFixed(1)}`;

const table = [
    '| 包 | 行 | 文件 | 语句 | 分支 | 函数 |',
    '|---|---|---|---|---|---|',
    ...rows.map((r) => `| \`${r.name}\` | ${fmt(r.lines)} | ${r.coveredFiles}/${r.files} | ${fmt(r.statements)} | ${fmt(r.branches)} | ${fmt(r.functions)} |`),
].join('\n');

// 按行覆盖率分档（沿用 §1.3 原来的三档切法）
const bands = (min, max) => rows.filter((r) => r.lines >= min && r.lines < max)
    .map((r) => `\`${r.name}\` ${fmt(r.lines)}（文件 ${r.coveredFiles}/${r.files}）`).join(' / ');

console.log(table);
console.log('');
console.log('各包（按行覆盖率）：');
console.log(`- 已过 60%：${bands(60, Infinity) || '（无）'}`);
console.log(`- 30%~60%：${bands(30, 60) || '（无）'}`);
console.log(`- 30% 以下：${bands(0, 30) || '（无）'}`);
console.log('');
console.log(`全局（coverage-summary 的 total）：语句 ${fmt(total.statements.pct)} / 分支 ${fmt(total.branches.pct)} / 函数 ${fmt(total.functions.pct)} / 行 ${fmt(total.lines.pct)}`);

// 把"各包之和"与 total 对一下：这条能抓住"把 total 当成某个包"或漏包
{
    // 自检之一：各包文件数之和必须等于 json 里的**非 total 条目数**
    const sumFiles = rows.reduce((s, r) => s + r.files, 0);
    if (sumFiles !== jsonEntries)
    {
        console.log(`\n⚠ 各包文件数之和 ${sumFiles} 与 json 条目数 ${jsonEntries} 不等，聚合可能漏包或重复计数`);
    }

    const sumLines = rows.reduce((s, r) => s + r.linesTotal, 0);
    const diff = Math.abs(sumLines - total.lines.total) / total.lines.total;

    if (diff > 0.02)
    {
        console.log(`\n⚠ 各包行总数 ${sumLines} 与全局 ${total.lines.total} 差 ${(diff * 100).toFixed(1)}%，聚合可能漏包或多算`);
    }
}

if (process.argv.includes('--check'))
{
    selfCheckGlobalTableParser();

    // 从 docs/CI.md §1.3 的表里抓 `| `包名` | 行 | 文件 | 语句 | 分支 | 函数 |`，逐包比对**行**与**文件数**
    const doc = readFileSync(CI_DOC, 'utf8');
    // 只认**本表**的行：它每行 6 列（包 / 行 / 文件 / 语句 / 分支 / 函数），
    // 这样不会抓到 §6 等其它表格（那里也有形如 | \`包名\` | 数字 | 的行，会把 feng3d-editor 之类误算进来）
    const found = [...doc.matchAll(/^\|\s*`([a-z0-9-]+)`\s*\|\s*([\d.]+)\s*\|\s*([^|]+?)\s*\|\s*[\d.]+\s*\|\s*[\d.]+\s*\|\s*[\d.]+\s*\|/gm)]
        .map((m) => ({ name: m[1], lines: Number(m[2]), files: parseFileCell(m[3]) }));
    const docMap = new Map(found.map((f) => [f.name, f]));

    if (docMap.size === 0)
    {
        console.error('❌ 在 docs/CI.md 里没找到按包的分档表（期望形如 `| `包名` | 40.1 | 8/10 | ...`）');
        process.exit(1);
    }

    /** **失败**类：真信号（行覆盖率 / 阈值 / 结构问题） */
    const problems = [];
    /**
     * **漂移**类：文件列与文档不一致 —— **只警告、不阻塞**（issue #731 方向 B）。
     *
     * 为什么单独一类而不是塞进 `problems`：它必然是"有人加了文件、没同步这张表"，
     * 与"代码有问题"无关；继续当失败会让每个 PR 都为别人的改动重跑覆盖率、解同一处冲突
     *（#731 记了 4 次）。而"文件被漏测"这个真问题由行覆盖率那列抓。
     */
    const drifts = [];
    const notes = [];

    for (const r of rows)
    {
        const inDoc = docMap.get(r.name);

        if (inDoc === undefined)
        {
            problems.push(`${r.name}：实测有，文档里没有`);
            continue;
        }

        const platformDiff = PLATFORM_DIFFS.get(r.name);

        if (platformDiff !== undefined && !process.env.CI)
        {
            // 本地与 CI 走的是不同的平台分支，本地读数不参与比对；
            // 但文档必须写登记在案的 CI 值——否则这个包就彻底没人管了
            if (Math.abs(inDoc.lines - platformDiff.ci) > 0.05)
            {
                problems.push(`${r.name}：文档 ${inDoc.lines}，应为登记的平台差异 CI 值 ${platformDiff.ci}`);
            }
            else
            {
                notes.push(`${r.name}：本地 ${fmt(r.lines)} / CI ${platformDiff.ci}——已登记的平台差异，本地跳过行覆盖率比对（文件数照常比对）`);
            }
        }
        else if (Math.abs(inDoc.lines - r.lines) > toleranceOf(r.name))
        {
            problems.push(`${r.name}：文档 ${inDoc.lines}，实测 ${fmt(r.lines)}（差 ${Math.abs(inDoc.lines - r.lines).toFixed(1)}，容差 ${toleranceOf(r.name)}）`);
        }

        // **解析不出来 → 失败**：一个写歪的单元格会让这个包静默逃过校验，那是文档坏了。
        if (inDoc.files === null)
        {
            problems.push(`${r.name}：文档的文件列不是 \`已覆盖/总数\` 形式，无法校验（实测 ${r.coveredFiles}/${r.files}）`);
        }
        // **漂移 → 只警告**（issue #731 方向 B）：这必然是"有人加了文件、没同步这张表"——
        // 与"代码坏了"无关，而后者（文件被漏测）由行覆盖率那列抓。
        else if (inDoc.files.covered !== r.coveredFiles || inDoc.files.total !== r.files)
        {
            drifts.push(`${r.name}：文件列 文档 ${inDoc.files.covered}/${inDoc.files.total}，实测 ${r.coveredFiles}/${r.files}`);
        }
    }

    for (const name of docMap.keys())
    {
        if (!rows.some((r) => r.name === name)) problems.push(`${name}：文档里有，实测没有`);
    }

    // ---- 全局阈值表（issue #667 收尾纳入）----
    let configThresholds;

    try
    {
        configThresholds = parseConfigThresholds(readFileSync(VITEST_CONFIG, 'utf8'));
    }
    catch
    {
        configThresholds = null;
    }

    const globalRows = parseGlobalThresholdRows(doc);

    if (globalRows === null)
    {
        problems.push('docs/CI.md §1.3 的全局阈值表（`| 指标 | 阈值 | 实测基线 | 余量 |`）解析失败：表头缺失、行数不足 4、或「实测基线」不是 `xx.xx%` 形式');
    }
    else if (configThresholds === null)
    {
        problems.push('vitest.config.ts 的 `coverage.thresholds` 解析失败（期望 4 项整数）');
    }
    else
    {
        for (const row of globalRows)
        {
            const key = GLOBAL_METRIC_KEYS.get(row.metric);

            if (key === undefined)
            {
                problems.push(`全局阈值表出现未知指标「${row.metric}」`);
                continue;
            }

            if (row.threshold !== configThresholds[key])
            {
                problems.push(`全局「${row.metric}」阈值：文档 ${row.threshold}，vitest.config.ts ${configThresholds[key]}`);
            }

            const actual = total[key].pct;

            if (Math.abs(row.baseline - actual) > TOLERANCE)
            {
                problems.push(`全局「${row.metric}」实测基线：文档 ${row.baseline}，实测 ${fmt(actual)}（差 ${Math.abs(row.baseline - actual).toFixed(2)}，容差 ${TOLERANCE}）`);
            }
        }
    }

    if (problems.length > 0)
    {
        console.error(`\n❌ 覆盖率与 docs/CI.md §1.3 不一致（分包行覆盖率容差默认 ${TOLERANCE}，逐包放宽见 PACKAGE_TOLERANCES；全局阈值精确比对；文件列漂移只警告、不进这里）：`);
        problems.forEach((p) => console.error(`  · ${p}`));
        process.exit(1);
    }

    // **漂移警告**（issue #731 方向 B）：可见、但不阻塞。
    // 放在这里而不是塞进 `problems`：它们不是"门禁失败"，而是"这张表该同步了"。
    if (drifts.length > 0)
    {
        // **用 stdout 而不是 stderr**：它是提示、不是错误 —— 而 `--check` 此时退出码是 0，
        // 打到 stderr 会让它落在"错误流"里（翻转验证正是这么发现原来那版的）。
        console.log(`\n⚠ 文档的文件列有 ${drifts.length} 处漂移（**不阻塞**：必然是有人加了文件没同步这张表；`
            + `真正的漏测由行覆盖率那一列抓，issue #731 方向 B）：`);
        drifts.forEach((one) => console.log(`  · ${one}`));
        console.log('  建议顺手更新 `docs/CI.md` §1.3（本机跑 `node scripts/coverage-by-package.mjs` 可打印整表）');
    }

    // 被跳过的比对照样说清楚，不静默（否则"绿"得让人以为这一行也验过了）
    notes.forEach((n) => console.log(`ℹ ${n}`));

    console.log(`\n✅ 覆盖率与 docs/CI.md §1.3 一致（${rows.length} 个包的行 + 文件数，加全局 4 项实测基线与阈值；行覆盖率容差默认 ${TOLERANCE}（逐包放宽见 PACKAGE_TOLERANCES）；全局阈值精确比对；**文件列漂移只警告、不阻塞**（issue #731 方向 B））`);
}