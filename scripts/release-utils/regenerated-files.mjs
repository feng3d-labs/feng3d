/**
 * 构建期会被工具重写、且**纳入版本控制**的生成文件，以及快照/还原工具。
 *
 * 为什么需要：`vite build` 会用 unplugin-auto-import / unplugin-vue-components
 * 重写 `auto-imports.d.ts` / `components.d.ts`，内容随「当前被引用的组件集合」
 * 变化。它们有 git 基线版本，构建后不还原就会：
 * 1. 污染工作区，让 `git status` 出现与本次改动无关的 diff；
 * 2. 让 CI 的「工作区是否被构建污染」检查必然失败，把一个正常流程误判成缺陷。
 *
 * 使用方：`scripts/run-in-packages.mjs`（逐包 build）与
 * `scripts/release-packages.mjs`（发布前构建）都必须在构建后还原。
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** 会被构建工具重写的、受版本控制的生成文件名（相对包根）。 */
export const REGENERATED_FILE_NAMES = ['components.d.ts', 'auto-imports.d.ts'];

/**
 * 快照包内会被构建重写的生成文件。
 *
 * @param {string} packageRoot 包根目录
 * @returns {() => void} 还原函数（无此类文件时为空操作）
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

    return () =>
    {
        for (const { filePath, content } of snapshots)
        {
            writeFileSync(filePath, content, 'utf8');
        }
    };
}

/**
 * 包裹一段构建逻辑，保证构建后被重写的生成文件被还原。
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
        restore();
    }
}
