#!/usr/bin/env node
/**
 * 在 `packages/` 下的各个子包里依次执行同一个 npm 脚本。
 *
 * 为什么不直接用 `npm run <script> --workspaces`：
 * 根 package.json 的 workspaces 还包含 `packages/<包>/examples` 与 `examples`，
 * 这些示例工作区有几个**既有的类型错误**（如 `toReversed` 需要 es2023 lib、
 * `WeakRef` 需要 es2021，以及 `GPUIndexFormat` 的字面量收窄），
 * 一旦纳入就会让 CI 门禁长期红着，掩盖真正的问题。
 *
 * 因此本脚本只跑 `packages/<包>` 这一层，与「子包 CI 覆盖到全部子项目」的目标一致，
 * 同时把示例代码的类型收敛留作独立事项（见 docs/CI.md 的「已知缺口」）。
 *
 * 用法：
 *   node scripts/run-in-packages.mjs types
 *   node scripts/run-in-packages.mjs build --skip feng3d-editor
 *
 * 退出码：0 全部成功；1 有包失败。
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { snapshotRegeneratedFiles } from './release-utils/regenerated-files.mjs';

/** 仓库根目录（本文件位于 <根>/scripts/ 下）。 */
const REPO_ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const PACKAGES_DIR = join(REPO_ROOT, 'packages');

/**
 * 解析命令行参数：第一个非选项参数是脚本名，其余是选项。
 *
 * @returns {{ scriptName: string, skip: string[], only: string[], continueOnError: boolean }}
 */
function parseArgs()
{
    const argv = process.argv.slice(2);
    /** @type {{ scriptName: string, skip: string[], only: string[], continueOnError: boolean }} */
    const options = { scriptName: '', skip: [], only: [], continueOnError: false };

    for (let i = 0; i < argv.length; i++)
    {
        const arg = argv[i];
        if (arg === '--skip')
        {
            options.skip.push(argv[++i] ?? '');
        }
        else if (arg === '--only')
        {
            options.only.push(argv[++i] ?? '');
        }
        else if (arg === '--continue-on-error')
        {
            options.continueOnError = true;
        }
        else if (arg === '--help' || arg === '-h')
        {
            console.log(`在 packages/ 下各子包依次执行同一个 npm 脚本

用法：
  node scripts/run-in-packages.mjs <脚本名> [选项]

选项：
  --skip <包名或目录名>   跳过该包（可重复）
  --only <包名或目录名>   只执行指定包（可重复）
  --continue-on-error     某个包失败后继续跑其余包（默认立即停止）
  --help                  显示本帮助
`);
            process.exit(0);
        }
        else if (!options.scriptName)
        {
            options.scriptName = arg;
        }
    }

    if (!options.scriptName)
    {
        console.error('[packages] 缺少脚本名，例如：node scripts/run-in-packages.mjs types');
        process.exit(1);
    }

    return options;
}

/**
 * 收集 packages/ 下声明了指定 npm 脚本的包。
 *
 * @param {string} scriptName 脚本名
 * @returns {Array<{ dir: string, name: string, root: string, hasScript: boolean }>}
 */
function collectPackages(scriptName)
{
    const result = [];

    for (const entry of readdirSync(PACKAGES_DIR, { withFileTypes: true }))
    {
        if (!entry.isDirectory()) continue;

        const packageRoot = join(PACKAGES_DIR, entry.name);
        const manifestPath = join(packageRoot, 'package.json');
        if (!existsSync(manifestPath)) continue;

        let manifest;
        try
        {
            manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        }
        catch (error)
        {
            console.error(`[packages] 解析 ${manifestPath} 失败：${error.message}`);
            process.exit(1);
        }

        result.push({
            dir: entry.name,
            name: manifest.name ?? entry.name,
            root: packageRoot,
            hasScript: typeof manifest.scripts?.[scriptName] === 'string',
        });
    }

    result.sort((a, b) => (a.dir < b.dir ? -1 : a.dir > b.dir ? 1 : 0));

    return result;
}

const options = parseArgs();
const packages = collectPackages(options.scriptName);

const skippedByOption = (pkg) => options.skip.includes(pkg.name) || options.skip.includes(pkg.dir);
const matchesOnly = (pkg) => options.only.includes(pkg.name) || options.only.includes(pkg.dir);

// --only 给了就只跑指定包（用于「只需要构建某一个包」的场景，如编辑器 e2e）
const limited = options.only.length > 0 ? packages.filter(matchesOnly) : packages;
if (options.only.length > 0 && limited.length === 0)
{
    console.error(`[packages] --only 没有匹配到任何包：${options.only.join('、')}`);
    process.exit(1);
}

const targets = limited.filter((pkg) => pkg.hasScript && !skippedByOption(pkg));
const withoutScript = limited.filter((pkg) => !pkg.hasScript);
const skipped = limited.filter((pkg) => pkg.hasScript && skippedByOption(pkg));

console.log(`[packages] 执行 npm run ${options.scriptName}，共 ${targets.length} 个包`);
if (options.only.length > 0)
{
    console.log(`[packages] 按 --only 限定：${options.only.join('、')}`);
}
if (skipped.length > 0)
{
    console.log(`[packages] 按 --skip 跳过：${skipped.map((p) => p.name).join('、')}`);
}
if (withoutScript.length > 0)
{
    console.log(`[packages] 无 ${options.scriptName} 脚本：${withoutScript.map((p) => p.name).join('、')}`);
}

const failures = [];

for (const pkg of targets)
{
    console.log(`\n[packages] === ${pkg.name}（${pkg.dir}）===`);
    try
    {
        // 构建会重写 components.d.ts / auto-imports.d.ts 这类受版本控制的生成文件。
        // 无条件还原（而不是「只在无变更时还原」）会擦掉开发者手工改动的结构，
        // 所以：先记下改动前后内容，构建后左右比对——
        //   · 生成文件内容没变（构建与现状一致）→ 还原文件时间戳/临时差异，保持工作区干净；
        //   · 内容确实变了（如真新增了组件）→ 保留，由开发者决定是否提交。
        const restore = snapshotRegeneratedFiles(pkg.root);
        try
        {
            execFileSync('npm', ['run', options.scriptName], {
                cwd: pkg.root,
                stdio: 'inherit',
                shell: process.platform === 'win32',
            });
        }
        finally
        {
            restore.ifUnchanged();
        }
    }
    catch
    {
        failures.push(pkg.name);
        console.error(`[packages] ${pkg.name} 的 ${options.scriptName} 失败`);
        if (!options.continueOnError)
        {
            console.error('[packages] 已中止后续包（用 --continue-on-error 可跑完全部再汇总）');
            process.exit(1);
        }
    }
}

if (failures.length > 0)
{
    console.error(`\n[packages] 失败 ${failures.length} 个包：${failures.join('、')}`);
    process.exit(1);
}

console.log(`\n[packages] 全部成功：${targets.length} 个包的 ${options.scriptName} 均通过`);
