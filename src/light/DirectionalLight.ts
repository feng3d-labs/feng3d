import { Light, createLight } from './Light';
import { LightType } from './LightType';

import './directionalLightLogic';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        DirectionalLight: DirectionalLight;
    }
}

/**
 * DirectionalLight（纯数据接口）。
 */
export interface DirectionalLight extends Light
{
    readonly __type__: 'DirectionalLight';
    readonly lightType: any;
}

/**
 * 创建 DirectionalLight 实例。
 */
export function createDirectionalLight(): DirectionalLight
{
    return {
        ...createLight(), __type__: 'DirectionalLight',
        lightType: LightType.Directional,
    };
}
