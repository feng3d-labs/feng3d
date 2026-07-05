import { Geometry } from '../geometry/Geometry';

/**
 * 圆环几何体（纯数据接口）。
 */
export interface TorusGeometry extends Geometry
{
    /** 半径 */
    radius: number;
    /** 管道半径 */
    tubeRadius: number;
    /** 半径方向分割数 */
    segmentsR: number;
    /** 管道方向分割数 */
    segmentsT: number;
    /** 是否朝上 */
    yUp: boolean;
}

/**
 * 创建 TorusGeometry 实例。
 */
export function createTorusGeometry(): TorusGeometry
{
    return {
        __type__: 'TorusGeometry',
        name: 'Torus',
        scaleU: 1,
        scaleV: 1,
        radius: 0.5,
        tubeRadius: 0.1,
        segmentsR: 16,
        segmentsT: 8,
        yUp: true,
    };
}

/**
 * 按现有数据克隆一份 TorusGeometry（用于 clone）。
 */
export function createTorusGeometryWithData(src: TorusGeometry): TorusGeometry
{
    return {
        __type__: 'TorusGeometry',
        name: src.name,
        scaleU: src.scaleU,
        scaleV: src.scaleV,
        radius: src.radius,
        tubeRadius: src.tubeRadius,
        segmentsR: src.segmentsR,
        segmentsT: src.segmentsT,
        yUp: src.yUp,
    };
}
