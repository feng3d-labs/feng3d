/**
 * 用户 patch 的加载状态（issue #171）。
 *
 * 单独一个小模块，是为了**打断循环 import**：注册表要把这份状态放进贡献表
 * （`getContributionState()`），而 patch 加载器要用注册表（登记用户层、取下层原值）。
 * 把"状态"这个纯数据放在中间，两边都只依赖它，依赖方向就是一条链而不是一个环。
 *
 * lazy-init：模块顶层不做事（对齐 R2）。
 */

/** patch 的加载情况（贡献表要能 dump 出来） */
export interface PatchState
{
    /** 来源：没有 / 默认文件 / `?patch=` 指定 */
    readonly source: 'none' | 'file' | 'url';

    /** 实际读取的地址 */
    readonly url: string;

    /** 是否成功应用 */
    readonly applied: boolean;

    /** 失败原因 */
    readonly error?: string;

    /** 覆盖了哪些插件级设置 */
    readonly overriddenPlugins: readonly string[];

    /** 覆盖了哪些贡献点（形如 `panel:hierarchy`） */
    readonly overriddenContributions: readonly string[];
}

/** 默认的 patch 地址（相对页面；开发时在 `packages/editor/`，产物里在 index.html 旁边） */
export const DEFAULT_PATCH_URL = 'editor.patch.json';

/** 用户 patch 那一层在注册表里的插件 id */
export const USER_PATCH_PLUGIN_ID = '@feng3d/user-patch';

/** 当前状态（lazy-init） */
let state: PatchState | null = null;

/**
 * 取当前 patch 状态。
 *
 * @returns 状态；没加载过时是"没有 patch"
 */
export function getPatchState(): PatchState
{
    state ??= { source: 'none', url: DEFAULT_PATCH_URL, applied: false, overriddenPlugins: [], overriddenContributions: [] };

    return state;
}

/**
 * 写入 patch 状态。
 *
 * @param next 新状态
 */
export function setPatchState(next: PatchState): void
{
    state = next;
}

/**
 * 重置状态（只给测试用）。
 */
export function resetPatchState(): void
{
    state = null;
}
