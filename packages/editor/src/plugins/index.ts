export * from './types';
export * from './registry';
export * from './install';
export { BUILTIN_PLUGINS } from './builtin';
export { LOGIC_PLUGINS } from './builtinLogics';
export { OBJECT_VIEW_PLUGIN } from './builtinObjectView';

import { BUILTIN_PLUGINS } from './builtin';
import { applyPluginContributions } from './install';
import { registerPlugins } from './registry';

/**
 * 安装内置插件：先把清单登记进注册表，再把需要落到引擎全局注册表的贡献点（Logic）执行掉。
 *
 * **显式调用**（由 `vue-app/main.ts` 在挂载前调用一次），不做模块级副作用——
 * 这是与 R2 对齐的关键：import 本模块不会注册任何东西，"有哪些功能"始终由清单决定。
 *
 * 幂等：`registerPlugins` 同 id 跳过；`registerLogic` 同名覆盖本就是它的语义。
 * 门禁见 `scripts/check-editor-module-effects.mjs`（issue #170）。
 */
export function installBuiltinPlugins(): void
{
    registerPlugins(BUILTIN_PLUGINS);
    applyPluginContributions(BUILTIN_PLUGINS);
}
