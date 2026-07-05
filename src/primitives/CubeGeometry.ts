import { Geometry } from '../geometry/Geometry';
import { registerDefaults } from '../core/logic';

/**
 * 立（长）方体几何体（纯数据接口）。
 */
export interface CubeGeometry extends Geometry
{
    /** 宽度 */
    width: number;
    /** 高度 */
    height: number;
    /** 深度 */
    depth: number;
    /** 宽度方向分割数 */
    segmentsW: number;
    /** 高度方向分割数 */
    segmentsH: number;
    /** 深度方向分割数 */
    segmentsD: number;
    /** 是否为6块贴图 */
    tile6: boolean;
}

/**
 * 创建 CubeGeometry 实例。
 */
export function createCubeGeometry(): CubeGeometry
{
    return {
        __type__: 'CubeGeometry',
        name: 'Cube',
        scaleU: 1,
        scaleV: 1,
        width: 1,
        height: 1,
        depth: 1,
        segmentsW: 1,
        segmentsH: 1,
        segmentsD: 1,
        tile6: false,
    };
}

// 注册默认值（缺失字段自动填充）
registerDefaults('CubeGeometry', {
    name: 'Cube',
    scaleU: 1,
    scaleV: 1,
    width: 1,
    height: 1,
    depth: 1,
    segmentsW: 1,
    segmentsH: 1,
    segmentsD: 1,
    tile6: false,
});

/**
 * 按现有数据克隆一份 CubeGeometry（用于 clone）。
 */
export function createCubeGeometryWithData(src: CubeGeometry): CubeGeometry
{
    return {
        __type__: 'CubeGeometry',
        name: src.name,
        scaleU: src.scaleU,
        scaleV: src.scaleV,
        width: src.width,
        height: src.height,
        depth: src.depth,
        segmentsW: src.segmentsW,
        segmentsH: src.segmentsH,
        segmentsD: src.segmentsD,
        tile6: src.tile6,
    };
}
