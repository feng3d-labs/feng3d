import type { Component } from './Component';
import type { Camera } from '../cameras/Camera';


declare global
{
    export interface MixinsComponentMap
    {
        BillboardComponent: BillboardComponent;
    }
}

/**
 * BillboardComponent（纯数据接口）。
 */
export interface BillboardComponent extends Component
{
    camera: Camera;
}

/**
 * 创建 BillboardComponent 实例。
 */
export function createBillboardComponent(): BillboardComponent
{
    return {
        __type__: 'BillboardComponent',
        camera: null as any,
    };
}
