import { Color4 } from '@feng3d/math';
import type { Component } from './Component';


declare global
{
    export interface MixinsComponentMap
    {
        OutLineComponent: OutLineComponent;
    }
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
export interface OutLineComponent extends Component
{
    size: number;
    color: Color4;
    outlineMorphFactor: number;
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
