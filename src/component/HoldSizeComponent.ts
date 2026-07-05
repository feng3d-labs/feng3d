import type { Component } from './Component';
import type { Camera } from '../cameras/Camera';


declare global
{
    export interface MixinsComponentMap
    {
        HoldSizeComponent: HoldSizeComponent;
    }
}

/**
 * HoldSizeComponent（纯数据接口）。
 */
export interface HoldSizeComponent extends Component
{
    holdSize: number;
    camera: Camera;
}

/**
 * 创建 HoldSizeComponent 实例。
 */
export function createHoldSizeComponent(): HoldSizeComponent
{
    return {
        __type__: 'HoldSizeComponent',
        holdSize: 1,
        camera: null as any,
    };
}
