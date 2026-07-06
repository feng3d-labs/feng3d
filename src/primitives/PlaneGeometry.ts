import { Geometry } from '../geometry/Geometry';
import { registerDefaults } from '@feng3d/reactivity';

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        PlaneGeometry: PlaneGeometry;
    }
}

/**
 * 平面几何体（纯数据接口）。
 */
export interface PlaneGeometry extends Geometry
{
    readonly __type__: 'PlaneGeometry';
    /** 宽度 */
    readonly width: number;
    /** 高度 */
    readonly height: number;
    /** 横向分割数 */
    readonly segmentsW: number;
    /** 纵向分割数 */
    readonly segmentsH: number;
    /** 是否朝上 */
    readonly yUp: boolean;
}

/**
 * 创建 PlaneGeometry 实例。
 */
export function createPlaneGeometry(): PlaneGeometry
{
    return {
        __type__: 'PlaneGeometry',
        name: 'Plane',
        scaleU: 1,
        scaleV: 1,
        width: 1,
        height: 1,
        segmentsW: 1,
        segmentsH: 1,
        yUp: true,
    };
}

// 注册默认值（缺失字段自动填充）
registerDefaults('PlaneGeometry', {
    name: 'Plane',
    scaleU: 1,
    scaleV: 1,
    width: 1,
    height: 1,
    segmentsW: 1,
    segmentsH: 1,
    yUp: true,
});

/**
 * 按现有数据克隆一份 PlaneGeometry（用于 clone）。
 */
export function createPlaneGeometryWithData(src: PlaneGeometry): PlaneGeometry
{
    return {
        __type__: 'PlaneGeometry',
        name: src.name,
        scaleU: src.scaleU,
        scaleV: src.scaleV,
        width: src.width,
        height: src.height,
        segmentsW: src.segmentsW,
        segmentsH: src.segmentsH,
        yUp: src.yUp,
    };
}
