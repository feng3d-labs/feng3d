/**
 * R6：包级 `strictNullChecks` 收敛进度的机器守卫（issue #282 起）。
 *
 * `scripts/check-strict-dirs.mjs` 守的是 `feng3d` **包内目录**的收敛；各子包（`packages/*`）
 * 自己的 `tsconfig.json` 一直是 `strictNullChecks: false`，逐个开启后**没有任何东西阻止它被改回去**，
 * 也没有任何东西记下"现在开到哪一步了"——进度只存在于人的记忆与 PR 描述里。
 *
 * 本脚本把进度落成一份清单（`scripts/strict-packages.json`）并双向校验：
 *  - 清单里的包：`tsconfig.json` 必须真的是 `strictNullChecks: true`（防止悄悄关回去）；
 *  - 仓库里任何 `strictNullChecks: true` 的包：必须在清单里（防止开了不登记，进度失真）。
 *
 * 不校验"开了之后是否 0 错误"——那是 `npm run types:packages` 的职责（CI 质量门禁已跑）。
 *
 * 用法：`node scripts/check-strict-packages.mjs`
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertScanVolume } from './scan-volume.mjs';

const ROOT = process.cwd();
const PACKAGES_DIR = join(ROOT, 'packages');
const MANIFEST = join(ROOT, 'scripts', 'strict-packages.json');

/**
 * 读取 tsconfig 里的 `strictNullChecks` 值。
 *
 * tsconfig 允许注释与尾随逗号，不能直接 `JSON.parse`；这里只做**最小**清洗：
 * 去掉行注释、块注释与对象/数组里的尾随逗号，再解析。
 *
 * @param file tsconfig 路径
 * @returns `strictNullChecks` 的布尔值；未声明时返回 `undefined`
 */
function readStrictNullChecks(file)
{
    const raw = readFileSync(file, 'utf8');
    const cleaned = raw
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1')
        .replace(/,(\s*[}\]])/g, '$1');

    return JSON.parse(cleaned).compilerOptions?.strictNullChecks;
}

/** 仓库里所有带 tsconfig.json 的包 */
function listPackages()
{
    return readdirSync(PACKAGES_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .filter((name) =>
        {
            try
            {
                readFileSync(join(PACKAGES_DIR, name, 'tsconfig.json'), 'utf8');

                return true;
            }
            catch
            {
                return false;
            }
        })
        .sort();
}

const all = listPackages();

assertScanVolume({
    label: 'R6 strictNullChecks 包级清单扫描（packages/* 带 tsconfig.json 的包）',
    count: all.length,
    min: 1,
    detail: '扫描根：packages/（本脚本的 listPackages，只收带 tsconfig.json 的目录）',
});

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const registered = manifest.packages ?? [];
/** 已清零、但**故意不由本包 tsconfig.json 守**的包（如 feng3d：一开就连带检查依赖包源码），值是一句原因 */
const exempted = manifest.exempted ?? {};
const problems = [];

for (const [name, reason] of Object.entries(exempted))
{
    if (!all.includes(name))
    {
        problems.push(`豁免清单里的 ${name} 在 packages/ 下不存在（改名或删包后要同步 scripts/strict-packages.json）`);
        continue;
    }
    if (readStrictNullChecks(join(PACKAGES_DIR, name, 'tsconfig.json')) === true)
    {
        problems.push(`${name}（${name}）已在豁免清单里，但它的 tsconfig.json 已经开了 strictNullChecks——请把它移进 packages 列表并删掉这条豁免`);
    }
    else if (!reason)
    {
        problems.push(`${name}（${name}）在豁免清单里但没写原因，后来者无法判断它到底清没清零`);
    }
}

// 方向一：清单里的包必须真的开着
for (const name of registered)
{
    if (!all.includes(name))
    {
        problems.push(`清单里的 ${name} 在 packages/ 下不存在（改名或删包后要同步 scripts/strict-packages.json）`);
        continue;
    }
    const value = readStrictNullChecks(join(PACKAGES_DIR, name, 'tsconfig.json'));

    if (value !== true)
    {
        problems.push(`${name}（${name}）登记为已开启，但 packages/${name}/tsconfig.json 里 strictNullChecks 是 ${JSON.stringify(value)}`);
    }
}

// 方向二：开着的包必须在清单里（否则进度统计会小看自己）
const actuallyOn = all.filter((name) => readStrictNullChecks(join(PACKAGES_DIR, name, 'tsconfig.json')) === true);

for (const name of actuallyOn)
{
    if (!registered.includes(name))
    {
        problems.push(`${name}（${name}）已开启 strictNullChecks，但没登记到 scripts/strict-packages.json`);
    }
}

if (problems.length > 0)
{
    console.error('❌ strictNullChecks 包级清单与实际不一致（R6）：');
    problems.forEach((p) => console.error(`  ${p}`));
    console.error('\n修法：开启某个包时先修到 `npm run types:packages` 全绿，再把 strictNullChecks 改成 true 并登记到清单；关闭时两边一起改。');
    process.exit(1);
}

const exemptedNames = Object.keys(exempted);
const pending = all.filter((name) => !registered.includes(name) && !(name in exempted));
const covered = registered.length + exemptedNames.length;

console.log(`✅ strictNullChecks 包级进度一致：${covered}/${all.length} 个包已清零`);
console.log(`   由本包 tsconfig.json 守住（${registered.length}）：${registered.join('、')}`);

if (exemptedNames.length > 0)
{
    console.log(`   已清零但另行守护（${exemptedNames.length}）：${exemptedNames.join('、')}`);
}

if (pending.length > 0)
{
    console.log(`   待收敛（${pending.length}）：${pending.join('、')}`);
}
