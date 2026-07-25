import { Frustum, Matrix4x4, Ray3, Vector2, Vector3 } from '@feng3d/math';
import { logic as getLogic, registerLogic } from '@feng3d/reactivity';
import { Component3D, Component3DLogic, componentLogic } from '../component/Component';

// 引入全局 CameraUniforms 类型声明
import '../render/data/Uniform';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        Camera: Camera;
    }
}

/**
 * Camera（纯数据接口，抽象基类）。
 *
 * Camera 本身不持有投影参数，`__type__` 声明为宽松 string，由子类 PerspectiveCamera /
 * OrthographicCamera 各自 narrow 到具体字面量。直接使用 `__type__: 'Camera'` 创建的实例
 * 没有投影矩阵，渲染时不会有有效输出——请改用具体子类。
 */
export interface Camera extends Component3D
{
    readonly __type__: string;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Camera: CameraLogic;
    }
}

/**
 * Camera 逻辑处理接口（抽象基类）。
 *
 * 子类（PerspectiveCameraLogic / OrthographicCameraLogic）必须覆写：
 * - projectionMatrix：投影矩阵（依赖自身字段 computed）
 * - viewProjection / frustum / uniforms：由 projectionMatrix + 相机变换派生
 * - project / unproject / getRay3D：投影/逆投影（透视需齐次除法）
 *
 * 基类提供 throw 占位实现，子类通过 Object.defineProperties / 直接赋值覆写。
 */
export interface CameraLogic extends Component3DLogic
{
    /** 投影矩阵（子类覆写） */
    readonly projectionMatrix: Matrix4x4;
    /** 场景投影矩阵 = world2local × projectionMatrix（子类覆写） */
    readonly viewProjection: Matrix4x4;
    /** 截头锥体（子类覆写） */
    readonly frustum: Frustum;
    /** 相机 uniform（子类覆写） */
    readonly uniforms: CameraUniforms;
    /** 获取与坐标重叠的射线（子类覆写） */
    getRay3D(x: number, y: number, ray3D?: Ray3): Ray3;
    /** 投影坐标（子类覆写） */
    project(point3d: Vector3): Vector3;
    /** 屏幕坐标投影到场景坐标（子类覆写） */
    unproject(sX: number, sY: number, sZ: number, v?: Vector3): Vector3;
    /** 获取指定深度处的视野尺寸（子类覆写） */
    getScaleByDepth(depth: number, dir?: Vector2): number;
}

/** 抽象占位：子类未覆写时调用会抛错 */
function abstractGetter(name: string): never
{
    throw new Error(`Camera.${name} 未实现：请使用 PerspectiveCamera 或 OrthographicCamera，而非抽象基类 Camera`);
}

/**
 * 创建 CameraLogic 实例（工厂函数，组合 componentLogic 基础行为）。
 *
 * 基类仅提供抽象占位，具体行为由子类 logic（perspectiveCameraLogic/orthographicCameraLogic）
 * 通过 Object.defineProperties / 直接赋值覆写。
 */
export function cameraLogic(camera: Camera): CameraLogic
{
    const base = componentLogic(camera);

    // 抽象占位：子类必须覆写
    Object.defineProperties(base, {
        projectionMatrix: {
            get(): Matrix4x4 { abstractGetter('projectionMatrix'); },
            enumerable: true, configurable: true,
        },
        viewProjection: {
            get(): Matrix4x4 { abstractGetter('viewProjection'); },
            enumerable: true, configurable: true,
        },
        frustum: {
            get(): Frustum { abstractGetter('frustum'); },
            enumerable: true, configurable: true,
        },
        uniforms: {
            get(): CameraUniforms { abstractGetter('uniforms'); },
            enumerable: true, configurable: true,
        },
    });

    (base as unknown as Record<string, unknown>).beforeRender = function () { /* Camera 无 beforeRender，uniform 由 ForwardRenderer 注入 */ };
    (base as unknown as Record<string, unknown>).getRay3D = function (): Ray3
    {
        abstractGetter('getRay3D');
    };
    (base as unknown as Record<string, unknown>).project = function (): Vector3
    {
        abstractGetter('project');
    };
    (base as unknown as Record<string, unknown>).unproject = function (): Vector3
    {
        abstractGetter('unproject');
    };
    (base as unknown as Record<string, unknown>).getScaleByDepth = function (): number
    {
        abstractGetter('getScaleByDepth');
    };

    return base as unknown as CameraLogic;
}
// 注册到分发表（保留 Camera 类型可被 getComponent('Camera') 查询，子类继承覆盖）
registerLogic('Camera', cameraLogic);

/**
 * CameraUniforms WGSL 片段（struct + binding 声明）。
 *
 * 与 CameraLogic.uniforms 计算结果对应：
 * - @group(0) @binding(1) var<uniform> cameraUniforms 由 ForwardRenderer 注入。
 * - 字段：u_projectionMatrix / u_viewProjection / u_viewMatrix / u_cameraMatrix /
 *   u_cameraPos / u_skyBoxSize / u_scaleByDepth。
 *
 * 各材质顶点/片段着色器通过字符串拼接复用本片段，避免 struct 重复声明。
 */
export const cameraUniformsWGSL = `
struct CameraUniforms {
    u_projectionMatrix: mat4x4<f32>,
    u_viewProjection: mat4x4<f32>,
    u_viewMatrix: mat4x4<f32>,
    u_cameraMatrix: mat4x4<f32>,
    u_cameraPos: vec3<f32>,
    u_skyBoxSize: f32,
    u_scaleByDepth: f32,
}

@group(0) @binding(1) var<uniform> cameraUniforms: CameraUniforms;
`;
