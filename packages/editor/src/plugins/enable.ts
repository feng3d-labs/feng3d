import { getPluginStatus, getPlugins, registerPlugins } from './registry';
import { applyPluginContributions, revertPluginContributions } from './install';
import { clearPluginSwitch, getDroppedSwitches, reconcilePluginState, resolvePluginEnabled, setPluginEnabledState } from './state';
import type { EditorPluginManifest } from './types';

/**
 * 插件启用/禁用的**编排层**（issue #169）。
 *
 * 分三层，每层只做一件事：
 *
 * | 层 | 文件 | 职责 |
 * |---|---|---|
 * | 状态 | `state.ts` | 推导（required → 用户开关 → 清单默认）、持久化、按已安装状态对账 |
 * | 贡献点 | `install.ts` | 把声明落到引擎全局注册表 / 撤回来 |
 * | 编排 | 本文件 | 把上面两层串成"改一个开关"这一件事，并保证幂等 |
 *
 * 面板 / 浮层 / 桥接方法不需要在这里"装"或"卸"：它们的查询是每次现算的
 * （`registry.ts` 只遍历启用的插件、`EditorBridge.ts` 的方法表现算），
 * 状态一改它们立刻跟着变。
 */

/**
 * 安装一批插件：先登记清单，再把**启用**的那些的贡献点落到引擎侧。
 *
 * 阶段顺序有讲究：登记（`registerPlugins`）必须包含**被禁用的**插件
 * ——设置面板要能把它们列出来才好开回来；只有扫描贡献点时按启用状态过滤。
 *
 * @param manifests 插件清单
 * @returns 登记数 / 实际安装数 / 本次对账丢掉的开关
 */
export function installPlugins(manifests: readonly EditorPluginManifest[]): {
    readonly installed: number;
    readonly enabled: number;
    readonly droppedSwitches: readonly string[];
}
{
    registerPlugins(manifests);

    // 对账放在登记之后：此刻"已安装"的集合才准（含本次新登记的）
    const installed = getPlugins();
    const droppedSwitches = reconcilePluginState(installed);

    const enabled = installed.filter((manifest) => resolvePluginEnabled(manifest));
    applyPluginContributions(enabled);

    return { installed: installed.length, enabled: enabled.length, droppedSwitches };
}

/**
 * 启用/禁用一个插件（改状态 + 装/卸贡献点）。
 *
 * 幂等：状态没变时**不动全局注册表**（重复调用不该产生任何副作用）。
 *
 * @param pluginId 插件 id
 * @param enabled 期望的启用状态
 * @returns 实际生效的启用状态；插件不存在时返回 `null`
 */
export function setPluginEnabled(pluginId: string, enabled: boolean): boolean | null
{
    const status = getPluginStatus(pluginId);
    if (!status) return null;

    // 必需插件拒绝关闭：返回它实际的状态，而不是入参
    if (status.required) return true;

    const before = status.enabled;
    const after = setPluginEnabledState(status.manifest, enabled);

    if (after !== before)
    {
        if (after) applyPluginContributions([status.manifest]);
        else revertPluginContributions([status.manifest]);
    }

    return after;
}

/**
 * 清掉某个插件的用户开关，让它回到"跟着清单默认走"，并把状态变化落到贡献点上。
 *
 * @param pluginId 插件 id
 * @returns 实际生效的启用状态；插件不存在时返回 `null`
 */
export function resetPluginEnabled(pluginId: string): boolean | null
{
    const status = getPluginStatus(pluginId);
    if (!status) return null;

    if (!status.userSwitch) return status.enabled;

    clearPluginSwitch(pluginId);

    const after = resolvePluginEnabled(status.manifest);
    if (after !== status.enabled)
    {
        if (after) applyPluginContributions([status.manifest]);
        else revertPluginContributions([status.manifest]);
    }

    return after;
}

export { getDroppedSwitches };
