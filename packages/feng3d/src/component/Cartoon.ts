import { Color4Like, Vector4Like } from '@feng3d/math';
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
        u_diffuseSegment: Vector4Like;
        u_diffuseSegmentValue: Vector4Like;
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
    readonly outlineColor: Color4Like;
    readonly outlineMorphFactor: number;
    readonly diffuseSegment: Vector4Like;
    readonly diffuseSegmentValue: Vector4Like;
    readonly specularSegment: number;
    readonly cartoon_Anti_aliasing: boolean;
}
