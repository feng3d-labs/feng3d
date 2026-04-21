/**
 * @feng3d/rendering
 *
 * WebGPU GPU 驱动渲染系统
 *
 * 提供高性能的 GPU 自治渲染解决方案，支持：
 * - GPU生成绘制命令
 * - 视锥剔除和LOD选择
 * - 不透明/透明物体分类渲染
 * - 批量渲染和间接绘制
 *
 * ## 使用方式
 *
 * ```typescript
 * import { createGPUDriven } from '@feng3d/rendering';
 *
 * const gpu = createGPUDriven({
 *     objects,
 *     materials,
 *     camera,
 *     vertices,
 *     indices,
 *     renderPipeline: pipeline,
 * });
 *
 * // 组装 Submit
 * const submit = {
 *     commandEncoders: [{
 *         passEncoders: [
 *             gpu.computePass,
 *             {
 *                 __type__: 'RenderPass',
 *                 descriptor: {
 *                     colorAttachments: [colorAttachment],
 *                     depthStencilAttachment,
 *                 },
 *                 renderPassObjects: [gpu.opaqueRenderObject, gpu.transparentRenderObject],
 *             },
 *         ],
 *     }],
 * };
 * ```
 */

// 核心 API
export { createGPUDriven } from './core/gpuSubmit.js';

export type {
    GPUDrivenInput,
} from './core/gpuSubmit.js';

// 类 API（兼容）
export { GPUDrivenRenderer } from './core/GPUDrivenRenderer.js';

// 核心类型
export type {
    DrawIndexedIndirect,
    ObjectData,
    LODLevel,
    Material,
    Camera,
    CameraUniformData,
    ObjectTransform,
    MaterialData,
} from './core/types.js';

// 枚举（作为值导出，类型自动导出）
export { MaterialType } from './core/types.js';

// 常量
export {
    DRAW_INDEXED_INDIRECT_SIZE,
    OBJECT_DATA_SIZE,
    MATERIAL_DATA_SIZE,
    CAMERA_DATA_SIZE,
    FRUSTUM_DATA_SIZE,
} from './core/types.js';

// WGSL 着色器代码（供外部使用）
export { OBJECT_DATA_WGSL } from './core/ObjectBuffer.js';
export { MATERIAL_DATA_WGSL } from './core/MaterialBuffer.js';
export { INDIRECT_DRAW_WGSL, getMultiMaterialIndirectDrawWGSL } from './core/IndirectBuffer.js';
