export * from './types';
export * from './registry';
export { BUILTIN_PLUGINS } from './builtin';

import { BUILTIN_PLUGINS } from './builtin';
import { registerPlugins } from './registry';

/**
 * 安装内置插件。
 *
 * **显式调用**（由 `vue-app/main.ts` 在挂载前调用一次），不做模块级副作用——
 * 这是与 R2 对齐的关键：import 本模块不会注册任何东西，"有哪些功能"始终由这份清单决定。
 * 门禁见 issue #170。
 */
export function installBuiltinPlugins(): void
{
    registerPlugins(BUILTIN_PLUGINS);
}
