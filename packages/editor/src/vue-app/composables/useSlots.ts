import { computed, shallowRef } from 'vue';
import type { ComputedRef, ShallowRef } from 'vue';
import { getEditorSlots } from '../../plugins/slots';
import { PANEL_PLACEMENTS, PANEL_SLOT_BY_PLACEMENT } from '../../plugins/slots/projection';
import type { SlotEntry, SlotName, SlotRegistry } from '../../plugins/slots';

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
 * 模块级单例（多个组件读同一个版本号），订阅在第一次使用时建立。
 *
 * **关于"模块级"这件事**：这一行确实是"import 即分配一个响应式对象"，与
 * [`usePluginVersion`](./usePluginVersion.ts) 同构。按本包的 R2 口径它**不算违规**——
 * 门禁（`scripts/check-editor-module-effects.mjs`）拦的是**注册型副作用**（顶层 `new Map/Set`、
 * `registerXxx` 调用、`globalThis` 写入、"import 即往全局注册表塞东西"）；
 * 一个没人读的 ref 不产生任何可观察副作用，也不会阻止 tree-shake。
 */
const r_slotVersion = shallowRef(0);

/**
 * 已订阅的注册表实例。
 *
 * 按**实例**记而不是布尔标志：`resetEditorSlots()`（测试用）会把注册表换掉，
 * 此时旧订阅随旧实例一起消失——只看布尔标志的话，界面会**永远不再刷新**，
 * 而且不报错（这类"没反应"的缺陷最难查）。
 */
let subscribedRegistry: SlotRegistry | null = null;

/**
 * 取插槽版本号。
 *
 * @returns 版本号 ref
 */
export function useSlotVersion(): ShallowRef<number>
{
    const slots = getEditorSlots();

    if (subscribedRegistry !== slots)
    {
        subscribedRegistry = slots;
        slots.onChanged(() =>
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
