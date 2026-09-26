import { objectview } from 'feng3d';
import { registerLogic } from '@feng3d/reactivity';
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
 * @param manifests 已登记的插件清单
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
