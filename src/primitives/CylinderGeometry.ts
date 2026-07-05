import { Geometry } from '../geometry/Geometry';
import { registerDefaults } from '../core/logic';

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        CylinderGeometry: CylinderGeometry;
    }
}

/**
 * 圆柱体几何体（纯数据接口）。
 */
export interface CylinderGeometry extends Geometry
{
    /** 顶部半径 */
    topRadius: number;
    /** 底部半径 */
    bottomRadius: number;
    /** 高度 */
    height: number;
    /** 横向分割数 */
    segmentsW: number;
    /** 纵向分割数 */
    segmentsH: number;
    /** 顶部是否封口 */
    topClosed: boolean;
    /** 底部是否封口 */
    bottomClosed: boolean;
    /** 侧面是否封口 */
    surfaceClosed: boolean;
    /** 是否朝上 */
    yUp: boolean;
}

/**
 * 创建 CylinderGeometry 实例。
 */
export function createCylinderGeometry(): CylinderGeometry
{
    return {
        __type__: 'CylinderGeometry',
        name: 'Cylinder',
        scaleU: 1,
        scaleV: 1,
        topRadius: 0.5,
        bottomRadius: 0.5,
        height: 2,
        segmentsW: 16,
        segmentsH: 1,
        topClosed: true,
        bottomClosed: true,
        surfaceClosed: true,
        yUp: true,
    };
}

// 注册默认值（缺失字段自动填充）
registerDefaults('CylinderGeometry', {
    name: 'Cylinder',
    scaleU: 1,
    scaleV: 1,
    topRadius: 0.5,
    bottomRadius: 0.5,
    height: 2,
    segmentsW: 16,
    segmentsH: 1,
    topClosed: true,
    bottomClosed: true,
    surfaceClosed: true,
    yUp: true,
});

/**
 * 按现有数据克隆一份 CylinderGeometry（用于 clone）。
 */
export function createCylinderGeometryWithData(src: CylinderGeometry): CylinderGeometry
{
    return {
        __type__: 'CylinderGeometry',
        name: src.name,
        scaleU: src.scaleU,
        scaleV: src.scaleV,
        topRadius: src.topRadius,
        bottomRadius: src.bottomRadius,
        height: src.height,
        segmentsW: src.segmentsW,
        segmentsH: src.segmentsH,
        topClosed: src.topClosed,
        bottomClosed: src.bottomClosed,
        surfaceClosed: src.surfaceClosed,
        yUp: src.yUp,
    };
}
