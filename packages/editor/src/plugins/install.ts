import { objectview } from 'feng3d';
import { registerLogic, unregisterLogic } from '@feng3d/reactivity';
import type { EditorPluginManifest, ObjectViewContribution } from './types';

/**
 * 把清单里声明的贡献点落到**引擎侧的全局注册表**。
 *
 * ## 为什么需要这一步
 *
 * 面板与浮层是"读注册表就有"的：核心按 id 向注册表要视图，不需要额外动作。
 * 而 Logic 与属性面板配置不同——`registerLogic` / `setDefaultTypeAttributeView` 写的是
 * feng3d 的全局注册表，**必须有人真的调用它**。这一步就是那个调用点，并且**只有一个**：
 * 想找"编辑器的 Logic 与属性控件是在哪儿注册的"，只有这一个答案，不必去猜 import 顺序。
 *
 * ## 为什么它不在 registry.ts 里
 *
 * `registry.ts` 是纯数据结构（登记清单、回答查询、查冲突），不碰任何全局状态；
 * 把全局副作用集中在本文件，是为了"哪些操作会改动全局"这件事只有一个出入口。
 *
 * ## 装与卸成对
 *
 * {@link applyPluginContributions} 与 {@link revertPluginContributions} 是同一件事的两面，
 * 必须在同一个文件里——插件被关掉时要卸得掉，否则"禁用"只是界面上看不见而已（issue #169）。
 *
 * @param manifests 要安装的插件清单（调用方已按启用状态筛过）
 */
export function applyPluginContributions(manifests: readonly EditorPluginManifest[]): void
{
    for (const manifest of manifests)
    {
        for (const entry of manifest.contributes.logics ?? [])
        {
            // 清单只声明"类型名 → 哪个类"，不重复类的入参类型（那由各 Logic 自己保证）。
            // registerLogic 的签名要求工厂收 `{ __type__: string }`，此处一次断言即可，
            // 换来 23 处清单字面量都不必写断言。
            registerLogic(entry.name, entry.logic as unknown as new (data: { readonly __type__: string }) => unknown);
        }

        if (manifest.contributes.objectView) applyObjectView(manifest.contributes.objectView);
    }
}

/**
 * 撤掉清单声明里**可撤**的贡献点。
 *
 * 目前可撤的只有 Logic（`unregisterLogic`）。属性面板配置**不可撤**：它写进的是
 * `objectview` 单例的默认值，撤掉等于把面板恢复成"没有控件映射"的半死状态——
 * 所以那一类插件在清单里标 `required: true`（不许关），而不是让这里假装能卸干净。
 *
 * 面板 / 浮层 / 桥接方法不需要"卸"：它们的查询与合并都是**每次现算**的
 * （见 `registry.ts` 的 `getEnabledPlugins()` 与 `EditorBridge.ts` 的方法表），
 * 插件一被禁用就自动不在结果里。
 *
 * 已创建对象的 Logic **实例**不会被回收（见 `unregisterLogic` 的说明）。
 *
 * @param manifests 要卸载的插件清单
 * @returns 真正注销掉的类型名（诊断用）
 */
export function revertPluginContributions(manifests: readonly EditorPluginManifest[]): readonly string[]
{
    const reverted: string[] = [];

    for (const manifest of manifests)
    {
        for (const entry of manifest.contributes.logics ?? [])
        {
            if (unregisterLogic(entry.name)) reverted.push(entry.name);
        }
    }

    return reverted;
}

/**
 * 应用属性面板（objectview）配置。
 *
 * 四个默认视图类名逐个判 `undefined` 再写：清单里省略某个字段时**不该把已有值清空**
 * （将来多个插件各贡献一部分配置时，后者不写就是"不管"，而不是"重置"）。
 *
 * @param contribution 清单里的属性面板配置
 */
function applyObjectView(contribution: ObjectViewContribution): void
{
    const defaults = contribution.defaults;

    if (defaults?.baseObjectView !== undefined) objectview.defaultBaseObjectViewClass = defaults.baseObjectView;
    if (defaults?.objectView !== undefined) objectview.defaultObjectViewClass = defaults.objectView;
    if (defaults?.objectAttributeView !== undefined) objectview.defaultObjectAttributeViewClass = defaults.objectAttributeView;
    if (defaults?.objectAttributeBlockView !== undefined) objectview.defaultObjectAttributeBlockView = defaults.objectAttributeBlockView;

    for (const entry of contribution.typeAttributeViews ?? [])
    {
        objectview.setDefaultTypeAttributeView(entry.type, entry.view);
    }

    if (contribution.dataTypeSchema) objectview.setDataTypeSchema(contribution.dataTypeSchema);
    if (contribution.objectViewConfig) objectview.setObjectViewConfig(contribution.objectViewConfig);
}
