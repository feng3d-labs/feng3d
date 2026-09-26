import { shallowRef } from 'vue';
import type { ShallowRef } from 'vue';
import { onPluginStateChanged } from '../../plugins';

/**
 * 插件启用状态的**版本号**：读它即可在插件开关变化时重新求值。
 *
 * ## 为什么需要它
 *
 * 插件清单的查询（`getPanelContributions()` / `getSceneOverlays()` …）是**普通函数**，
 * 不是 Vue 的响应式数据——核心不该为了 UI 而依赖 Vue（`src/plugins/` 里没有一行 Vue 代码）。
 * 于是"插件被关掉后界面要跟着变"这件事，靠这个版本号桥接：
 *
 * ```ts
 * const pluginVersion = usePluginVersion();
 * const overlays = computed(() => {
 *     void pluginVersion.value;              // 显式建立依赖：开关变 → 重算
 *     return getSceneOverlays().map(toView);
 * });
 * ```
 *
 * `void xxx.value` 是"只订阅、不用值"的惯用写法，注释必须写清——否则下一个读代码的人
 * 会以为是多余的一行而删掉，然后界面在关闭插件后不再更新（这类缺陷很难查：
 * 功能没报错，只是"没反应"）。
 *
 * ## 模块级单例
 *
 * 版本号与订阅都是全局一份（多个组件读同一个版本号），所以订阅只在**第一次使用**时建立，
 * 不做模块级副作用（对齐 R2：import 本模块不执行代码）。
 *
 * @returns 版本号 ref（`shallowRef`：值只是个数字）
 */
const r_pluginVersion = shallowRef(0);

/** 是否已建立订阅（模块级单例，只建一次） */
let subscribed = false;

export function usePluginVersion(): ShallowRef<number>
{
    if (!subscribed)
    {
        subscribed = true;
        onPluginStateChanged(() =>
        {
            r_pluginVersion.value++;
        });
    }

    return r_pluginVersion;
}
