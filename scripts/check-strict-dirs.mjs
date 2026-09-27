/**
 * R6：`strictNullChecks` 分目录推进的机器守卫（issue #91）。
 *
 * `packages/feng3d/tsconfig.json` 关着 `strictNullChecks` 等四项，空值错误只能靠运行时暴露。
 * 一次性全开不现实（存量巨大），所以按目录推进：白名单里的目录用 `tsconfig.strict.json`
 * 单独检查，**只统计白名单目录内文件的错误**——strict 会把依赖包（如 `@feng3d/event`）
 * 的源码一起检查，那些不属于本次收敛范围，不能混进来让门禁永远红。
 *
 * 用法：`node scripts/check-strict-dirs.mjs`
 * 新增目录时在 TARGETS 里登记（先修到 0 再登记，避免门禁一上来就是红的）。
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = process.cwd();
const TSC = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

/** 白名单：tsconfig + 该配置下**必须为 0 错误**的目录前缀 */
const TARGETS = [
    {
        tsconfig: 'packages/feng3d/tsconfig.strict.json',
        dirs: ['src/utils/', 'src/light/', 'src/skybox/', 'src/pick/', 'src/textures/', 'src/bezier/', 'src/curve/', 'src/cameras/', 'src/render/', 'src/geometry/', 'src/materials/', 'src/animation/', 'src/component/'],
        label: 'feng3d 已收敛目录（13 个，再加 component：#257 / #259）',
    },
];

/** 跑一次 tsc，返回输出（tsc 有错误时 exit 非 0，这里不当异常处理） */
function runTsc(tsconfig)
{
    // 用 spawnSync 而不是 execFileSync：后者在 exit 非 0 时抛错，
    // 拿到的 stdout 可能不完整（实测漏掉了目标目录里的错误，导致门禁假绿）。
    const result = spawnSync(process.execPath, [TSC, '-p', tsconfig, '--noEmit'], {
        cwd: ROOT, encoding: 'utf8',
    });

    return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

const problems = [];

for (const target of TARGETS)
{
    const output = runTsc(target.tsconfig);
    const lines = output.split('\n').filter((l) => l.includes('error TS'));
    // 用 includes 而不是 startsWith：tsc 输出的路径前缀取决于 cwd 与 -p 的组合
    // （可能是 `src/utils/x.ts`，也可能是 `packages/feng3d/src/utils/x.ts`）。
    //
    // 但**必须排除跨包路径**（`../math/src/bezier/...`）：白名单目录名在依赖包里可能同名，
    // 只按 includes 匹配会把依赖包的错误算进本目录——实测 `src/bezier` 那 24 条错误全部
    // 来自 `../math/src/bezier/`，会让门禁报出根本不属于本目录的问题。
    const inScope = lines.filter((l) =>
    {
        if (l.includes('/../')) return false;

        // 只认**以该目录开头**的路径：`src/bezier/x.ts` 或 `packages/feng3d/src/bezier/x.ts`。
        // 不能只用 includes——`src/animation/x.ts` 会被 bezier 的依赖链连带检查，
        // 那些错误不属于本目录，算进来会让"目录白名单"失去意义。
        return target.dirs.some((d) => l.startsWith(d) || l.includes(`packages/feng3d/${d}`));
    });
    const outOfScope = lines.length - inScope.length;

    if (inScope.length > 0)
    {
        problems.push(`${target.label}：strictNullChecks 下还有 ${inScope.length} 个错误`);
        inScope.slice(0, 8).forEach((l) => problems.push(`    ${l.trim()}`));
        if (inScope.length > 8) problems.push(`    …另有 ${inScope.length - 8} 条`);
    }
    else
    {
        console.log(`✅ ${target.label}：0 错误（本次 tsc 另有 ${outOfScope} 条跨包/其它噪音，不计入）`);
    }
}

if (problems.length > 0)
{
    console.error('❌ strictNullChecks 白名单目录未清零（R6，issue #91）：');
    problems.forEach((p) => console.error(`  ${p}`));
    console.error('\n修法：给可能为空的值加显式判空/可选类型；确知非空时用断言并写清理由。');
    process.exit(1);
}

console.log(`✅ strictNullChecks 白名单检查通过（${TARGETS.length} 个目录）`);
