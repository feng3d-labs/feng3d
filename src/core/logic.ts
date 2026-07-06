/**
 * logic 机制已下沉到 `@feng3d/reactivity`（最底层包，core 与 webgpu 均依赖）。
 *
 * 本文件仅作重导出，保持 `from '../core/logic'` / `from './core/logic'` 等
 * 既有 import 路径可用，避免大范围改动。
 *
 * 实际实现见 `packages/reactivity/src/logic.ts`。
 */
export { logic, registerLogic, registerDefaults } from '@feng3d/reactivity';
