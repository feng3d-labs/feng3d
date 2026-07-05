import { Color4, Vector4 } from '@feng3d/math';
import type { Component } from './Component';


declare module './Component'
{
    export interface ComponentMap
    {
        CartoonComponent: CartoonComponent;
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
 * CartoonComponent（纯数据接口）。
 */
export interface CartoonComponent extends Component
{
    readonly __type__: 'CartoonComponent';
    readonly outlineSize: number;
    readonly outlineColor: Color4;
    readonly outlineMorphFactor: number;
    readonly diffuseSegment: Vector4;
    readonly diffuseSegmentValue: Vector4;
    readonly specularSegment: number;
    readonly cartoon_Anti_aliasing: boolean;
}

/**
 * 创建 CartoonComponent 实例。
 */
export function createCartoonComponent(): CartoonComponent
{
    return {
        __type__: 'CartoonComponent',
        outlineSize: 1,
        outlineColor: new Color4(0.2, 0.2, 0.2, 1.0),
        outlineMorphFactor: 0.0,
        diffuseSegment: new Vector4(0.1, 0.3, 0.6, 1.0),
        diffuseSegmentValue: new Vector4(0.1, 0.3, 0.6, 1.0),
        specularSegment: 0.5,
        cartoon_Anti_aliasing: false,
    };
}
