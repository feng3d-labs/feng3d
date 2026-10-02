/**
 * 包体基线与 byte 天花板（issue #73）。
 *
 * 当前仓库没有任何包体测量——"引用了多少 API"与"产物多大"之间没有可见的约束，
 * 无关场景的体积增长不会被任何人发现。这个脚本用 esbuild 真打 3 档规模的入口，
 * 记录 raw / gzip 字节数并在超出天花板时失败。
 *
 * 三档的含义是"引用面"而不是"场景复杂度"（后者需要 GPU 才能跑起来）：
 *   - `minimal`：只用一个纯数学导出（@feng3d/math 的 `vec3From`；阶段 C-f 起 math 无数值 class）；
 *   - `core`：只用引擎核心的一件事（feng3d 的 Object3D 类型）；
 *   - `full`：把 feng3d 的导出全量引入（体积上限，用来观察"整体是否悄悄变胖"）。
 *
 * 用法：
 *   node scripts/check-bundle-size.mjs            # 校验（CI 用）
 *   node scripts/check-bundle-size.mjs --update   # 重写基线（需在 PR 里说明为何是合理增长）
 *   node scripts/check-bundle-size.mjs --report   # 只打印 chunk 级分析（哪些模块最占地方）
 *
 * 判定口径：**无关场景的包体增长是设计缺陷，不是新基线**（Babylon Lite 的说法）。
 * 因此超出容忍即失败，要求改代码而不是改基线；确实需要改基线时走 `--update` 并在 PR 里解释。
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const ROOT = process.cwd();
const WORK = join(ROOT, 'tmp');
const BASELINE = join(ROOT, 'scripts', 'bundle-size-baseline.json');

/** 允许的浮动：超过基线 ×(1+TOLERANCE) 才算超天花板（构建器与依赖的小版本差异会带来 1‰ 级抖动） */
const TOLERANCE = 0.02;

/** 三档入口：引用面从小到大 */
const TIERS = [
    {
        name: 'minimal',
        describe: '只用 @feng3d/math 的一个纯数学导出',
        code: ["import { vec3From } from '@feng3d/math';", '', 'export const v = vec3From(1, 2, 3);', ''].join('\n'),
    },
    {
        name: 'core',
        describe: '引用 feng3d 的核心函数（logic）与 math',
        // 注意不能用"只用类型"的写法：`const o: Object3D = {...}` 里的类型会被擦除，
        // 产物体积退化成 44 B——那种档位量不到任何东西。
        code: [
            "import { logic } from 'feng3d';",
            "import { vec3From } from '@feng3d/math';",
            '',
            'export const use = (data: object) => [logic(data as never), vec3From(1, 2, 3)];',
            '',
        ].join('\n'),
    },
    {
        name: 'full',
        describe: '全量引入 feng3d 的导出（体积上限）',
        code: ["import * as feng3d from 'feng3d';", '', 'export default feng3d;', ''].join('\n'),
    },
];

const args = process.argv.slice(2);
const update = args.includes('--update');
const report = args.includes('--report');

mkdirSync(WORK, { recursive: true });

/** esbuild 由 vitest → vite 依赖链带到 node_modules（已在根目录提升），不需要新增依赖 */
const esbuild = await import('esbuild').catch(() =>
{
    console.error('❌ 找不到 esbuild：它应随 vitest 的依赖链安装，先跑一次 `npm ci`');
    process.exit(1);
});

/**
 * 打包一档并测量体积。
 *
 * `minify: true` 让数字贴近真实产物；`metafile: true` 用来做 chunk 级分析（哪几个模块最占地方）。
 *
 * @param tier 档位定义
 * @returns 体积与 chunk 分析
 */
async function measure(tier)
{
    const entry = join(WORK, `bundle-size-${tier.name}.ts`);

    writeFileSync(entry, tier.code, 'utf8');
    try
    {
        const result = await esbuild.build({
            entryPoints: [entry],
            bundle: true,
            format: 'esm',
            platform: 'browser',
            minify: true,
            write: false,
            metafile: true,
            logLevel: 'silent',
        });
        const raw = result.outputFiles[0].contents;

        // metafile 的 outputs[..].inputs 给出每个源文件贡献的字节数
        const output = Object.values(result.metafile.outputs)[0];
        const inputs = Object.entries(output.inputs ?? {})
            .map(([file, info]) => ({ file, bytes: info.bytesInOutput }))
            .filter((v) => v.bytes > 0)
            .sort((a, b) => b.bytes - a.bytes);

        return { raw: raw.length, gzip: gzipSync(raw).length, inputs };
    }
    finally
    {
        rmSync(entry, { force: true });
    }
}

const measured = {};

for (const tier of TIERS)
{
    measured[tier.name] = await measure(tier);
}

/** 打印 chunk 级分析：最大的若干源文件（回答"哪些模块被意外保留"） */
function printReport(tier, data, top = 8)
{
    console.log(`\n  ${tier.name}（${tier.describe}）：raw ${data.raw} B / gzip ${data.gzip} B`);
    console.log('    最占地方的源文件：');
    data.inputs.slice(0, top).forEach((v) => console.log(`      ${String(v.bytes).padStart(7)} B  ${v.file}`));
}

if (report)
{
    TIERS.forEach((t) => printReport(t, measured[t.name]));
    process.exit(0);
}

if (update)
{
    const baseline = {
        note: '包体基线（issue #73）。改这个文件等于改天花板——请在 PR 里说明为什么增长是合理的，而不是"跑一次 --update 就绿了"。',
        tolerance: TOLERANCE,
        tiers: Object.fromEntries(TIERS.map((t) => [t.name, { raw: measured[t.name].raw, gzip: measured[t.name].gzip }])),
    };

    writeFileSync(BASELINE, `${JSON.stringify(baseline, null, 4)}\n`, 'utf8');
    TIERS.forEach((t) => printReport(t, measured[t.name]));
    console.log(`\n✅ 已写入基线 ${BASELINE.replace(ROOT, '')}`);
    process.exit(0);
}

// ---- 校验模式 ----
let baseline;

try
{
    baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
}
catch
{
    console.error(`❌ 读不到基线 ${BASELINE.replace(ROOT, '')}：先跑一次 node scripts/check-bundle-size.mjs --update 并把它提交进仓库`);
    process.exit(1);
}

const problems = [];

for (const tier of TIERS)
{
    const base = baseline.tiers?.[tier.name];

    if (!base)
    {
        problems.push(`${tier.name}：基线里没有这一档（新增档位后要重跑 --update）`);
        continue;
    }

    const now = measured[tier.name];

    for (const kind of ['raw', 'gzip'])
    {
        const ceiling = Math.ceil(base[kind] * (1 + TOLERANCE));
        const delta = now[kind] - base[kind];
        const pct = ((delta / base[kind]) * 100).toFixed(1);
        const mark = now[kind] > ceiling ? '❌' : '✓';

        console.log(`${mark} ${tier.name}.${kind}: ${now[kind]} B（基线 ${base[kind]} B，${delta >= 0 ? '+' : ''}${delta} B / ${pct}%）`);

        if (now[kind] > ceiling)
        {
            problems.push(`${tier.name} 的 ${kind} 体积 ${now[kind]} B 超过天花板 ${ceiling} B（基线 ${base[kind]} B，+${pct}%）`);
        }
    }
}

if (problems.length > 0)
{
    console.error('\n❌ 包体超出天花板（issue #73）：');
    problems.forEach((p) => console.error(`  ${p}`));
    console.error('\n**无关场景的包体增长是设计缺陷，不是新基线**（Babylon Lite 的判据）。');
    console.error('修法：找出被意外保留的模块（`node scripts/check-bundle-size.mjs --report`），');
    console.error('     确认它是被新代码静态引入、还是顶层副作用导致的无法消除。');
    console.error('     确实属于合理增长时，才用 `--update` 改基线，并在 PR 里说明。');
    process.exit(1);
}

console.log('\n✅ 包体在 byte 天花板之内');
