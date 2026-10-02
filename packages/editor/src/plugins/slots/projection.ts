import { getPanelContributions, getSceneOverlays } from '../registry';
import { PANEL_PLACEMENTS, PANEL_SLOTS, resolvePanelSlot } from '../panelSlot';
import type { EffectHost } from './effect';
import type { SlotRegistry } from './registry';
import type { SlotName } from './types';

/**
 * 清单 → 插槽的**投影**（#276 S2 的前半，不含界面接线）。
 *
 * ## 为什么是"投影"而不是"替换"
 *
 * 清单（`EditorPluginManifest`）是**权威数据**：五类贡献点、层叠加（内置 < 插件 < 用户）、
 * 同层冲突拒绝、启用禁用、用户 patch 覆盖，全部在那边做完了。插槽层只做一件事——
 * **把归并后的赢家摆到座位上**（决策稿 §3.4）。所以本文件里没有任何"层"或"启用"的逻辑：
 * 它读的是 `getPanelContributions()` / `getSceneOverlays()`，那两个查询**已经**只含启用插件、
 * 且已按层归并、已排序。
 *
 * ## 两侧的对应关系
 *
 * | 清单侧 | 插槽侧 |
 * |---|---|
 * | 面板的位置：`slot`（座位名）或 `placement`（落位缩写，糖）——见 `panelSlot.ts` | 座位 `panel.*` |
 * | 场景浮层（`sceneOverlays`） | 座位 `scene.overlay`（`list`） |
 * | `PanelContribution.order` | `SlotEntry.order`（座位内排序） |
 * | **贡献点本体**（含 `labelKey` / `icon` / `view`） | `SlotEntry.value`（插槽层不解释它，但渲染方要什么就得给什么） |
 * | 贡献点的 `source`（来自哪个插件） | `SlotEntry.source`（"这东西是哪来的"） |
 *
 * ## 谁声明座位、谁调用投影
 *
 * **声明即认领**：座位由**渲染它的那一方**声明。所以本文件提供
 * {@link declarePanelSlots} / {@link declareSceneOverlaySlot} 给那些组件调用（S2 接线的落点），
 * 而不是在模块顶层偷偷声明（那会同时违反 R2 与"声明即认领"）。
 *
 * 落位 ↔ 座位的映射表（{@link PANEL_SLOT_BY_PLACEMENT}）在 `../panelSlot.ts`——
 * `registry.ts` 的排序也要用它，放在这里会形成 registry ↔ projection 的循环。
 */

export { PANEL_SLOT_BY_PLACEMENT, PANEL_SLOTS, isPanelSlot } from '../panelSlot';

/** 场景浮层的座位（只有一个；DSH 的对应物是 `shell.overlay`，也是 `list`） */
export const SCENE_OVERLAY_SLOT: SlotName = 'scene.overlay';

/**
 * 声明四个面板座位（**由渲染它们的组件调用**，如 `MainLayout.vue`）。
 *
 * 重复调用是幂等的（`SlotRegistry.declare` 带引用计数）。
 *
 * @param registry 插槽注册表
 * @returns 取消声明（全部座位一起撤）
 */
export function declarePanelSlots(registry: SlotRegistry): () => void
{
    const collapses = PANEL_SLOTS.map((slot) => registry.declare(slot));

    return () =>
    {
        for (const collapse of collapses) collapse();
    };
}

/**
 * 声明场景浮层座位（**由场景视图调用**，如 `SceneView.vue`）。
 *
 * @param registry 插槽注册表
 * @returns 取消声明
 */
export function declareSceneOverlaySlot(registry: SlotRegistry): () => void
{
    return registry.declare(SCENE_OVERLAY_SLOT);
}

/**
 * 把**当前启用的**清单贡献点投影进插槽。
 *
 * 调用方（装载器）先声明座位、再调用本函数。投影是**快照式**的：
 *
 * ```ts
 * let unproject: (() => void) | null = null;
 *
 * function reproject(): void
 * {
 *     unproject?.();                     // ← 先撤掉上一次投影（关键）
 *     unproject = projectContributions(slots, host);
 * }
 * ```
 *
 * **为什么必须显式撤销**：`register` 的幂等只保证"同 id 不重复添加"，**不会**移除
 * "上一次投影有、这一次没了"的贡献点（插件被禁用、被卸载、被更高层覆盖时都会出现这种情形）。
 * 所以投影返回撤销函数，重投前先调用——这比"猜哪些该删"可靠，也让"投影"保持成一次
 * 可回滚的快照操作。
 *
 * 投影**只处理"界面位置"那一维**：`logics` / `objectView` / `bridgeMethods` 留在清单侧
 * （它们写的是引擎全局注册表与协议方法表，不是渲染插槽，见决策稿 §3.3）。
 *
 * **事务性**：中途失败（如座位未声明）会回滚本次已注册的占用，不留半套
 * （同 `registerPlugins` 的纪律）。
 *
 * @param registry 插槽注册表
 * @param host 调用方宿主（插件卸载时它的占用一起消失）
 * @returns 撤销本次投影（幂等）
 * @throws 座位未声明时抛出（"先声明再投影"是刻意的，见决策稿 §3.7 的 S1 要点 1）
 */
export function projectContributions(registry: SlotRegistry, host: EffectHost): () => void
{
    const releases: (() => void)[] = [];

    try
    {
        // 整次投影**原子**地通知（批处理）：否则"先撤后加"的中间态会让标签区闪空，见 SlotRegistry.batch
        registry.batch(() =>
        {
            for (const panel of getPanelContributions())
            {
                // 座位由贡献点自己说：`slot`（座位名）优先，`placement`（落位缩写）是糖（#276 S3）
                releases.push(registry.register(host, resolvePanelSlot(panel), {
                    id: panel.id,
                    order: panel.order,
                    // 放**贡献点本体**：渲染方要用 labelKey / icon / view（见 SlotEntry 的说明）
                    value: panel,
                    source: panel.source,
                }));
            }

            for (const overlay of getSceneOverlays())
            {
                releases.push(registry.register(host, SCENE_OVERLAY_SLOT, {
                    id: overlay.id,
                    order: overlay.order,
                    value: overlay,
                    source: overlay.source,
                }));
            }
        });
    }
    catch (error)
    {
        registry.batch(() =>
        {
            for (const release of releases) release();
        });

        throw error;
    }

    let released = false;

    return () =>
    {
        if (released) return;
        released = true;
        for (const release of releases) release();
    };
}
