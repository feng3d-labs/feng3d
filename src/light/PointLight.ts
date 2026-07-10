import { Light, createLight } from './Light';
import { LightType } from './LightType';
import { registerLogic, logic as getLogic, effect, reactive } from "@feng3d/reactivity";
import { Vector2 } from '@feng3d/math';
import { PerspectiveLens } from '../cameras/lenses/PerspectiveLens';
import { lightLogic, LightLogic } from './Light';

import './PointLight';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        PointLight: PointLight;
    }
}

/**
 * PointLight（纯数据接口）。
 */
export interface PointLight extends Light
{
    readonly __type__: 'PointLight';
    readonly lightType: any;
    readonly range: number;
}

/**
 * 创建 PointLight 实例。
 */
export function createPointLight(): PointLight
{
    return {
        ...createLight(), __type__: 'PointLight',
        lightType: LightType.Point,
        range: 10,
    };
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        PointLight: PointLightLogic;
    }
}

/**
 * PointLight 逻辑处理输出。
 *
 * 组合 lightLogic，额外：
 * - init: 设置 shadowCamera.lens 为 90 度 PerspectiveLens
 * - effect 监听 range 变化时更新 lens.far
 * - shadowMapSize 覆盖（1/4, 1/2）
 */
export interface PointLightLogic extends LightLogic
{
}

/**
 * 获取 PointLight 的 logic。
 */
export function pointLightLogic(light: PointLight): PointLightLogic

{
    return getLogic(light);
}

function createPointLightLogic(light: PointLight): PointLightLogic
{
    const base = lightLogic(light);
    let _perspectiveLens: PerspectiveLens | null = null;
    let _inited = false;

    const logic = {
        ...base,
        get shadowMapSize()
        {
            return logic.shadowMap.getSize().multiply(new Vector2(1 / 4, 1/ 2));
        },
        init()
        {
            if (_inited) return;
            _inited = true;
            base.init();

            _perspectiveLens = new PerspectiveLens(90, 1, 0.1, light.range);
            light.shadowCamera.lens = _perspectiveLens;

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
registerLogic('PointLight', (component) =>
{
    return createPointLightLogic(component as PointLight);
});
