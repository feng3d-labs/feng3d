import { Matrix4x4, Vector2, Vector3 } from '@feng3d/math';
import { Behaviour, behaviourLogic } from '../component/Behaviour';
import { LightType } from './LightType';
import { ShadowType } from './shadow/ShadowType';
import { isRenderable } from "../component/Component";
import { batchRun, reactive, logic as getLogic, UnReadonly } from '@feng3d/reactivity';
import type { BehaviourLogic } from '../component/Behaviour';
import { Object3D } from '../core/Object3D';
import { Renderable } from '../core/Renderable';
import type { Camera } from '../cameras/Camera';
import type { Color3 } from '../core/Color3';
import type { Scene } from '../scene/Scene';
import type { Texture } from '@feng3d/webgpu';

import './Light';

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
    readonly color: Color3;
    readonly intensity: number;
    readonly shadowType: ShadowType;
    readonly shadowBias: number;
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
 * Light 逻辑处理接口。
 *
 * 组合 BehaviourLogic，额外提供：
 * - position / direction: 由 transform 派生
 * - shadowViewProjection: 阴影投影矩阵（VP），由子类 updateShadowXxx 主动写入
 * - shadowCameraNear / shadowCameraFar / shadowMapSize: 阴影参数（供 shader uniform）
 * - shadowMap / debugShadowTexture: 阴影纹理（子类覆盖）
 *
 * 子类 logic（DirectionalLightLogic / PointLightLogic / SpotLightLogic）组合 lightLogic 后追加自身行为。
 *
 * 注意：shadowViewProjection / shadowNear / shadowFar 为可写字段，由子类工厂（spotLightLogic /
 * directionalLightLogic / pointLightLogic）的 computed / updateShadowXxx 主动写入。
 */
export interface LightLogic extends BehaviourLogic
{
    /**
     * 阴影 view-projection 矩阵缓存。
     *
     * 由子类的 updateShadowXxx 方法写入（SpotLight/DirectionalLight 单矩阵；
     * PointLight 用 shadowViewProjections 数组）。
     * ShadowRenderer 与 ForwardRenderer 读取此值作为 u_viewProjection / u_shadowVP。
     */
    shadowViewProjection: Matrix4x4;
    /** 阴影相机近平面，由子类 updateShadowXxx 写入，供 shader uniform */
    shadowNear: number;
    /** 阴影相机远平面，由子类 updateShadowXxx 写入，供 shader uniform */
    shadowFar: number;
    /** 光源世界坐标（由 object3D 的 worldPosition 派生） */
    readonly position: Vector3;
    /** 光源方向（object3D 的 local2world Z 轴） */
    readonly direction: Vector3;
    /** 阴影相机近平面（供 shader uniform） */
    readonly shadowCameraNear: number;
    /** 阴影相机远平面（供 shader uniform） */
    readonly shadowCameraFar: number;
    /** 阴影图尺寸（默认 1024×1024，PointLight 覆盖为 cubemap atlas 布局 1/4 × 1/2） */
    readonly shadowMapSize: Vector2;
    /** 阴影采样纹理（PointLight/SpotLight 覆盖返回各自的 RenderTargetTexture2D）。DirectionalLight 不实现（用 shadowDepthTexture） */
    readonly shadowMap: Texture | null;
    /** 调试阴影图用的纹理。子类覆盖：DirectionalLight 返回 shadowDepthTexture，PointLight/SpotLight 返回 shadowMap */
    readonly debugShadowTexture: Texture | null;
}

/**
 * 创建 LightLogic 实例（工厂函数，组合 behaviourLogic 基础行为）。
 *
 * 子类工厂通过 `const base = lightLogic(data)` 组合复用全部 Light 行为，并可读写
 * base.shadowViewProjection / base.shadowNear / base.shadowFar 以实现自身的 updateShadowXxx。
 */
export function lightLogic(light: Light): LightLogic
{
    const base = behaviourLogic(light);

    // 默认值（缺失字段单独赋值）
    const writable = light as UnReadonly<Light>;
    if (light.shadowBias === undefined) writable.shadowBias = -0.003;

    /**
     * 阴影 view-projection 矩阵缓存。
     *
     * 由子类的 updateShadowXxx 方法写入（SpotLight/DirectionalLight 单矩阵；
     * PointLight 用 shadowViewProjections 数组）。
     * ShadowRenderer 与 ForwardRenderer 读取此值作为 u_viewProjection / u_shadowVP。
     */
    let _shadowViewProjection: Matrix4x4 = new Matrix4x4();
    /** 阴影相机近/远平面，由子类 updateShadowXxx 写入，供 shader uniform */
    let _shadowNear = 0.3;
    let _shadowFar = 1000;

    let _lightInited = false;

    // 捕获基类方法，避免覆盖后再调用 base.init/dispose 导致递归
    const baseInit = base.init;
    const baseDispose = base.dispose;

    // 用 defineProperties 定义访问器（Object.assign 会调用 getter 一次后存为静态值，故不能用于访问器）
    Object.defineProperties(base, {
        shadowViewProjection: {
            get() { return _shadowViewProjection; },
            set(v: Matrix4x4) { _shadowViewProjection = v; },
            enumerable: true,
            configurable: true,
        },
        shadowNear: {
            get() { return _shadowNear; },
            set(v: number) { _shadowNear = v; },
            enumerable: true,
            configurable: true,
        },
        shadowFar: {
            get() { return _shadowFar; },
            set(v: number) { _shadowFar = v; },
            enumerable: true,
            configurable: true,
        },
        position: {
            get(): Vector3
            {
                return getLogic((base.entity)).worldPosition;
            },
            enumerable: true,
            configurable: true,
        },
        direction: {
            get(): Vector3
            {
                return getLogic((base.entity)).local2world.getAxisZ();
            },
            enumerable: true,
            configurable: true,
        },
        shadowCameraNear: {
            get(): number { return _shadowNear; },
            enumerable: true,
            configurable: true,
        },
        shadowCameraFar: {
            get(): number { return _shadowFar; },
            enumerable: true,
            configurable: true,
        },
        /** 阴影图尺寸（默认 1024×1024，PointLight 覆盖为 cubemap atlas 布局 1/4 × 1/2）。 */
        shadowMapSize: {
            get(): Vector2 { return new Vector2(1024, 1024); },
            enumerable: true,
            configurable: true,
        },
        /** 阴影采样纹理（PointLight/SpotLight 覆盖返回各自的 RenderTargetTexture2D）。DirectionalLight 不实现（用 shadowDepthTexture） */
        shadowMap: {
            get(): Texture | null { return null; },
            enumerable: true,
            configurable: true,
        },
        /** 调试阴影图用的纹理。子类覆盖：DirectionalLight 返回 shadowDepthTexture，PointLight/SpotLight 返回 shadowMap */
        debugShadowTexture: {
            get(): Texture | null { return null; },
            enumerable: true,
            configurable: true,
        },
    });

    // 方法直接赋值（非访问器，Object.assign 安全）
    base.init = function (object3D?: Object3D): void
    {
        if (_lightInited) return;
        _lightInited = true;
        baseInit(object3D);
    };
    base.dispose = function (): void
    {
        baseDispose();
    };

    return base as unknown as LightLogic;
}
