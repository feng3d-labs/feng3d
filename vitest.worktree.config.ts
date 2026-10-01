import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import base from './vitest.config';

/**
 * 在 **git worktree** 里跑全量覆盖率时使用（仓库根的正常 `npm run test:coverage` 不受影响）：
 *
 * ```bash
 * npm run test:coverage -- --config vitest.worktree.config.ts
 * node scripts/coverage-by-package.mjs --check
 * ```
 *
 * ## 为什么需要它
 *
 * worktree 里的 `node_modules` 通常是指向主工作区的 junction（`mklink /J node_modules ...`），
 * 于是包名导入（`feng3d` / `@feng3d/math` …）会被解析到**主工作区**的源码；而
 * `vitest.config.ts` 的 `coverage.include` 是相对**本 worktree** 的 glob —— 那些文件不在里面，
 * 覆盖数据被直接丢弃，读出来的覆盖率**系统性偏低**（issue #492 实测：`webgpu` 60.1% → 7.1%、
 * `feng3d` 64.1% → 57.1%、全局行 54.2% → 52.8%）。
 *
 * ## ⚠️ 两条别名都要写
 *
 * - `feng3d` 是**不带 scope** 的包名（`packages/feng3d/package.json` 的 `name`）；
 *   只写 `@feng3d/<pkg>` 会漏掉它 —— `import ... from 'feng3d'`（addons / editor / particlesystem
 *   的测试大量使用）仍会解析到主工作区，于是 `packages/feng3d/src/index.ts` 显示 **0/111 覆盖**、
 *   整个包少 22 个文件（issue #492 的根因就是这个，不是平台差异）；
 * - `@feng3d/<pkg>` 覆盖其余 18 个包。
 *
 * 补全后，本地读数与 CI 只剩 `path` 一行的**真实平台差异**（本地 90.9 / CI 90.2），
 * 详见 `docs/CI.md` §1.3 表下的说明。
 */
const ROOT = fileURLToPath(new URL('.', import.meta.url));

export default mergeConfig(base, defineConfig({
    resolve: {
        alias: [
            { find: /^feng3d$/, replacement: `${ROOT}packages/feng3d/src/index.ts` },
            { find: /^@feng3d\/([a-z0-9-]+)$/, replacement: `${ROOT}packages/$1/src/index.ts` },
        ],
    },
}));
