import { computed } from 'vue';
import type { ComputedRef } from 'vue';
import { getPlugins, getPluginStatus, resetPluginEnabled, setPluginEnabled } from '../../plugins';
import type { PluginStatus } from '../../plugins';
import { usePluginVersion } from './usePluginVersion';

/**
 * 「设置 → 插件」的数据来源：列出全部插件与它们的启用状态，并提供开关。
 *
 * 为什么单独抽一个 composable：`SettingsDialog.vue` 的规范是「`.vue` 只保留 template、
 * 逻辑抽到同名 `.ts`」，而且这份逻辑要读插件注册表——放在组件里会让"设置面板"与
 * "插件机制"耦合在一起。
 *
 * 列表来自 `getPlugins()`（**含被禁用的**）：设置面板的意义就是把它们开回来。
 * 响应式靠 `usePluginVersion()`：插件状态一变，列表就重算（否则开关会"弹回去"）。
 *
 * @returns 插件状态列表与开关函数
 */
export function usePluginSettings(): {
    readonly plugins: ComputedRef<PluginStatus[]>;
    readonly enable: (pluginId: string, enabled: boolean) => void;
    readonly reset: (pluginId: string) => void;
}
{
    const pluginVersion = usePluginVersion();

    const plugins = computed<PluginStatus[]>(() =>
    {
        // 显式依赖：插件状态一变就重算（见 usePluginVersion 的说明）
        void pluginVersion.value;

        return getPlugins()
            .map((manifest) => getPluginStatus(manifest.id))
            .filter((status): status is PluginStatus => status !== null);
    });

    return {
        plugins,
        /** 切换启用状态（必需插件会被拒绝，回读一次即可看到实际状态） */
        enable: (pluginId, enabled) => { setPluginEnabled(pluginId, enabled); },
        /** 清掉用户开关，回到"跟着清单默认走" */
        reset: (pluginId) => { resetPluginEnabled(pluginId); },
    };
}
