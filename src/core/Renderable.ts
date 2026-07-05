import { Geometry } from '../geometry/Geometry';
import { getDefaultGeometry } from '../geometry/geometryLogic';
import { Material } from '../materials/Material';
import { getDefaultMaterial } from '../materials/materialLogic';
import { RayCastable, createRayCastable } from './RayCastable';

// 触发 renderableLogic 注册到 logic 分发表
import './renderableLogic';

/**
 * 可渲染组件（纯数据接口）。
 *
 * 渲染逻辑（renderObject computed、beforeRender 分发、射线相交、加载状态、dispose）
 * 由 renderableLogic 提供。
 */
export interface Renderable extends RayCastable
{
    /** 几何体 */
    geometry: Geometry;
    /** 材质 */
    material: Material;
    /** 是否投射阴影 */
    castShadows: boolean;
    /** 是否接受阴影 */
    receiveShadows: boolean;
}

/**
 * 创建 Renderable 实例。
 */
export function createRenderable(): Renderable
{
    return {
        ...createRayCastable(),
        __type__: 'Renderable',
        geometry: getDefaultGeometry('Cube'),
        material: getDefaultMaterial('Default-Material'),
        castShadows: true,
        receiveShadows: true,
    };
}
