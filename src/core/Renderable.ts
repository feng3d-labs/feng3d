import { Geometry } from '../geometry/Geometry';
import { getDefaultGeometry } from '../geometry/geometryLogic';
import { Material } from '../materials/Material';
import { getDefaultMaterial } from '../materials/materialLogic';
import { RayCastable, createRayCastable } from './RayCastable';
import { registerDefaults } from './logic';

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
 * Renderable 默认值模板。
 *
 * 注意：geometry/material 是重量级对象（含默认 Geometry/Material），
 * registerDefaults 在字段缺失时通过函数返回新实例，避免无谓创建。
 * 但为了避免在 registerDefaults 注册期触发循环依赖（getDefaultGeometry 依赖 materialLogic 已注册），
 * 这里把 geometry/material 默认值留空（undefined），由 renderableLogic 在使用时按需 fallback。
 */
const renderableDefaults = {
    __type__: 'Renderable',
    enabled: true,
    castShadows: true,
    receiveShadows: true,
};

registerDefaults('Renderable', renderableDefaults);

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
