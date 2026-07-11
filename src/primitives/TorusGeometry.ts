import { Geometry } from '../geometry/Geometry';
import { registerLogic } from '@feng3d/reactivity';

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        TorusGeometry: TorusGeometry;
    }
}

/**
 * 圆环几何体（纯数据接口）。
 */
export interface TorusGeometry extends Geometry
{
    readonly __type__: 'TorusGeometry';
    /** 半径 */
    readonly radius: number;
    /** 管道半径 */
    readonly tubeRadius: number;
    /** 半径方向分割数 */
    readonly segmentsR: number;
    /** 管道方向分割数 */
    readonly segmentsT: number;
    /** 是否朝上 */
    readonly yUp: boolean;
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

// 注册默认值（缺失字段自动填充）
registerLogic('TorusGeometry', undefined, {
    name: 'Torus',
    scaleU: 1,
    scaleV: 1,
    radius: 0.5,
    tubeRadius: 0.1,
    segmentsR: 16,
    segmentsT: 8,
    yUp: true,
});

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
