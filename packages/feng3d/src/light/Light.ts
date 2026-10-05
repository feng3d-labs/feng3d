import { Color3Like, mat4GetAxisZ, mat4Identity, Matrix4x4, Vector2, Vector3 } from '@feng3d/math';
import { Behaviour, BehaviourLogic, createBehaviourLogicBase, type BehaviourLogicState } from '../component/Behaviour';
import { LightType } from './LightType';
import { ShadowType } from './shadow/ShadowType';
import { logic as getLogic } from '@feng3d/reactivity';
import { Object3D } from '../core/Object3D';
import type { Color3 } from '../core/Color3';
import type { Texture } from '@feng3d/webgpu';


declare module '../component/Component'
{
    export interface ComponentMap
    {
        Light: Light;
    }
}

/**
 * Light（纯数据接口）。
 *
 * 阴影投影矩阵与深度纹理由 LightLogic 持有，不再经过 shadowCamera（Camera 组件）
 * 与 frameBufferObject（颜色附件 RT）中转。
 */
export interface Light extends Behaviour
{
    readonly lightType: LightType;
    /**
     * 光照颜色。缺失时由渲染组装侧兜底（`ForwardRenderer` 里 `color?.r ?? …`）——
     * 方向光取 0（不照亮）、点光/聚光取 1（白）。
     *
     * 声明为 `Color3Like | Color3`（issue #134）：既接受本包的纯数据字面量
     * `{ __type__: 'Color3', r, g, b }`（{@link Color3}），也接受任何只提供 `r/g/b`
     * 的对象——`@feng3d/math` 的 `Color3` class 实例、不带 `__type__` 的 `{ r, g, b }` 字面量。
     */
    readonly color?: Color3Like | Color3;
    /** 光照强度，缺失时按 1 处理（`ForwardRenderer` 里 `intensity ?? 1`）。 */
    readonly intensity?: number;
    /** 阴影类型，缺失时按 `ShadowType.No_Shadows` 处理。 */
    readonly shadowType?: ShadowType;
    /** 阴影偏移，缺失时按 0 处理（`ForwardRenderer` 里 `shadowBias ?? 0`）。 */
    readonly shadowBias?: number;
    readonly shadowRadius: number;
    readonly debugShadowMap: boolean;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Light: LightLogic;
    }
}

/**
 * Light 逻辑接口（issue #674 工厂函数范式）。
 *
 * 继承 BehaviourLogic，额外提供：
 * - position / direction: 由 transform 派生
 * - shadowViewProjection: 阴影投影矩阵（VP），由子类 updateShadowXxx 经
 *   updateShadowParams 写入
 * - shadowCameraNear / shadowCameraFar / shadowMapSize: 阴影参数（供 shader uniform）
 * - shadowMap / debugShadowTexture: 阴影纹理（子类覆写）
 *
 * 子类工厂（DirectionalLight/PointLight/SpotLight）经 {@link createLightLogicBase}
 * 组合函数获取实例后叠加自身行为。
 */
export interface LightLogic extends BehaviourLogic
{
    /** 阴影 view-projection 矩阵（由 updateShadowParams 写入，ShadowRenderer/ForwardRenderer 读取） */
    readonly shadowViewProjection: Matrix4x4;

    /** 阴影相机近平面（由 updateShadowParams 写入，供 shader uniform） */
    readonly shadowNear: number;

    /** 阴影相机远平面（由 updateShadowParams 写入，供 shader uniform） */
    readonly shadowFar: number;

    /** 更新阴影参数（供子类的 updateShadowXxx 方法调用） */
    updateShadowParams(viewProjection: Matrix4x4, near: number, far: number): void;

    /** 光源世界坐标（由 object3D 的 worldPosition 派生） */
    readonly position: Vector3;

    /** 光源方向（object3D 的 local2world Z 轴取反） */
    readonly direction: Vector3;

    /** 阴影相机近平面（供 shader uniform） */
    readonly shadowCameraNear: number;

    /** 阴影相机远平面（供 shader uniform） */
    readonly shadowCameraFar: number;

    /** 阴影图尺寸（默认 1024×1024，PointLight 覆盖为 cubemap atlas 布局 1/4 × 1/2） */
    readonly shadowMapSize: Vector2;

    /** 阴影采样纹理（子类覆盖）。DirectionalLight 不实现（用 shadowDepthTexture） */
    readonly shadowMap: Texture | null;

    /** 调试阴影图用的纹理。子类覆盖：DirectionalLight 返回 shadowDepthTexture，PointLight/SpotLight 返回 shadowMap */
    readonly debugShadowTexture: Texture | null;
}

/**
 * Light 系 Logic 的内部状态（不进公开接口，工厂闭包持有）。
 */
export interface LightLogicState extends BehaviourLogicState
{
    /** 阴影 view-projection 矩阵缓存 */
    shadowViewProjection: Matrix4x4;

    /** 阴影相机近平面，由子类 updateShadowXxx 写入，供 shader uniform */
    shadowNear: number;

    /** 阴影相机远平面，由子类 updateShadowXxx 写入，供 shader uniform */
    shadowFar: number;
}

/**
 * 创建 Light 系 Logic 的**基类状态与成员**（供子类工厂组合调用）。
 *
 * 形态：工厂闭包直接返回对象字面量（无共享 proto、无 this）。
 *
 * @param data 光源数据（raw）
 * @returns Light 系 Logic 的基类状态与成员（state 与 Behaviour 基座共享）
 */
export function createLightLogicBase(data: Light): { state: LightLogicState; members: LightLogic }
{
    const { state: behaviourState, members: behaviourMembers } = createBehaviourLogicBase(data);

    // 与 Behaviour 基座复用同一份 state（entity / component / isVisibleAndEnabled 共用）
    const state = behaviourState as LightLogicState;
    state.shadowViewProjection = { __type__: 'Matrix4x4', ...mat4Identity() };
    state.shadowNear = 0.3;
    state.shadowFar = 1000;

    const members: LightLogic = {
        /** 关联的组件数据（raw） */
        get component() { return behaviourMembers.component; },
        /** 所属 Object3D */
        get entity() { return behaviourMembers.entity; },
        /** 是否可见且启用 */
        get isVisibleAndEnabled() { return behaviourMembers.isVisibleAndEnabled; },
        /** 初始化：注入所属 Object3D（幂等） */
        init(object3D) { behaviourMembers.init(object3D); },
        /** 渲染前回调（默认空） */
        beforeRender(renderObject) { behaviourMembers.beforeRender(renderObject); },
        /** 每帧更新（默认空，子类覆盖） */
        update(interval) { behaviourMembers.update(interval); },
        /** 是否加载完成（继承 Behaviour 基类） */
        get isLoaded() { return behaviourMembers.isLoaded; },
        /** 释放（继承 Behaviour 基类） */
        dispose() { behaviourMembers.dispose(); },
        /** 阴影 view-projection 矩阵（由 updateShadowParams 写入，ShadowRenderer/ForwardRenderer 读取） */
        get shadowViewProjection() { return state.shadowViewProjection; },
        /** 阴影相机近平面（由 updateShadowParams 写入，供 shader uniform） */
        get shadowNear() { return state.shadowNear; },
        /** 阴影相机远平面（由 updateShadowParams 写入，供 shader uniform） */
        get shadowFar() { return state.shadowFar; },
        /** 更新阴影参数（供子类的 updateShadowXxx 方法调用） */
        updateShadowParams(viewProjection, near, far)
        {
            state.shadowViewProjection = viewProjection;
            state.shadowNear = near;
            state.shadowFar = far;
        },
        /** 光源世界坐标（由 object3D 的 worldPosition 派生） */
        get position()
        {
            return getLogic(state.entity as Object3D).worldPosition;
        },
        /** 光源方向（object3D 的 local2world Z 轴取反） */
        get direction(): Vector3
        {
            // 光发射方向 = 本地 -Z（投影矩阵 m[11]=-1，相机/光源 forward 为 -Z）
            // 阶段 C-e：`Matrix4x4.getAxisZ` 已删除，缺省 out 是纯字面量（没有 Vector3 的方法），
            // 而本 getter 的返回类型是 `Vector3`，所以显式传 Vector3 实例
            const dir = { x: 0, y: 0, z: 0 };
            mat4GetAxisZ(getLogic(state.entity as Object3D).local2world, dir);
            dir.x = -dir.x; dir.y = -dir.y; dir.z = -dir.z;

            return { __type__: 'Vector3', x: dir.x, y: dir.y, z: dir.z };
        },
        /** 阴影相机近平面（供 shader uniform） */
        get shadowCameraNear() { return state.shadowNear; },
        /** 阴影相机远平面（供 shader uniform） */
        get shadowCameraFar() { return state.shadowFar; },
        /** 阴影图尺寸（默认 1024×1024，PointLight 覆盖为 cubemap atlas 布局 1/4 × 1/2） */
        get shadowMapSize(): Vector2 { return { __type__: 'Vector2', x: 1024, y: 1024 }; },
        /** 阴影采样纹理（子类覆盖）。DirectionalLight 不实现（用 shadowDepthTexture） */
        get shadowMap() { return null; },
        /** 调试阴影图用的纹理。子类覆盖：DirectionalLight 返回 shadowDepthTexture，PointLight/SpotLight 返回 shadowMap */
        get debugShadowTexture() { return null; },
    };

    return { state, members };
}

/**
 * 工厂函数：LightLogic 的唯一创建入口（子类工厂的组合入口）。
 *
 * @param data 光源数据（raw）
 */
export function lightLogic(data: Light): LightLogic
{
    const { members } = createLightLogicBase(data);

    const logic: LightLogic = {
        get component() { return members.component; },
        get entity() { return members.entity; },
        get isVisibleAndEnabled() { return members.isVisibleAndEnabled; },
        init(object3D) { members.init(object3D); },
        beforeRender(renderObject) { members.beforeRender(renderObject); },
        update(interval) { members.update(interval); },
        get isLoaded() { return members.isLoaded; },
        dispose() { members.dispose(); },
        get shadowViewProjection() { return members.shadowViewProjection; },
        get shadowNear() { return members.shadowNear; },
        get shadowFar() { return members.shadowFar; },
        updateShadowParams(viewProjection, near, far) { members.updateShadowParams(viewProjection, near, far); },
        get position() { return members.position; },
        get direction() { return members.direction; },
        get shadowCameraNear() { return members.shadowCameraNear; },
        get shadowCameraFar() { return members.shadowCameraFar; },
        get shadowMapSize() { return members.shadowMapSize; },
        get shadowMap() { return members.shadowMap; },
        get debugShadowTexture() { return members.debugShadowTexture; },
    };

    return logic;
}
