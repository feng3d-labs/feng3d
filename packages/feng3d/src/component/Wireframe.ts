import { Color4 } from '@feng3d/math';
import type { Component3D } from './Component';

declare module './Component'
{
    export interface ComponentMap
    {
        Wireframe: Wireframe;
    }
}

/**
 * Wireframe（纯数据接口）。
 */
export interface Wireframe extends Component3D
{
    readonly __type__: 'Wireframe';
    readonly color: Color4;
}
