export * from './types';
export * from './registry';
export * from './install';
export * from './state';
export * from './enable';
export { BUILTIN_PLUGINS } from './builtin';
export { LOGIC_PLUGINS } from './builtinLogics';
export { OBJECT_VIEW_PLUGIN } from './builtinObjectView';

import { BUILTIN_PLUGINS } from './builtin';
import { installPlugins } from './enable';

/**
 * 安装内置插件：登记清单 → 按**启用状态**把贡献点落到引擎全局注册表、按已安装状态对账用户开关。
 *
 * **显式调用**（由 `vue-app/main.ts` 在挂载前调用一次），不做模块级副作用——
 * 这是与 R2 对齐的关键：import 本模块不会注册任何东西，"有哪些功能"始终由清单 + 用户开关决定。
 *
 * 幂等：`registerPlugins` 同 id 跳过、`setPluginEnabled` 状态没变时不动全局表。
 * 门禁见 `scripts/check-editor-module-effects.mjs`（issue #170）。
 *
 * @returns 登记数 / 实际安装数 / 本次对账丢掉的开关键
 */
export function installBuiltinPlugins(): {
    readonly installed: number;
    readonly enabled: number;
    readonly droppedSwitches: readonly string[];
}
{
    return installPlugins(BUILTIN_PLUGINS);
}
