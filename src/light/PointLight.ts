import { Light, createLight } from './Light';
import { LightType } from './LightType';

import './pointLightLogic';

/**
 * PointLight（纯数据接口）。
 */
export interface PointLight extends Light
{
    lightType: any;
    range: number;
}

/**
 * 创建 PointLight 实例。
 */
export function createPointLight(): PointLight
{
    return {
        __type__: 'PointLight', ...createLight(),
        lightType: LightType.Point,
        range: 10,
    };
}
