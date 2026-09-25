import { Color4, Vector4 } from '@feng3d/math';
import type { Component3D } from './Component';


declare module './Component'
{
    export interface ComponentMap
    {
        Cartoon: Cartoon;
    }
}

declare global
{
    export interface MixinsUniforms
    {
        u_diffuseSegment: Vector4;
        u_diffuseSegmentValue: Vector4;
        u_specularSegment: number;
    }
}

/**
 * Cartoon（纯数据接口）。
 */
export interface Cartoon extends Component3D
{
    readonly __type__: 'Cartoon';
    readonly outlineSize: number;
    readonly outlineColor: Color4;
    readonly outlineMorphFactor: number;
    readonly diffuseSegment: Vector4;
    readonly diffuseSegmentValue: Vector4;
    readonly specularSegment: number;
    readonly cartoon_Anti_aliasing: boolean;
}
