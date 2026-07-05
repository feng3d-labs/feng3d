import { Geometry } from '../geometry/Geometry';
import { registerDefaults } from '../core/logic';

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        SphereGeometry: SphereGeometry;
    }
}

/**
 * 球体几何体（纯数据接口）。
 */
export interface SphereGeometry extends Geometry
{
    /** 球体半径 */
    radius: number;
    /** 横向分割数 */
    segmentsW: number;
    /** 纵向分割数 */
    segmentsH: number;
    /** 是否朝上 */
    yUp: boolean;
}

/**
 * 创建 SphereGeometry 实例。
 */
export function createSphereGeometry(): SphereGeometry
{
    return {
        __type__: 'SphereGeometry',
        name: 'Sphere',
        scaleU: 1,
        scaleV: 1,
        radius: 0.5,
        segmentsW: 16,
        segmentsH: 12,
        yUp: true,
    };
}

// 注册默认值（缺失字段自动填充）
registerDefaults('SphereGeometry', {
    name: 'Sphere',
    scaleU: 1,
    scaleV: 1,
    radius: 0.5,
    segmentsW: 16,
    segmentsH: 12,
    yUp: true,
});

/**
 * 按现有数据克隆一份 SphereGeometry（用于 clone）。
 */
export function createSphereGeometryWithData(src: SphereGeometry): SphereGeometry
{
    return {
        __type__: 'SphereGeometry',
        name: src.name,
        scaleU: src.scaleU,
        scaleV: src.scaleV,
        radius: src.radius,
        segmentsW: src.segmentsW,
        segmentsH: src.segmentsH,
        yUp: src.yUp,
    };
}
