import { Frustum, Matrix4x4, Ray3, Vector2, Vector3 } from '@feng3d/math';
import { reactive, registerLogic } from '@feng3d/reactivity';
import { BufferBinding } from '@feng3d/webgpu';
import { Component3D, ComponentLogicBase } from '../component/Component';
import type { Object3D } from '../core/Object3D';

export interface CameraUniforms
{
    /**
    * 投影矩阵
    */
    u_projectionMatrix?: Matrix4x4;

    /**
     * 世界投影矩阵
     */
    u_viewProjection?: Matrix4x4;

    /**
     * （view矩阵）摄像机逆矩阵
     */
    u_viewMatrix?: Matrix4x4;
    /**
     * 摄像机矩阵
     */
    u_cameraMatrix?: Matrix4x4;
    /**
     * 摄像机位置
     */
    u_cameraPos?: Vector3;
    /**
     * 天空盒尺寸
     */
    u_skyBoxSize?: number;
    /**
     * 单位深度映射到屏幕像素值
     */
    u_scaleByDepth?: number;
}

declare module '../component/Component'
{
    export interface ComponentMap
    {
        Camera: Camera;
    }
}

declare module '@feng3d/webgpu'
{
    interface BindingResources
    {
        cameraUniforms?: BufferBinding<CameraUniforms>;
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
    /**
     * 是否开启视锥体剔除（默认 true，缺失时按 true 处理）。
     *
     * false 时跳过相机视锥体与物体包围盒的相交判断，所有可见物体都参与渲染。
     * 用于调试、UI 摄像机、特殊后处理等不希望被视锥体裁剪的场景。
     */
    readonly frustumCulling?: boolean;
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

/** 抽象占位：子类未覆写时调用会抛错 */
function abstractGetter(name: string): never
{
    throw new Error(`Camera.${name} 未实现：请使用 PerspectiveCamera 或 OrthographicCamera，而非抽象基类 Camera`);
}

/**
 * Camera 逻辑类（抽象基类）。
 *
 * 子类（PerspectiveCameraLogic / OrthographicCameraLogic）必须覆写：
 * - projectionMatrix：投影矩阵（依赖自身字段 computed）
 * - viewProjection / frustum / uniforms：由 projectionMatrix + 相机变换派生
 * - project / unproject / getRay3D：投影/逆投影（透视需齐次除法）
 *
 * 基类提供 throw 占位实现，子类通过 Object.defineProperties / 直接赋值覆写
 * （own property 覆盖继承的原型成员，兼容）。
 */
export class CameraLogic extends ComponentLogicBase
{
    protected constructor(data: Camera)
    {
        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口，供组合函数与子类使用） */
    static create(data: Camera): CameraLogic
    {
        return new CameraLogic(data);
    }

    get entity(): Object3D | null
    {
        return this._entity as Object3D | null;
    }

    /** 投影矩阵（子类覆写） */
    get projectionMatrix(): Matrix4x4 { return abstractGetter('projectionMatrix'); }

    /** 场景投影矩阵 = world2local × projectionMatrix（子类覆写） */
    get viewProjection(): Matrix4x4 { return abstractGetter('viewProjection'); }

    /** 截头锥体（子类覆写） */
    get frustum(): Frustum { return abstractGetter('frustum'); }

    /**
     * 是否开启视锥体剔除（读 camera.frustumCulling，默认 true）。
     * Scene/ForwardRenderer 在剔除前查询此值，false 时跳过 intersectsBox 判断。
     */
    get frustumCulling(): boolean
    {
        const v = reactive(this._component as Camera).frustumCulling;

        return v === undefined ? true : v;
    }

    /** 相机 uniform（子类覆写） */
    get uniforms(): CameraUniforms { return abstractGetter('uniforms'); }

    /** Camera 无 beforeRender，uniform 由 ForwardRenderer 注入 */
    beforeRender(renderObject: never): void { /* no-op */ }

    /** 获取与坐标重叠的射线（子类覆写） */
    getRay3D(_x: number, _y: number, _ray3D?: Ray3): Ray3
    {
        abstractGetter('getRay3D');
    }

    /** 投影坐标（子类覆写） */
    project(_point3d: Vector3): Vector3
    {
        abstractGetter('project');
    }

    /** 屏幕坐标投影到场景坐标（子类覆写） */
    unproject(_sX: number, _sY: number, _sZ: number, _v?: Vector3): Vector3
    {
        abstractGetter('unproject');
    }

    /** 获取指定深度处的视野尺寸（子类覆写） */
    getScaleByDepth(_depth: number, _dir?: Vector2): number
    {
        abstractGetter('getScaleByDepth');
    }
}

/**
 * 组合函数：创建 CameraLogic 实例（抽象占位，子类工厂的组合入口）。
 */
export function cameraLogic(data: Camera): CameraLogic
{
    return CameraLogic.create(data);
}

// 注册到 logic 分发表（保留 Camera 类型可被 getComponent('Camera') 查询，子类继承覆盖）
registerLogic('Camera', CameraLogic as unknown as new (data: Camera) => CameraLogic);

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
