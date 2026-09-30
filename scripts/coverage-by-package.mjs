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
 * 注意：覆盖率有约 ±0.1 个百分点的跑动（issue #356 实测过），所以比对留了容差。
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SUMMARY = join(ROOT, 'coverage', 'coverage-summary.json');
const CI_DOC = join(ROOT, 'docs', 'CI.md');

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
    // 从 docs/CI.md §1.3 的表里抓 `| `包名` | 行 | ...`，逐包比对
    const doc = readFileSync(CI_DOC, 'utf8');
    // 只认**本表**的行：它是文档里唯一的 6 列表（包 / 行 / 文件 / 语句 / 分支 / 函数），
    // 这样不会抓到 §6 等其它表格（那里也有形如 | \`包名\` | 数字 | 的行，会把 feng3d-editor 之类误算进来）
    //
    // 注意：`--check` **只比行覆盖率**，不比「文件」列 —— 文件数是整数且会随新增文件跳变
    // （新增一个未测文件就会变），比百分比脆得多，拿来当门禁会频繁误报。它只供人看。
    // 原描述：只认本表独有的 5 列（包 / 行 / 语句 / 分支 / 函数），
    // 这样不会抓到 §6 等其它表格（那里也有形如 | \`包名\` | 数字 | 的行，会把 feng3d-editor 之类误算进来）
    const found = [...doc.matchAll(/^\|\s*`([a-z0-9-]+)`\s*\|\s*([\d.]+)\s*\|[^|]*\|\s*[\d.]+\s*\|\s*[\d.]+\s*\|\s*[\d.]+\s*\|/gm)]
        .map((m) => ({ name: m[1], lines: Number(m[2]) }));
    const docMap = new Map(found.map((f) => [f.name, f.lines]));

    if (docMap.size === 0)
    {
        console.error('❌ 在 docs/CI.md 里没找到按包的分档表（期望形如 `| `包名` | 40.1 | ...`）');
        process.exit(1);
    }

    const problems = [];

    for (const r of rows)
    {
        const inDoc = docMap.get(r.name);

        if (inDoc === undefined)
        {
            problems.push(`${r.name}：实测有，文档里没有`);
        }
        else if (Math.abs(inDoc - r.lines) > TOLERANCE)
        {
            problems.push(`${r.name}：文档 ${inDoc}，实测 ${fmt(r.lines)}（差 ${Math.abs(inDoc - r.lines).toFixed(1)}）`);
        }
    }

    for (const name of docMap.keys())
    {
        if (!rows.some((r) => r.name === name)) problems.push(`${name}：文档里有，实测没有`);
    }

    if (problems.length > 0)
    {
        console.error(`\n❌ 分包覆盖率与 docs/CI.md §1.3 不一致（容差 ${TOLERANCE}）：`);
        problems.forEach((p) => console.error(`  · ${p}`));
        process.exit(1);
    }

    console.log(`\n✅ 分包覆盖率与 docs/CI.md §1.3 一致（${rows.length} 个包，容差 ${TOLERANCE}）`);
}