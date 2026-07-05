import { Geometry } from '../geometry/Geometry';
import { registerDefaults } from '../core/logic';

/**
 * 胶囊体几何体（纯数据接口）。
 */
export interface CapsuleGeometry extends Geometry
{
    /** 胶囊体半径 */
    radius: number;
    /** 胶囊体高度 */
    height: number;
    /** 横向分割数 */
    segmentsW: number;
    /** 纵向分割数 */
    segmentsH: number;
    /** 是否朝上 */
    yUp: boolean;
}

/**
 * 创建 CapsuleGeometry 实例。
 */
export function createCapsuleGeometry(): CapsuleGeometry
{
    return {
        __type__: 'CapsuleGeometry',
        name: 'Capsule',
        scaleU: 1,
        scaleV: 1,
        radius: 0.5,
        height: 1,
        segmentsW: 16,
        segmentsH: 15,
        yUp: true,
    };
}

// 注册默认值（缺失字段自动填充）
registerDefaults('CapsuleGeometry', {
    name: 'Capsule',
    scaleU: 1,
    scaleV: 1,
    radius: 0.5,
    height: 1,
    segmentsW: 16,
    segmentsH: 15,
    yUp: true,
});

/**
 * 按现有数据克隆一份 CapsuleGeometry（用于 clone）。
 */
export function createCapsuleGeometryWithData(src: CapsuleGeometry): CapsuleGeometry
{
    return {
        __type__: 'CapsuleGeometry',
        name: src.name,
        scaleU: src.scaleU,
        scaleV: src.scaleV,
        radius: src.radius,
        height: src.height,
        segmentsW: src.segmentsW,
        segmentsH: src.segmentsH,
        yUp: src.yUp,
    };
}
