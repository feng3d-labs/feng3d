import { Light, createLight } from './Light';
import { LightType } from './LightType';
import { registerLogic, logic as getLogic, effect, reactive } from "@feng3d/reactivity";
import { PerspectiveLens } from '../cameras/lenses/PerspectiveLens';
import { mathUtil } from '@feng3d/polyfill';
import { lightLogic, LightLogic } from './Light';

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
 * SpotLight 逻辑处理输出。
 *
 * 组合 lightLogic，额外：
 * - init: 设置 shadowCamera.lens 为 PerspectiveLens(angle, ...)
 * - effect 监听 angle 变化时更新 lens.fov
 * - effect 监听 range 变化时更新 lens.far
 * - coneCos / penumbraCos 派生
 */
export interface SpotLightLogic extends LightLogic
{
    readonly coneCos: number;
    readonly penumbraCos: number;
}

/**
 * 获取 SpotLight 的 logic。
 */
export function spotLightLogic(light: SpotLight): SpotLightLogic

{
    return getLogic(light);
}

function createSpotLightLogic(light: SpotLight): SpotLightLogic
{
    const base = lightLogic(light);
    let _perspectiveLens: PerspectiveLens | null = null;
    let _inited = false;

    const logic = {
        ...base,
        get coneCos()
        {
            return Math.cos(light.angle * 0.5 * mathUtil.DEG2RAD);
        },
        get penumbraCos()
        {
            return Math.cos(light.angle * 0.5 * mathUtil.DEG2RAD * (1 - light.penumbra));
        },
        init()
        {
            if (_inited) return;
            _inited = true;
            base.init();

            _perspectiveLens = new PerspectiveLens(light.angle, 1, 0.1, light.range);
            light.shadowCamera.lens = _perspectiveLens;

            // effect 监听 angle 变化时更新 lens.fov
            effect(() =>
            {
                const angle = reactive(light).angle;
                if (_perspectiveLens)
                {
                    _perspectiveLens.fov = angle;
                }
            });

            // effect 监听 range 变化时更新 lens.far
            effect(() =>
            {
                const range = reactive(light).range;
                if (_perspectiveLens)
                {
                    _perspectiveLens.far = range;
                }
            });
        },
    };

    return logic as any;
}

// 注册到 componentLogic 分发表
registerLogic('SpotLight', (component) =>
{
    return createSpotLightLogic(component as SpotLight);
});
