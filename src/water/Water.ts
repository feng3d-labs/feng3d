import { Renderable, createRenderable } from '../core/Renderable';
import { Geometry } from '../geometry/Geometry';
import { getDefaultMaterial } from '../materials/materialLogic';
import { FrameBufferObject } from '../render/FrameBufferObject';

import './waterLogic';

declare global
{
    export interface MixinsComponentMap
    {
        Water: Water;
    }
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
    geometry: any;
    material: any;
    frameBufferObject: FrameBufferObject;
}

/**
 * 创建 Water 实例。
 */
export function createWater(): Water
{
    return {
        __type__: 'Water', ...createRenderable(),
        geometry: Geometry.getDefault('Plane'),
        material: getDefaultMaterial('Water-Material'),
        frameBufferObject: new FrameBufferObject(),
    };
}
