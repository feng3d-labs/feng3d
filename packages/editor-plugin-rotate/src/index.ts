import { ROTATE_API_VERSION, ROTATE_PLUGIN_ID } from './shared';
import type { Context } from '@deepseek-ai/cordis';

/**
 * 宿主侧（Node 端）—— 包入口 `"."`。
 *
 * 宿主半是 **cordis 插件**：宿主进程（#272 落地后）把插件包装进 cordis 树，
 * 插件在这里挂自己的服务、命令、文件监听等**非界面**能力。
 *
 * 本样板只演示形状（挂一个 effect 计数），不假装有真实宿主能力——
 * 宿主进程骨架本身属 #272，见 `packages/editor/docs/PLUGIN_TRIPLE_HALF.md` §3.5/§3.7 的 S4b。
 */

/** 宿主侧的插件元数据（宿主列表 / 日志用；与清单同源） */
export const ROTATE_HOST_META = {
    id: ROTATE_PLUGIN_ID,
    apiVersion: ROTATE_API_VERSION,
} as const;

/** 已经挂上的宿主半数量（效果可见；真实宿主会用 cordis 的服务状态代替） */
let installedHalves = 0;

/**
 * cordis 插件体：宿主把本包装进 cordis 树时调用。
 *
 * 用 `ctx.effect` 挂载 → **卸载（`fiber.dispose()`）时自动回收**，
 * 这正是阶段 2 验过的卸载级联（`packages/editor/spikes/cordis-service.mjs`）。
 *
 * @param ctx 宿主给插件包的 context
 */
export function apply(ctx: Context): void
{
    ctx.effect(() =>
    {
        installedHalves++;

        return () =>
        {
            installedHalves--;
        };
    });
}

/**
 * 取当前挂载数（测试与宿主诊断用）。
 *
 * @returns 已挂载的宿主半数量
 */
export function getHostHalfInstalls(): number
{
    return installedHalves;
}
