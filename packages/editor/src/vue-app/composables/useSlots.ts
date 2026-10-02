import { computed, shallowRef } from 'vue';
import type { ComputedRef, ShallowRef } from 'vue';
import { getEditorSlots } from '../../plugins/slots';
import { PANEL_SLOT_BY_PLACEMENT } from '../../plugins/slots/projection';
import type { PanelPlacement } from '../../plugins';
import type { SlotEntry, SlotName } from '../../plugins/slots';

/**
 * 插槽的 **Vue 侧桥接**（#276 S2b）。
 *
 * ## 为什么需要这一层
 *
 * 插槽注册表是**普通对象**（`src/plugins/slots/` 里没有一行 Vue），它回答"这个座位上现在有哪些占用"
 * 靠的是普通方法调用。而界面要在**座位内容变化时**重算，于是需要一座桥——与
 * [`usePluginVersion`](./usePluginVersion.ts) 对插件清单做的事完全一样：
 * 核心不依赖 Vue，UI 侧用一个**版本号**订阅变化。
 *
 * ```ts
 * const entries = useSlotEntries('panel.main');   // 座位一变，这个 computed 就失效重算
 * ```
 *
 * `void r_version.value` 是"只订阅、不用值"的惯用写法（注释必须写清：删掉它界面就"没反应"了，
 * 而功能不报错——这类缺陷很难查）。
 *
 * ## 与 `usePluginVersion` 的分工（S2b 之后）
 *
 * - **渲染路径**（标签区、场景浮层）读**插槽**——插件开关变化会先经过投影进插槽，插槽再通知 UI；
 * - **非渲染消费者**（设置面板列插件、贡献表 dump、桥接方法表）继续用 `usePluginVersion`
 *   ——它们要的是"装了哪些插件"，不是"座位上有谁"。
 */

/**
 * 插槽内容的版本号：座位内容一变就 +1。
 *
 * 模块级单例（多个组件读同一个版本号），订阅只在**第一次使用**时建立——不做模块级副作用（对齐 R2）。
 */
const r_slotVersion = shallowRef(0);

/** 是否已建立订阅（模块级单例，只建一次） */
let subscribed = false;

/**
 * 取插槽版本号。
 *
 * @returns 版本号 ref
 */
export function useSlotVersion(): ShallowRef<number>
{
    if (!subscribed)
    {
        subscribed = true;
        getEditorSlots().onChanged(() =>
        {
            r_slotVersion.value++;
        });
    }

    return r_slotVersion;
}

/**
 * 某个座位上的占用（响应式）。
 *
 * @param slot 座位名
 * @returns 该座位的占用列表（`order` 小的在前）
 */
export function useSlotEntries(slot: SlotName): ComputedRef<readonly SlotEntry[]>
{
    const r_version = useSlotVersion();

    return computed(() =>
    {
        // 显式建立依赖：座位内容一变就重算（见文件头说明）
        void r_version.value;

        return getEditorSlots().entries(slot);
    });
}

/** 全部面板座位（四个落位），顺序固定 */
const PANEL_PLACEMENTS = Object.keys(PANEL_SLOT_BY_PLACEMENT) as PanelPlacement[];

/**
 * 四个面板座位上的**全部**占用（"可添加的标签类型"要列出全部面板，而不是某一个落位的）。
 *
 * @returns 占用列表（按座位顺序、座位内已排序）
 */
export function useAllPanelEntries(): ComputedRef<readonly SlotEntry[]>
{
    const r_version = useSlotVersion();

    return computed(() =>
    {
        void r_version.value;

        const slots = getEditorSlots();

        return PANEL_PLACEMENTS.flatMap((placement) => slots.entries(PANEL_SLOT_BY_PLACEMENT[placement]));
    });
}
