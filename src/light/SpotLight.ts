import { Light, createLight } from './Light';
import { LightType } from './LightType';

import './spotLightLogic';

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
