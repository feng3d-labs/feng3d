import { Light, createLight } from './Light';
import { LightType } from './LightType';
import { registerLogic, logic as getLogic, Computed, computed, reactive } from "@feng3d/reactivity";
import { mathUtil } from '@feng3d/polyfill';
import { Matrix4x4 } from '@feng3d/math';
import type { Object3D } from '../core/Object3D';
import { Texture } from '@feng3d/webgpu';
import { LightLogic } from './Light';

import './SpotLight';

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
    readonly lightType: any;
    readonly range: number;
    readonly angle: number;
    readonly penumbra: number;
}

/**
 * 创建 SpotLight 实例。
 */
export function createSpotLight(): SpotLight
{
    return {
        ...createLight(), __type__: 'SpotLight',
        lightType: LightType.Spot,
        range: 10,
        angle: 60,
        penumbra: 0,
    };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SpotLight: SpotLightLogic;
    }
}

/**
 * SpotLight 逻辑处理类。
 *
 * 继承 LightLogic，额外：
 * - shadowMap：聚光灯阴影图（webgpu Texture，rgba8unorm + packDepthToRGBA，格式不变）
 * - shadowViewProjection：computed，依赖 world2local / angle / range，自动失效重算
 *   （无需 ShadowRenderer 主动调 updateShadowVP）
 * - coneCos / penumbraCos：聚光锥角派生（光照计算用）
 */
export class SpotLightLogic extends LightLogic
{
    /** 聚光灯阴影图（rgba8unorm，与原 frameBufferObject.texture 等价） */
    private _shadowMap: Texture | null = null;
    /** 阴影 VP computed（依赖 world2local/angle/range） */
    private readonly _shadowViewProjectionComputed: Computed<Matrix4x4>;

    constructor(light: SpotLight)
    {
        super(light);
        const self = this;
        // VP = perspective(angle) × view(world2local)
        // 依赖全是响应式：world2local（Computed）、angle/range（响应式字段）。
        // 任一变化自动失效，ShadowRenderer 读 .shadowViewProjection 时按需重算。
        this._shadowViewProjectionComputed = computed<Matrix4x4>(() =>
        {
            const r_light = reactive(light);
            const angle = r_light.angle;
            const range = r_light.range;
            const viewMatrix = getLogic(self.entity).world2local;
            const projection = new Matrix4x4();
            projection.setPerspectiveFromFOV(angle, 1, 0.1, range);
            self._shadowNear = 0.1;
            self._shadowFar = range;

            return projection.append(viewMatrix);
        });
    }

    get coneCos(): number
    {
        const light = this.component as SpotLight;

        return Math.cos(light.angle * 0.5 * mathUtil.DEG2RAD);
    }

    get penumbraCos(): number
    {
        const light = this.component as SpotLight;

        return Math.cos(light.angle * 0.5 * mathUtil.DEG2RAD * (1 - light.penumbra));
    }

    /** 聚光灯阴影图（懒创建，1024×1024 rgba8unorm） */
    get shadowMap(): Texture
    {
        if (!this._shadowMap)
        {
            this._shadowMap = {
                descriptor: {
                    label: 'SpotLightShadowMap',
                    size: [1024, 1024],
                    format: 'rgba8unorm',
                },
            } as Texture;
        }

        return this._shadowMap;
    }

    /** 调试阴影图：聚光灯用 shadowMap */
    get debugShadowTexture(): Texture | null
    {
        return this.shadowMap;
    }

    /** 覆盖基类：返回 computed 求值结果（依赖 world2local/angle/range，自动失效） */
    get shadowViewProjection(): Matrix4x4
    {
        return this._shadowViewProjectionComputed.value;
    }
}
// 注册到 componentLogic 分发表
registerLogic('SpotLight', SpotLightLogic);
