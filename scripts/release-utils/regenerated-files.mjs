/**
 * 构建期会被工具重写、且**纳入版本控制**的生成文件，以及快照/还原工具。
 *
 * 为什么需要：`vite build` 会用 unplugin-auto-import / unplugin-vue-components
 * 重写 `auto-imports.d.ts` / `components.d.ts`，内容随「当前被引用的组件集合」
 * 变化。它们有 git 基线版本，构建后不还原就会：
 * 1. 污染工作区，让 `git status` 出现与本次改动无关的 diff；
 * 2. 让 CI 的「工作区是否被构建污染」检查必然失败，把一个正常流程误判成缺陷。
 *
 * 还原策略是**「仅当最终内容与 git 基线一致时才还原」**，而不是无条件还原：
 * 无条件还原会把开发者**真实新增**的组件声明一起擦掉。所以构建后才比对——
 * 内容与基线相同（构建只是重写了一遍）就还原，确实变了就保留待人工提交。
 *
 * 使用方：`scripts/run-in-packages.mjs`（逐包 build）与
 * `scripts/release-packages.mjs`（发布前构建）。
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/** 会被构建工具重写的、受版本控制的生成文件名（相对包根）。 */
export const REGENERATED_FILE_NAMES = ['components.d.ts', 'auto-imports.d.ts'];

/**
 * 取某文件在 git 基线（HEAD）中的内容。
 *
 * @param {string} filePath 文件绝对路径
 * @returns {string | null} 基线内容；不在版本控制或取不到时返回 null
 */
function readGitBaseline(filePath)
{
    try
    {
        return execFileSync('git', ['show', `HEAD:${toRepoRelative(filePath)}`], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
            cwd: dirname(filePath),
        });
    }
    catch
    {
        return null;
    }
}

/**
 * 把绝对路径转成仓库相对路径（正斜杠）。
 *
 * @param {string} filePath 绝对路径
 * @returns {string} 相对路径
 */
function toRepoRelative(filePath)
{
    try
    {
        const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
            cwd: dirname(filePath),
        }).trim();
        const normalized = filePath.replace(/\\/g, '/');
        const rootNormalized = root.replace(/\\/g, '/');

        return normalized.startsWith(`${rootNormalized}/`)
            ? normalized.slice(rootNormalized.length + 1)
            : normalized;
    }
    catch
    {
        return filePath.replace(/\\/g, '/');
    }
}

/**
 * 快照包内会被构建重写的生成文件。
 *
 * 返回值既是函数也是带方法的对象：
 * - 直接调用：**无条件**还原为快照（发布流程用，发布期间不希望工作区有任何漂移）
 * - `.ifUnchanged()`：仅当当前内容与 **git 基线**一致时才还原（逐包构建用，
 *   保留开发者真实新增的声明）
 *
 * @param {string} packageRoot 包根目录
 * @returns {(() => void) & { ifUnchanged: () => void }} 还原器（无此类文件时为空操作）
 */
export function snapshotRegeneratedFiles(packageRoot)
{
    const snapshots = [];

    for (const name of REGENERATED_FILE_NAMES)
    {
        const filePath = join(packageRoot, name);
        if (!existsSync(filePath)) continue;
        snapshots.push({ filePath, content: readFileSync(filePath, 'utf8') });
    }

    const restoreAll = () =>
    {
        for (const { filePath, content } of snapshots)
        {
            writeFileSync(filePath, content, 'utf8');
        }
    };

    restoreAll.ifUnchanged = () =>
    {
        for (const { filePath, content } of snapshots)
        {
            const baseline = readGitBaseline(filePath);
            // 取不到基线（未纳入版本控制等）→ 保守起见不还原
            if (baseline === null) continue;
            if (readFileSync(filePath, 'utf8') !== baseline) continue;

            writeFileSync(filePath, content, 'utf8');
        }
    };

    return restoreAll;
}

/**
 * 包裹一段构建逻辑，构建后按「仅当与 git 基线一致时」还原生成文件。
 *
 * @template T
 * @param {string} packageRoot 包根目录
 * @param {() => T} build 构建逻辑
 * @returns {T} build 的返回值
 */
export function withRegeneratedFilesRestored(packageRoot, build)
{
    const restore = snapshotRegeneratedFiles(packageRoot);
    try
    {
        return build();
    }
    finally
    {
        restore.ifUnchanged();
    }
}
