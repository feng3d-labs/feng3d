import { Color4 } from '@feng3d/math';
import type { Component } from './Component';


declare module './Component'
{
    export interface ComponentMap
    {
        WireframeComponent: WireframeComponent;
    }
}

/**
 * WireframeComponent（纯数据接口）。
 */
export interface WireframeComponent extends Component
{
    readonly __type__: 'WireframeComponent';
    readonly color: Color4;
}

/**
 * 创建 WireframeComponent 实例。
 */
export function createWireframeComponent(): WireframeComponent
{
    return {
        __type__: 'WireframeComponent',
        color: new Color4(125 / 255, 176 / 255, 250 / 255),
    };
}
