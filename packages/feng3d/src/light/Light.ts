import { Matrix4x4, Vector2, Vector3 } from '@feng3d/math';
import { Behaviour, BehaviourLogic } from '../component/Behaviour';
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
 * Light 逻辑类。
 *
 * 继承 BehaviourLogic，额外提供：
 * - position / direction: 由 transform 派生
 * - shadowViewProjection: 阴影投影矩阵（VP），由子类 updateShadowXxx 经
 *   updateShadowParams 写入
 * - shadowCameraNear / shadowCameraFar / shadowMapSize: 阴影参数（供 shader uniform）
 * - shadowMap / debugShadowTexture: 阴影纹理（子类用 defineProperties 覆盖，
 *   覆盖 own property 与继承的原型 getter 兼容）
 *
 * 子类工厂（DirectionalLight/PointLight/SpotLight）经 {@link lightLogic} 组合函数
 * 获取实例后 defineProperties 叠加自身行为。
 */
export class LightLogic extends BehaviourLogic
{
    /**
     * 阴影 view-projection 矩阵缓存。
     */
    #shadowViewProjection: Matrix4x4 = new Matrix4x4();
    /** 阴影相机近/远平面，由子类 updateShadowXxx 写入，供 shader uniform */
    #shadowNear = 0.3;
    #shadowFar = 1000;

    protected constructor(data: Light)
    {
        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口，供组合函数与子类使用） */
    static create(data: Light): LightLogic
    {
        return new LightLogic(data);
    }

    /**
     * 阴影 view-projection 矩阵（由 updateShadowParams 写入，ShadowRenderer/ForwardRenderer 读取）。
     */
    get shadowViewProjection(): Matrix4x4
    {
        return this.#shadowViewProjection;
    }

    /** 阴影相机近平面（由 updateShadowParams 写入，供 shader uniform） */
    get shadowNear(): number
    {
        return this.#shadowNear;
    }

    /** 阴影相机远平面（由 updateShadowParams 写入，供 shader uniform） */
    get shadowFar(): number
    {
        return this.#shadowFar;
    }

    /**
     * 更新阴影参数（供子类的 updateShadowXxx 方法调用）。
     */
    updateShadowParams(viewProjection: Matrix4x4, near: number, far: number): void
    {
        this.#shadowViewProjection = viewProjection;
        this.#shadowNear = near;
        this.#shadowFar = far;
    }

    /** 光源世界坐标（由 object3D 的 worldPosition 派生） */
    get position(): Vector3
    {
        return getLogic(this.entity as Object3D).worldPosition;
    }

    /** 光源方向（object3D 的 local2world Z 轴取反） */
    get direction(): Vector3
    {
        // 光发射方向 = 本地 -Z（投影矩阵 m[11]=-1，相机/光源 forward 为 -Z）
        const dir = getLogic(this.entity as Object3D).local2world.getAxisZ();
        dir.x = -dir.x; dir.y = -dir.y; dir.z = -dir.z;

        return dir;
    }

    /** 阴影相机近平面（供 shader uniform） */
    get shadowCameraNear(): number
    {
        return this.#shadowNear;
    }

    /** 阴影相机远平面（供 shader uniform） */
    get shadowCameraFar(): number
    {
        return this.#shadowFar;
    }

    /** 阴影图尺寸（默认 1024×1024，PointLight 覆盖为 cubemap atlas 布局 1/4 × 1/2） */
    get shadowMapSize(): Vector2
    {
        return new Vector2(1024, 1024);
    }

    /** 阴影采样纹理（子类覆盖）。DirectionalLight 不实现（用 shadowDepthTexture） */
    get shadowMap(): Texture | null
    {
        return null;
    }

    /** 调试阴影图用的纹理。子类覆盖：DirectionalLight 返回 shadowDepthTexture，PointLight/SpotLight 返回 shadowMap */
    get debugShadowTexture(): Texture | null
    {
        return null;
    }
}

/**
 * 组合函数：创建 LightLogic 实例（子类工厂的组合入口）。
 */
export function lightLogic(data: Light): LightLogic
{
    return LightLogic.create(data);
}
