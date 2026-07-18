import { Light, createLight } from './Light';
import { LightType } from './LightType';
import { registerLogic, logic as getLogic, effect, reactive } from "@feng3d/reactivity";
import { mathUtil } from '@feng3d/polyfill';
import { Matrix4x4 } from '@feng3d/math';
import type { Object3D } from '../core/Object3D';
import type { Texture2D } from '../textures/Texture2D';
import { RenderTargetTexture2D } from '../textures/RenderTargetTexture2D';
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
 * - shadowMap：聚光灯阴影图（RenderTargetTexture2D，rgba8unorm + packDepthToRGBA，格式不变）
 * - shadowViewProjection：由光源 local2world + perspective 投影直接拼矩阵（不再经过 shadowCamera/lens）
 * - updateShadowVP：每帧由 ShadowRenderer 调用，重算 VP
 * - coneCos / penumbraCos：聚光锥角派生（光照计算用）
 */
export class SpotLightLogic extends LightLogic
{
    /** 聚光灯阴影图（rgba8unorm，与原 frameBufferObject.texture 等价） */
    private _shadowMap: RenderTargetTexture2D | null = null;
    private _spotInited = false;

    constructor(light: SpotLight)
    {
        super(light);
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
    get shadowMap(): RenderTargetTexture2D
    {
        if (!this._shadowMap)
        {
            this._shadowMap = new RenderTargetTexture2D();
            this._shadowMap.descriptor = {
                label: 'SpotLightShadowMap',
                size: [1024, 1024],
                format: 'rgba8unorm' as const,
            };
        }

        return this._shadowMap;
    }

    /** 调试阴影图：聚光灯用 shadowMap */
    get debugShadowTexture(): Texture2D | null
    {
        return this.shadowMap;
    }

    init(object3D?: Object3D): void
    {
        if (this._spotInited) return;
        this._spotInited = true;
        super.init(object3D);

        // 保留 effect 触发响应式依赖追踪，angle/range 变化时依赖 shadowMap 的 computed 失效。
        // VP 每帧由 ShadowRenderer 调 updateShadowVP 重算，无需在此立即响应。
        effect(() =>
        {
            void reactive(this.component as SpotLight).angle;
            void reactive(this.component as SpotLight).range;
        });
    }

    /**
     * 计算聚光灯阴影 view-projection 矩阵。
     *
     * view = 光源 local2world 的逆（world→camera）；
     * projection = setPerspectiveFromFOV(angle, 1, 0.1, range)。
     * 结果写入 `_shadowViewProjection`，ShadowRenderer 读取。
     */
    updateShadowVP(): void
    {
        const light = this.component as SpotLight;

        // view 矩阵：光源 object3D 的 world2local（local2world 的逆）
        const viewMatrix = getLogic(this.entity).world2local.value;

        // perspective projection（FOV = angle，aspect=1）
        const projection = new Matrix4x4();
        projection.setPerspectiveFromFOV(light.angle, 1, 0.1, light.range);

        // VP = projection × view（append 左乘）
        this._shadowViewProjection = projection.append(viewMatrix);
        this._shadowNear = 0.1;
        this._shadowFar = light.range;
    }
}
// 注册到 componentLogic 分发表
registerLogic('SpotLight', SpotLightLogic);
