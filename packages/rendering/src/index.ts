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
 * ## 架构设计
 *
 * 本包使用响应式系统自动维护渲染数据：
 * - 通过 @feng3d/webgpu 的 `Buffer` 接口间接管理 GPU 资源
 * - 数据变化时，Submit 结构自动响应更新
 * - 不直接调用 WebGPU API
 *
 * ## 数据流向
 *
 * ```
 * @feng3d/core (场景图)
 *     ↓ ObjectData[], Material[], Camera
 * @feng3d/rendering (GPU 剔除、LOD、命令生成)
 *     ↓ Submit (响应式)
 * @feng3d/webgpu (执行)
 * ```
 *
 * ## 使用方式
 *
 * ```typescript
 * import { WebGPU } from '@feng3d/webgpu';
 * import { GPUDrivenRenderer } from '@feng3d/rendering';
 *
 * // 1. 初始化 WebGPU
 * const webgpu = new WebGPU({ canvas });
 * await webgpu.init();
 *
 * // 2. 创建渲染器
 * const renderer = new GPUDrivenRenderer(webgpu.device, { maxObjects: 10000 });
 *
 * // 3. 设置数据（响应式，自动更新 Submit）
 * renderer.setCamera(cameraData);
 * renderer.setObjects(objectData);
 * renderer.setMaterials(materialData);
 * renderer.setRenderPipeline(pipeline);
 * renderer.setColorAttachment(colorAttachment);
 * renderer.setDepthStencilAttachment(depthAttachment);
 *
 * // 4. 获取响应式 Submit
 * const submit = renderer.submit; // Computed<Submit>
 *
 * // 5. 提交渲染
 * webgpu.submit(submit.value);
 * ```
 *
 * ## 响应式更新
 *
 * 当调用 `setCamera()`, `setObjects()` 等方法时：
 * - 内部状态自动更新
 * - Buffer 数据自动上传到 GPU
 * - Submit 结构自动重新构建
 * - 无需手动调用 `update()` 或 `refresh()`
 */

// 主渲染器
export { GPUDrivenRenderer } from './core/GPUDrivenRenderer.js';

// 核心类型
export type {
    DrawIndexedIndirect,
    ObjectData,
    LODLevel,
    Material,
    Camera,
    GPUDrivenRendererOptions,
    CameraData,
    FrustumData,
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

// 序列化工具函数
export {
    serializeCameraData,
    deserializeCameraData,
    serializeFrustumData,
    deserializeFrustumData,
    serializeObjectTransform,
    deserializeObjectTransform,
    serializeMaterialData,
    deserializeMaterialData,
} from './core/serialization.js';

// WGSL 着色器代码（供外部使用）
export { OBJECT_DATA_WGSL } from './core/ObjectBuffer.js';
export { MATERIAL_DATA_WGSL } from './core/MaterialBuffer.js';
export { INDIRECT_DRAW_WGSL, getMultiMaterialIndirectDrawWGSL } from './core/IndirectBuffer.js';
