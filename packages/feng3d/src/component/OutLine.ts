import { Color4 } from '@feng3d/math';
import type { Component3D } from './Component';

declare module './Component'
{
    export interface ComponentMap
    {
        OutLine: OutLine;
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
 * OutLine（纯数据接口）。
 */
export interface OutLine extends Component3D
{
    readonly __type__: 'OutLine';
    readonly size: number;
    readonly color: Color4;
    readonly outlineMorphFactor: number;
}
