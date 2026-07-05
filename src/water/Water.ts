import { Renderable, createRenderable } from '../core/Renderable';
import { Geometry } from '../geometry/Geometry';
import { getDefaultGeometry } from '../geometry/geometryLogic';
import { getDefaultMaterial } from '../materials/materialLogic';
import { FrameBufferObject } from '../render/FrameBufferObject';

import './waterLogic';

declare module '../component/Component'
{
    export interface ComponentMap
    {
        Water: Water;
    }
}

declare global
{
    export interface MixinsPrimitiveObject3D
    {
        Water: any;
    }
}

/**
 * Water（纯数据接口）。
 */
export interface Water extends Renderable
{
    readonly __type__: 'Water';
    readonly geometry: any;
    readonly material: any;
    readonly frameBufferObject: FrameBufferObject;
}

/**
 * 创建 Water 实例。
 */
export function createWater(): Water
{
    return {
        ...createRenderable(), __type__: 'Water',
        geometry: getDefaultGeometry('Plane'),
        material: getDefaultMaterial('Water-Material'),
        frameBufferObject: new FrameBufferObject(),
    };
}
