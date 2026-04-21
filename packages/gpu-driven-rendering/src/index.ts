/**
 * @feng3d/gpu-driven-rendering
 *
 * WebGPU 全GPU驱动渲染系统
 *
 * 提供高性能的 GPU 自治渲染解决方案，支持：
 * - GPU生成绘制命令
 * - 视锥剔除和LOD选择
 * - 不透明/透明物体分类渲染
 * - 批量渲染和间接绘制
 */

// 主渲染器
export { GPUDrivenRenderer } from './core/GPUDrivenRenderer.js';

// 核心类型
export type {
    DrawIndexedIndirect,
    ObjectData,
    LODLevel,
    Material,
    MaterialType,
    Camera,
    RenderStats,
    GPUDrivenRendererOptions,
    RenderResult,
} from './core/types.js';

// 枚举
export { MaterialType } from './core/types.js';

// 常量
export { DRAW_INDEXED_INDIRECT_SIZE } from './core/types.js';

// 缓冲管理器
export { ObjectBuffer } from './core/ObjectBuffer.js';
export { MaterialBuffer } from './core/MaterialBuffer.js';
export { IndirectBuffer } from './core/IndirectBuffer.js';

// WGSL 着色器代码（供外部使用）
export { OBJECT_DATA_WGSL } from './core/ObjectBuffer.js';
export { MATERIAL_DATA_WGSL } from './core/MaterialBuffer.js';
export { INDIRECT_DRAW_WGSL, getMultiMaterialIndirectDrawWGSL } from './core/IndirectBuffer.js';
