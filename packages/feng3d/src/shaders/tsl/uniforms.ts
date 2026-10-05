/**
 * TSL 版的引擎共享 uniform 声明。
 *
 * 与手写 WGSL 片段（`Object3D.transformUniformsWGSL` / `Camera.cameraUniformsWGSL`）保持**同槽位**约定：
 * - `transform` → `@group(0) @binding(0)`
 * - `cameraUniforms` → `@group(0) @binding(1)`
 *
 * 每次调用返回**一组全新的**结构定义与实例：TSL 的依赖收集按对象身份（Set/WeakSet）进行，
 * 一个着色器构建内调用一次即生成一份声明；跨构建复用同一对象会让不同着色器的依赖互相污染。
 */
import { float, mat4, struct, uniform, vec2, vec3, vec4 } from '@feng3d/tsl';

/**
 * 声明 `transform` uniform（TransformUniforms）。
 *
 * 对应数据侧 `Object3DLogic.beforeRender` 写入的 bindingResources.transform。
 *
 * @returns TransformUniforms 实例（成员 u_modelMatrix / u_ITModelMatrix）
 */
export function createTransformUniforms()
{
    const TransformUniforms = struct('TransformUniforms', {
        u_modelMatrix: mat4,
        u_ITModelMatrix: mat4,
    });

    return TransformUniforms(uniform('transform', 0, 0));
}

/**
 * 声明 `cameraUniforms` uniform（CameraUniforms）。
 *
 * 对应数据侧相机统一块写入的 bindingResources.cameraUniforms。
 *
 * @returns CameraUniforms 实例
 */
export function createCameraUniforms()
{
    const CameraUniforms = struct('CameraUniforms', {
        u_projectionMatrix: mat4,
        u_viewProjection: mat4,
        u_viewMatrix: mat4,
        u_cameraMatrix: mat4,
        u_cameraPos: vec3,
        u_skyBoxSize: float,
        u_scaleByDepth: float,
    });

    return CameraUniforms(uniform('cameraUniforms', 0, 1));
}

/**
 * 声明 `globalUniforms` uniform（GlobalUniforms，@group(0) @binding(2)）。
 *
 * 对应 `ForwardRenderer.draw` 注入的 globalUniforms（场景环境光 + 画布像素尺寸）。
 *
 * @returns GlobalUniforms 实例
 */
export function createGlobalUniforms()
{
    const GlobalUniforms = struct('GlobalUniforms', {
        u_sceneAmbientColor: vec4,
        u_Viewport: vec2,
    });

    return GlobalUniforms(uniform('globalUniforms', 0, 2));
}
