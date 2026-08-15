import { Light } from './Light';
import { LightLogic } from './Light';
import { LightType } from './LightType';
import { registerLogic, logic as getLogic, Computed, computed, reactive } from "@feng3d/reactivity";
import { mathUtil } from '@feng3d/polyfill';
import { Matrix4x4 } from '@feng3d/math';
import { Texture } from '@feng3d/webgpu';


declare module '../component/Component'
{
    export interface ComponentMap
    {
        SpotLight: SpotLight;
    }
}

/**
 * SpotLight（纯数据接口）。
 */
export interface SpotLight extends Light
{
    readonly __type__: 'SpotLight';
    readonly lightType: LightType.Spot;
    readonly range: number;
    readonly angle: number;
    readonly penumbra: number;
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SpotLight: SpotLightLogic;
    }
}

/**
 * SpotLight 逻辑类。
 *
 * 继承 LightLogic，额外：
 * - shadowMap：聚光灯阴影图（webgpu Texture，rgba8unorm，格式不变）
 * - shadowViewProjection：computed，依赖 world2local / angle / range，自动失效重算
 *   （无需 ShadowRenderer 主动调 updateShadowVP）
 * - coneCos / penumbraCos：聚光锥角派生（光照计算用）
 */
export class SpotLightLogic extends LightLogic
{
    /** 聚光灯阴影图（rgba8unorm，懒创建） */
    #shadowMap: Texture | null = null;

    /** 阴影 VP computed（依赖 world2local/angle/range） */
    readonly #shadowViewProjectionComputed: Computed<Matrix4x4>;

    protected constructor(data: SpotLight)
    {
        super(data);
        // VP = perspective(angle) × view(world2local)
        // 依赖全是响应式：world2local（Computed）、angle/range（响应式字段）。
        // 任一变化自动失效，ShadowRenderer 读 .shadowViewProjection 时按需重算。
        this.#shadowViewProjectionComputed = computed<Matrix4x4>(() =>
        {
            const r_light = reactive(data);
            const angle = r_light.angle;
            const range = r_light.range;
            const viewMatrix = getLogic(this.entity).world2local;
            const projection = new Matrix4x4();
            projection.setPerspectiveFromFOV(angle, 1, 0.1, range);

            return projection.append(viewMatrix);
        });

        // 阴影近/远平面（常量，构造时一次性设置）
        this.updateShadowParams(new Matrix4x4(), 0.1, data.range);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: SpotLight): SpotLightLogic
    {
        return new SpotLightLogic(data);
    }

    /** 聚光锥角余弦（光照计算用） */
    get coneCos(): number
    {
        return Math.cos((this._data as SpotLight).angle * 0.5 * mathUtil.DEG2RAD);
    }

    /** 半影锥角余弦（光照计算用） */
    get penumbraCos(): number
    {
        return Math.cos((this._data as SpotLight).angle * 0.5 * mathUtil.DEG2RAD * (1 - (this._data as SpotLight).penumbra));
    }

    /** 聚光灯阴影图（懒创建，1024×1024 rgba8unorm） */
    get shadowMap(): Texture
    {
        if (!this.#shadowMap)
        {
            this.#shadowMap = {
                descriptor: {
                    label: 'SpotLightShadowMap',
                    size: [1024, 1024],
                    format: 'rgba8unorm',
                },
            } as Texture;
        }

        return this.#shadowMap;
    }

    /** 调试阴影图：聚光灯用 shadowMap */
    get debugShadowTexture(): Texture | null
    {
        return this.shadowMap;
    }

    /** 覆盖基类：返回 computed 求值结果（依赖 world2local/angle/range，自动失效） */
    get shadowViewProjection(): Matrix4x4
    {
        return this.#shadowViewProjectionComputed.value;
    }
}
// 注册到 logic 分发表
registerLogic('SpotLight', SpotLightLogic as unknown as new (data: SpotLight) => SpotLightLogic);
