import { Light, createLight } from './Light';
import { LightType } from './LightType';

import './spotLightLogic';

/**
 * SpotLight（纯数据接口）。
 */
export interface SpotLight extends Light
{
    lightType: any;
    range: number;
    angle: number;
    penumbra: number;
}

/**
 * 创建 SpotLight 实例。
 */
export function createSpotLight(): SpotLight
{
    return {
        __type__: 'SpotLight', ...createLight(),
        lightType: LightType.Spot,
        range: 10,
        angle: 60,
        penumbra: 0,
    };
}
