import type { PanelContribution, PanelPlacement } from './types';
import type { SlotName } from './slots/types';

/**
 * 落位 ↔ 座位的映射、以及"一个面板贡献点落在哪个座位"的解析（#276 S3）。
 *
 * ## 为什么这层要单独放（而不是留在 `slots/projection.ts`）
 *
 * 它被**两处**用到：`registry.ts` 的排序（按座位分组）与 `slots/projection.ts` 的投影。
 * 若留在 projection 里，registry 就得反向 import projection，而 projection 依赖 registry
 * ——**循环**。所以映射与解析放在这层只依赖类型的最底层文件里。
 *
 * ## 两种写法为什么并存
 *
 * - `slot`：**座位名**（`'panel.main'`）——正式写法。插件声明"我落在哪个座位"，
 *   核心换布局（把落位拆得更细、或改名）时插件不必跟着改；
 * - `placement`：四个**落位缩写**——**糖**，等价于对应座位。既有内置清单与用户 patch 都用它，
 *   保留它意味着 S3 是**平滑演进**而不是一次破坏性改名。
 *
 * 两个都给时**以 `slot` 为准**（`placement` 留作对照与诊断）。
 */

/** 落位 → 座位（`Record<PanelPlacement, …>`：新增落位时这里编译不过，不会静默漏掉） */
export const PANEL_SLOT_BY_PLACEMENT: Readonly<Record<PanelPlacement, SlotName>> = {
    hierarchy: 'panel.hierarchy',
    main: 'panel.main',
    project: 'panel.project',
    bottom: 'panel.bottom',
};

/** 全部落位（固定顺序） */
export const PANEL_PLACEMENTS: readonly PanelPlacement[] = ['hierarchy', 'main', 'project', 'bottom'];

/**
 * 四个面板座位，**顺序固定**（这就是面板排序的第一口径）。
 *
 * 它同时是"什么算合法座位"的判据（`patch.ts` 与 {@link normalizePanelSlot} 都读它）。
 */
export const PANEL_SLOTS: readonly SlotName[] = PANEL_PLACEMENTS.map((placement) => PANEL_SLOT_BY_PLACEMENT[placement]);

/**
 * 是不是一个面板座位名（运行期判据）。
 *
 * @param value 待判定的字符串
 * @returns 是面板座位名时返回 `true`
 */
export function isPanelSlot(value: string): value is SlotName
{
    return (PANEL_SLOTS as readonly string[]).includes(value);
}

/**
 * 把"位置"归一成座位名：座位名原样返回，落位缩写查表。
 *
 * @param position 座位名（`'panel.main'`）或落位缩写（`'main'`）
 * @returns 座位名
 * @throws 两者都不是时抛出，并列出合法取值
 */
export function normalizePanelSlot(position: PanelPlacement | SlotName): SlotName
{
    if (isPanelSlot(position)) return position;

    const slot = PANEL_SLOT_BY_PLACEMENT[position as PanelPlacement];
    // 类型上 Record 全覆盖，走不到这儿；防的是"未经校验的外部数据"（如手写 patch）直接走到投影
    if (!slot)
    {
        throw new Error(`面板位置 ${String(position)} 不认识：只能是 ${PANEL_PLACEMENTS.join(' / ')}（落位缩写）或 ${PANEL_SLOTS.join(' / ')}（座位名）`);
    }

    return slot;
}

/**
 * 解析一个面板贡献点落在哪个座位：`slot` 优先，`placement` 作为糖。
 *
 * @param panel 面板贡献点
 * @returns 座位名
 */
export function resolvePanelSlot(panel: PanelContribution): SlotName
{
    return panel.slot ?? normalizePanelSlot(panel.placement);
}
