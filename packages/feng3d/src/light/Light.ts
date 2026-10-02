import { Color3Like, mat4GetAxisZ, mat4Identity, Matrix4x4, Vector2, Vector3 } from '@feng3d/math';
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
    #shadowViewProjection: Matrix4x4 = { __type__: 'Matrix4x4', ...mat4Identity() };
    /** 阴影相机近/远平面，由子类 updateShadowXxx 写入，供 shader uniform */
    #shadowNear = 0.3;
    #shadowFar = 1000;

    /** 纯数据引用（子类读取自身具体数据字段用） */
    protected readonly _data: Light;

    protected constructor(data: Light)
    {
        super(data);
        this._data = data;
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
        // 阶段 C-e：`Matrix4x4.getAxisZ` 已删除，缺省 out 是纯字面量（没有 Vector3 的方法），
        // 而本 getter 的返回类型是 `Vector3`，所以显式传 Vector3 实例
        const dir = new Vector3();
        mat4GetAxisZ(getLogic(this.entity as Object3D).local2world, dir);
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
