import { Color4 } from '@feng3d/math';
import type { Component3D, Component } from './Component';


declare module './Component'
{
    export interface ComponentMap
    {
        OutLineComponent: OutLineComponent;
    }
}

declare global
{
    export interface MixinsUniforms
    {
        u_outlineSize: number;
        u_outlineColor: Color4;
        u_outlineMorphFactor: number;
    }
}

/**
 * OutLineComponent（纯数据接口）。
 */
export interface OutLineComponent extends Component3D
{
    readonly __type__: 'OutLineComponent';
    readonly size: number;
    readonly color: Color4;
    readonly outlineMorphFactor: number;
}

/**
 * 创建 OutLineComponent 实例。
 */
export function createOutLineComponent(): OutLineComponent
{
    return {
        __type__: 'OutLineComponent',
        size: 1,
        color: new Color4(0.2, 0.2, 0.2, 1.0),
        outlineMorphFactor: 0.0,
    };
}
