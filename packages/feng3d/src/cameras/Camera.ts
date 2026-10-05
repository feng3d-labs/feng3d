import { Frustum, Matrix4x4, Ray3, Vector2Like, Vector3, Vector3Like, WritableVector3Like } from '@feng3d/math';
import { reactive, registerLogic } from '@feng3d/reactivity';
import { BufferBinding } from '@feng3d/webgpu';
import { createComponentLogicBase, type Component3D, type Component3DLogic, type ComponentLogicState } from '../component/Component';
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
     * 摄像机位置（任意提供 `x/y/z` 的对象，不必是 `Vector3` 实例）
     */
    u_cameraPos?: Vector3Like;
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
    /**
     * 具体相机子接口的字面量（不再是宽松的 `string`）。
     *
     * 注：按 ARCHITECTURE_V2 $11.4，抽象基接口本不声明 `__type__`；但 `logic()` 的入参类型是
     * `{ __type__: keyof LogicMap }`，直接移除会让 `logic(camera)` 这类调用出现 10 处类型错误。
     * 这里收紧为**具体子接口的联合**——既拦住 `{ __type__: 'Camera' }`（构造抽象基接口）的写法，
     * 又与 `logic()` 的签名兼容；彻底移除需要先放宽 `logic()` 的签名（独立议题）。
     */
    readonly __type__: 'PerspectiveCamera' | 'OrthographicCamera';
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

/** 抽象占位：子类未覆写时调用会抛错 */
function abstractGetter(name: string): never
{
    throw new Error(`Camera.${name} 未实现：请使用 PerspectiveCamera 或 OrthographicCamera，而非抽象基类 Camera`);
}

/**
 * Camera 逻辑接口（抽象基类，issue #674 工厂函数范式）。
 *
 * 子类（PerspectiveCameraLogic / OrthographicCameraLogic）必须覆写：
 * - projectionMatrix：投影矩阵（依赖自身字段 computed）
 * - viewProjection / frustum / uniforms：由 projectionMatrix + 相机变换派生
 * - project / unproject / getRay3D：投影/逆投影（透视需齐次除法）
 *
 * 基类提供 throw 占位实现，子类经 {@link createCameraLogicBase} 组合后覆写。
 */
export interface CameraLogic extends Component3DLogic
{
    /** 投影矩阵（子类覆写） */
    readonly projectionMatrix: Matrix4x4;

    /** 场景投影矩阵 = world2local × projectionMatrix（子类覆写） */
    readonly viewProjection: Matrix4x4;

    /** 截头锥体（子类覆写） */
    readonly frustum: Frustum;

    /**
     * 是否开启视锥体剔除（读 camera.frustumCulling，默认 true）。
     * Scene/ForwardRenderer 在剔除前查询此值，false 时跳过 intersectsBox 判断。
     */
    readonly frustumCulling: boolean;

    /** 相机 uniform（子类覆写） */
    readonly uniforms: CameraUniforms;

    /** 获取与坐标重叠的射线（子类覆写） */
    getRay3D(_x: number, _y: number, _ray3D?: Ray3): Ray3;

    /**
     * 投影坐标（子类覆写）。
     * @param _point3d 世界坐标点（任意提供 `x/y/z` 的对象，不必是 `Vector3` 实例）
     */
    project(_point3d: Vector3Like): Vector3;

    /**
     * 屏幕坐标投影到场景坐标（子类覆写）。
     *
     * 第 4 个参数 `v` 是**可选的复用输出目标**：传 `Vector3` 实例时返回同一实例
     * （返回类型仍是 `Vector3`），传普通 `{ x, y, z }` 对象时原样返回它
     * （返回类型为 `WritableVector3Like`）。用**重载**而不是把参数直接放宽，
     * 是为了不让「只传 3 个参数」的调用方拿到退化的返回类型（P8c）。
     */
    unproject(sX: number, sY: number, sZ: number): Vector3;
    unproject(sX: number, sY: number, sZ: number, v: Vector3): Vector3;
    unproject(sX: number, sY: number, sZ: number, v: WritableVector3Like): WritableVector3Like;

    /**
     * 获取指定深度处的视野尺寸（子类覆写）。
     * @param _dir 屏幕方向比例（任意提供 `x/y` 的对象）
     */
    getScaleByDepth(_depth: number, _dir?: Vector2Like): number;
}

/**
 * 创建 Camera 系 Logic 的**基类状态与成员**（供子类工厂组合调用）。
 *
 * 形态：工厂闭包直接返回对象字面量（无共享 proto、无 this）。
 *
 * @param data 相机数据（raw）
 * @returns Camera 系 Logic 的基类状态与成员（state 与 Component 基座共享）
 */
export function createCameraLogicBase(data: Camera): { state: ComponentLogicState; members: CameraLogic }
{
    // Camera 是抽象基接口，不在 Components 联合里；strictNullChecks 下需显式断言
    const { state, members: componentMembers } = createComponentLogicBase(data);

    const members: CameraLogic = {
        /** 关联的组件数据（raw） */
        get component() { return componentMembers.component; },
        /** 所属 Object3D（覆写基类 getter，把 entity 收窄为 Object3D） */
        get entity() { return state.entity as Object3D | null; },
        /** 初始化：注入 entity */
        init(entity) { componentMembers.init(entity); },
        /** Camera 无 beforeRender，uniform 由 ForwardRenderer 注入 */
        beforeRender(_renderObject) { /* no-op */ },
        /** 是否加载完成（继承 Component 基类） */
        get isLoaded() { return componentMembers.isLoaded; },
        /** 释放（继承 Component 基类） */
        dispose() { componentMembers.dispose(); },
        /** 投影矩阵（子类覆写） */
        get projectionMatrix() { return abstractGetter('projectionMatrix'); },
        /** 场景投影矩阵 = world2local × projectionMatrix（子类覆写） */
        get viewProjection() { return abstractGetter('viewProjection'); },
        /** 截头锥体（子类覆写） */
        get frustum() { return abstractGetter('frustum'); },
        /**
         * 是否开启视锥体剔除（读 camera.frustumCulling，默认 true）。
         * Scene/ForwardRenderer 在剔除前查询此值，false 时跳过 intersectsBox 判断。
         */
        get frustumCulling()
        {
            const v = reactive(state.component as Camera).frustumCulling;

            return v === undefined ? true : v;
        },
        /** 相机 uniform（子类覆写） */
        get uniforms() { return abstractGetter('uniforms'); },
        /** 获取与坐标重叠的射线（子类覆写） */
        getRay3D(_x, _y, _ray3D)
        {
            abstractGetter('getRay3D');
        },
        /**
         * 投影坐标（子类覆写）。
         * @param _point3d 世界坐标点（任意提供 `x/y/z` 的对象，不必是 `Vector3` 实例）
         */
        project(_point3d)
        {
            abstractGetter('project');
        },
        // 接口 unproject 是重载；对象字面量的实现签名与重载集合不兼容，
        // 这里显式断言为接口的重载类型（实现体委托 abstractGetter 抛错，等价旧 proto）
        unproject: ((_sX: number, _sY: number, _sZ: number, _v?: WritableVector3Like) =>
        {
            abstractGetter('unproject');
        }) as unknown as CameraLogic['unproject'],
        /**
         * 获取指定深度处的视野尺寸（子类覆写）。
         * @param _dir 屏幕方向比例（任意提供 `x/y` 的对象）
         */
        getScaleByDepth(_depth, _dir)
        {
            abstractGetter('getScaleByDepth');
        },
    };

    return { state, members };
}

/**
 * 工厂函数：CameraLogic 的唯一创建入口（抽象占位，子类工厂的组合入口）。
 *
 * @param data 相机数据（raw）
 */
export function cameraLogic(data: Camera): CameraLogic
{
    const { members } = createCameraLogicBase(data);

    const logic: CameraLogic = {
        get component() { return members.component; },
        get entity() { return members.entity; },
        init(entity) { members.init(entity); },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        get isLoaded() { return members.isLoaded; },
        dispose() { members.dispose(); },
        get projectionMatrix() { return members.projectionMatrix; },
        get viewProjection() { return members.viewProjection; },
        get frustum() { return members.frustum; },
        get frustumCulling() { return members.frustumCulling; },
        get uniforms() { return members.uniforms; },
        getRay3D(x, y, ray3D) { return members.getRay3D(x, y, ray3D); },
        project(point3d) { return members.project(point3d); },
        // 接口 unproject 是重载；委托成员时同样显式断言为接口的重载类型
        unproject: ((sX: number, sY: number, sZ: number, v?: WritableVector3Like) =>
        {
            return members.unproject(sX, sY, sZ, v as Vector3);
        }) as unknown as CameraLogic['unproject'],
        getScaleByDepth(depth, dir) { return members.getScaleByDepth(depth, dir); },
    };

    return logic;
}

// 注册到 logic 分发表（保留 Camera 类型可被 getComponent('Camera') 查询，子类继承覆盖）
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
