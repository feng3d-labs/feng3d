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
    lightType: any;
}

/**
 * 创建 DirectionalLight 实例。
 */
export function createDirectionalLight(): DirectionalLight
{
    return {
        __type__: 'DirectionalLight', ...createLight(),
        lightType: LightType.Directional,
    };
}
