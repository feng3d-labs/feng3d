import { Light, lightLogic } from './Light';
import { LightType } from './LightType';
import { registerLogic, logic as getLogic, Computed, computed, reactive } from "@feng3d/reactivity";
import { mathUtil } from '@feng3d/polyfill';
import { Matrix4x4 } from '@feng3d/math';
import type { Object3D } from '../core/Object3D';
import { Texture } from '@feng3d/webgpu';
import type { LightLogic } from './Light';

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
 * SpotLight 逻辑处理接口。
 *
 * 组合 LightLogic，额外：
 * - shadowMap：聚光灯阴影图（webgpu Texture，rgba8unorm + packDepthToRGBA，格式不变）
 * - shadowViewProjection：computed，依赖 world2local / angle / range，自动失效重算
 *   （无需 ShadowRenderer 主动调 updateShadowVP）
 * - coneCos / penumbraCos：聚光锥角派生（光照计算用）
 */
export interface SpotLightLogic extends LightLogic
{
    /** 聚光灯阴影图（懒创建，1024×1024 rgba8unorm） */
    readonly shadowMap: Texture;
    /** 聚光锥角余弦（光照计算用） */
    readonly coneCos: number;
    /** 半影锥角余弦（光照计算用） */
    readonly penumbraCos: number;
}

/**
 * 创建 SpotLightLogic 实例（工厂函数，组合 lightLogic 基础行为）。
 */
export function spotLightLogic(light: SpotLight): SpotLightLogic
{
    const base = lightLogic(light);

    /** 聚光灯阴影图（rgba8unorm，与原 frameBufferObject.texture 等价） */
    let _shadowMap: Texture | null = null;

    /** 阴影 VP computed（依赖 world2local/angle/range） */
    // VP = perspective(angle) × view(world2local)
    // 依赖全是响应式：world2local（Computed）、angle/range（响应式字段）。
    // 任一变化自动失效，ShadowRenderer 读 .shadowViewProjection 时按需重算。
    const _shadowViewProjectionComputed = computed<Matrix4x4>(() =>
    {
        const r_light = reactive(light);
        const angle = r_light.angle;
        const range = r_light.range;
        const viewMatrix = getLogic(base.entity).world2local;
        const projection = new Matrix4x4();
        projection.setPerspectiveFromFOV(angle, 1, 0.1, range);
        base.shadowNear = 0.1;
        base.shadowFar = range;

        return projection.append(viewMatrix);
    });

    // 用 defineProperties 定义访问器（Object.assign 会调用 getter 一次后存为静态值，故不能用于访问器）
    Object.defineProperties(base, {
        coneCos: {
            get(): number
            {
                return Math.cos(light.angle * 0.5 * mathUtil.DEG2RAD);
            },
            enumerable: true,
            configurable: true,
        },
        penumbraCos: {
            get(): number
            {
                return Math.cos(light.angle * 0.5 * mathUtil.DEG2RAD * (1 - light.penumbra));
            },
            enumerable: true,
            configurable: true,
        },
        /** 聚光灯阴影图（懒创建，1024×1024 rgba8unorm） */
        shadowMap: {
            get(): Texture
            {
                if (!_shadowMap)
                {
                    _shadowMap = {
                        descriptor: {
                            label: 'SpotLightShadowMap',
                            size: [1024, 1024],
                            format: 'rgba8unorm',
                        },
                    } as Texture;
                }

                return _shadowMap;
            },
            enumerable: true,
            configurable: true,
        },
        /** 调试阴影图：聚光灯用 shadowMap */
        debugShadowTexture: {
            get(): Texture | null { return base.shadowMap; },
            enumerable: true,
            configurable: true,
        },
        /** 覆盖基类：返回 computed 求值结果（依赖 world2local/angle/range，自动失效） */
        shadowViewProjection: {
            get(): Matrix4x4 { return _shadowViewProjectionComputed.value; },
            enumerable: true,
            configurable: true,
        },
    });

    return base as unknown as SpotLightLogic;
}
// 注册到 componentLogic 分发表
registerLogic('SpotLight', spotLightLogic);
