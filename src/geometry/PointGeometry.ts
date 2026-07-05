import { Color4, Vector2, Vector3 } from '@feng3d/math';
import { Geometry } from './Geometry';

/**
 * 点信息
 */
export interface PointInfo
{
    position?: Vector3;
    color?: Color4;
    normal?: Vector3;
    uv?: Vector2;
}

/**
 * 点几何体（纯数据接口）。
 *
 * 通过 {@link points} 列表声明点位，geometryLogic 在 updateGeometry 时按点位生成
 * positions/uvs/normals/colors/indices。修改数组内数据需要手动调用
 * `geometryLogic(g).invalidateGeometry()`。
 */
export interface PointGeometry extends Geometry
{
    /** 点数据列表 */
    points: PointInfo[];
}

/**
 * 创建 PointGeometry 实例。
 */
export function createPointGeometry(): PointGeometry
{
    return {
        __type__: 'PointGeometry',
        name: '',
        scaleU: 1,
        scaleV: 1,
        points: [],
    };
}

/**
 * 按现有数据克隆一份 PointGeometry（用于 clone）。
 */
export function createPointGeometryWithData(src: PointGeometry): PointGeometry
{
    return {
        __type__: 'PointGeometry',
        name: src.name,
        scaleU: src.scaleU,
        scaleV: src.scaleV,
        points: src.points.map(p => ({ ...p })),
    };
}
