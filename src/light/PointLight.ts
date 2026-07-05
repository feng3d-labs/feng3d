import { Light, createLight } from './Light';
import { LightType } from './LightType';

import './pointLightLogic';

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
