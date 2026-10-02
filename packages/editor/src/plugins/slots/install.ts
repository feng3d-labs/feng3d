import { onPluginStateChanged } from '../state';
import { createEffectHost } from './effect';
import { declarePanelSlots, declareSceneOverlaySlot, projectContributions } from './projection';
import { createSlotRegistry } from './registry';
import type { EffectHost } from './effect';
import type { SlotRegistry } from './registry';

/**
 * 编辑器插槽的**安装点**（#276 S2b）。
 *
 * ## 它把哪些东西串起来
 *
 * ```
 * installBuiltinPlugins()          清单进注册表（启用状态、层叠加都在那边）
 *        │
 * installEditorSlots()             ← 本文件
 *        ├─ declare 核心界面座位     声明即认领：这些座位由编辑器的布局组件渲染
 *        ├─ project 当前启用清单     清单 → 插槽的投影（层归并后的赢家）
 *        └─ 订阅插件状态变化         开关一变就重投（先撤销上一次投影）
 *        ▼
 * useSlotEntries() / onChanged     UI 读插槽画界面（MainLayout / SceneView）
 * ```
 *
 * ## 为什么是 lazy 单例
 *
 * 模块顶层 `new SlotRegistry()` 就是 R2 禁止的模块级副作用（门禁
 * `scripts/check-editor-module-effects.mjs` 会报），所以起步是 `null`，由
 * {@link installEditorSlots} 在应用入口显式创建——与 `installBuiltinPlugins()` 同一套纪律。
 *
 * ## 顺序要求
 *
 * `installEditorSlots()` 必须在 **`installBuiltinPlugins()` 之后**、**挂载 Vue 应用之前**调用：
 * 前者保证清单已在注册表里（投影要读它），后者保证首帧就能读到座位内容。
 */

/** 插槽注册表（lazy 单例） */
let editorSlots: SlotRegistry | null = null;

/** 承载"清单投影"生命周期的 effect 宿主 */
let projectionHost: EffectHost | null = null;

/** 上一次投影的撤销函数（重投前先撤——投影是快照，见 `projection.ts`） */
let unproject: (() => void) | null = null;

/** "插件状态变化 → 重投"的订阅（非空即表示已安装） */
let unsubscribePluginState: (() => void) | null = null;

/**
 * 取插槽注册表（没有就建一个）。
 *
 * @returns 注册表
 */
export function getEditorSlots(): SlotRegistry
{
    if (!editorSlots) editorSlots = createSlotRegistry();

    return editorSlots;
}

/**
 * 安装插槽：声明核心座位 + 投影当前启用的清单 + 订阅插件状态变化。
 *
 * 幂等：重复调用只是重投一次（不会重复声明座位、也不会重复订阅）。
 *
 * @returns 已声明的座位数 / 已投影的占用数（诊断用）
 */
export function installEditorSlots(): { readonly slots: number; readonly entries: number }
{
    const slots = getEditorSlots();

    if (!unsubscribePluginState)
    {
        // 座位由**渲染它们的一方**声明；这里声明的是编辑器核心自己渲染的界面座位
        // （插件的座位由插件自己的 client 半在装载时声明）
        declarePanelSlots(slots);
        declareSceneOverlaySlot(slots);

        unsubscribePluginState = onPluginStateChanged(() => { reproject(); });
    }

    reproject();

    return { slots: slots.declaredSlots().length, entries: slots.snapshot().entries.length };
}

/**
 * 按当前启用的清单**重投**插槽内容（先撤销上一次投影）。
 *
 * 交给 `onPluginStateChanged` 的就是它——插件启用/禁用、用户 patch 生效之后，
 * 插槽内容自动对齐（不需要谁手工调）。
 *
 * **撤销与重投必须在同一个批里**：投影是"先撤后加"，撤销阶段会经过"座位上一个占用都没有"的
 * 中间态（`projectContributions` 只保证**它自己**那一段是原子的）。若这一个批漏了撤销，
 * 订阅者会先看到空集合、再看到新集合：界面侧（`MainLayout.vue` 的 `sameTabIds` 守卫）
 * 会因此把四个标签区都替换掉——**用户手工调整过的布局就没了**（实测：关掉只贡献浮层的粒子插件
 * 也会清空标签区）。见决策稿 §3.7 要点 5，守门用例在 `test/slotInstall.spec.ts`。
 */
export function reproject(): void
{
    const slots = getEditorSlots();
    const host = projectionHost ?? (projectionHost = createEffectHost());

    slots.batch(() =>
    {
        unproject?.();
        unproject = projectContributions(slots, host);
    });
}

/**
 * 复位安装状态（**只给单元测试**：注册表与订阅都是模块级状态，用例之间必须能互相隔离）。
 */
export function resetEditorSlots(): void
{
    unproject?.();
    unproject = null;
    unsubscribePluginState?.();
    unsubscribePluginState = null;
    projectionHost?.dispose();
    projectionHost = null;
    editorSlots?.reset();
    editorSlots = null;
}
