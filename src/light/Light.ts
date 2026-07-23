import { Matrix4x4, Vector2, Vector3 } from '@feng3d/math';
import { Behaviour, createBehaviour } from '../component/Behaviour';
import { LightType } from './LightType';
import { ShadowType } from './shadow/ShadowType';
import { isRenderable } from "../component/Component";
import { batchRun, reactive, logic as getLogic, UnReadonly } from '@feng3d/reactivity';
import { BehaviourLogic } from '../component/Behaviour';
import { Object3D } from '../core/Object3D';
import { Renderable } from '../core/Renderable';
import { createTextureMaterial } from '../materials/TextureMaterial';
import { createPlaneGeometry } from '../primitives/PlaneGeometry';
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

/**
 * 创建 Light 实例。
 */
export function createLight(): Light
{
    return {
        ...createBehaviour(), __type__: 'Light',
        lightType: null as unknown as LightType,
        color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
        intensity: 1,
        shadowType: ShadowType.No_Shadows,
        shadowBias: -0.005,
        shadowRadius: 1,
        debugShadowMap: false,
    };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Light: LightLogic;
    }
}

/**
 * Light 逻辑处理类。
 *
 * 继承 BehaviourLogic，额外提供：
 * - position / direction: 由 transform 派生
 * - shadowViewProjection: 阴影投影矩阵（VP），由子类 updateShadowXxx 主动写入
 * - shadowCameraNear / shadowCameraFar / shadowMapSize: 阴影参数（供 shader uniform）
 * - shadowMap / debugShadowTexture: 阴影纹理（子类覆盖）
 * - updateDebugShadowMap: 调试阴影图对象管理
 *
 * 子类 logic（DirectionalLightLogic / PointLightLogic / SpotLightLogic）继承本类后追加自身行为。
 */
export class LightLogic extends BehaviourLogic
{
    /**
     * 阴影 view-projection 矩阵缓存。
     *
     * 由子类的 updateShadowXxx 方法写入（SpotLight/DirectionalLight 单矩阵；
     * PointLight 用 shadowViewProjections 数组）。
     * ShadowRenderer 与 ForwardRenderer 读取此值作为 u_viewProjection / u_shadowVP。
     */
    protected _shadowViewProjection: Matrix4x4 = new Matrix4x4();
    /** 阴影相机近/远平面，由子类 updateShadowXxx 写入，供 shader uniform */
    protected _shadowNear = 0.3;
    protected _shadowFar = 1000;

    private _lightInited = false;

    constructor(light: Light)
    {
        super(light);
        // 默认值（缺失字段单独赋值）
        const writable = light as UnReadonly<Light>;
        if (light.shadowBias === undefined) writable.shadowBias = -0.003;
    }

    /** 光源世界坐标（由 object3D 的 worldPosition 派生） */
    get position(): Vector3
    {
        return getLogic((this.entity)).worldPosition;
    }

    /** 光源方向（object3D 的 local2world Z 轴） */
    get direction(): Vector3
    {
        return getLogic((this.entity)).local2world.getAxisZ();
    }

    /**
     * 阴影 view-projection 矩阵（SpotLight / DirectionalLight 用）。
     *
     * 子类的 updateShadowXxx 方法每帧写入。ShadowRenderer 读取后作为 cameraUniforms.u_viewProjection，
     * ForwardRenderer 读取后作为 shadowData.u_shadowVP。
     */
    get shadowViewProjection(): Matrix4x4
    {
        return this._shadowViewProjection;
    }

    get shadowCameraNear(): number
    {
        return this._shadowNear;
    }

    get shadowCameraFar(): number
    {
        return this._shadowFar;
    }

    /**
     * 阴影图尺寸（默认 1024×1024，PointLight 覆盖为 cubemap atlas 布局 1/4 × 1/2）。
     */
    get shadowMapSize(): Vector2
    {
        return new Vector2(1024, 1024);
    }

    /**
     * 阴影采样纹理（PointLight/SpotLight 覆盖返回各自的 RenderTargetTexture2D）。
     * DirectionalLight 不实现此 getter（用 shadowDepthTexture）。
     */
    get shadowMap(): Texture | null
    {
        return null;
    }

    /**
     * 调试阴影图用的纹理（updateDebugShadowMap 把它贴到 debug 平面上）。
     * 子类覆盖：DirectionalLight 返回 shadowDepthTexture，PointLight/SpotLight 返回 shadowMap。
     */
    get debugShadowTexture(): Texture | null
    {
        return null;
    }

    /**
     * 初始化：调用 super.init 注入 object3D。子类 override 追加 lens/纹理创建。
     */
    init(object3D?: Object3D): void
    {
        if (this._lightInited) return;
        this._lightInited = true;
        super.init(object3D);
    }

    dispose(): void
    {
        super.dispose();
    }
}
