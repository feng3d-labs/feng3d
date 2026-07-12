import { Color4 as Color4Math, Vector2, Vector3 } from '@feng3d/math';
import type { Color4 } from '../core/Color4';
import { Geometry, GeometryLogic, watchGeometryInvalid, registerCloneFactory } from './Geometry';
import { logic, registerLogic } from '@feng3d/reactivity';

declare module './Geometry'
{
    export interface GeometryMap
    {
        PointGeometry: PointGeometry;
    }
}

/**
 * 点信息
 */
export interface PointInfo
{
    readonly position?: Vector3;
    readonly color?: Color4;
    readonly normal?: Vector3;
    readonly uv?: Vector2;
}

/**
 * 点几何体（纯数据接口）。
 *
 * 通过 {@link points} 列表声明点位，geometryLogic 在 updateGeometry 时按点位生成
 * positions/uvs/normals/colors/indices。修改数组内数据需要手动调用
 * `logic(g).invalidateGeometry()`。
 */
export interface PointGeometry extends Geometry
{
    readonly __type__: 'PointGeometry';
    /** 点数据列表 */
    readonly points: PointInfo[];
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

// 注册默认值（缺失字段自动填充）
registerLogic('PointGeometry', undefined, {
    name: '',
    scaleU: 1,
    scaleV: 1,
    points: [],
});

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

export class PointGeometryLogic extends GeometryLogic
{
    constructor(geometry: PointGeometry)
    {
        super(geometry, () => buildPoint(geometry, this));
        watchGeometryInvalid(geometry, ['points'], this);
    }
}

function buildPoint(g: PointGeometry, lg: GeometryLogic): void
{
    let numPoints = g.points.length;
    const indices: number[] = [];
    const positionData: number[] = [];
    const normalData: number[] = [];
    const uvData: number[] = [];
    const colors: number[] = [];
    numPoints = Math.max(1, numPoints);

    for (let i = 0; i < numPoints; i++)
    {
        const element = g.points[i];
        const position = (element && element.position) || Vector3.ZERO;
        const color = (element && element.color) || Color4Math.WHITE;
        const normal = (element && element.normal) || Vector3.ZERO;
        const uv = (element && element.uv) || Vector2.zero;
        indices[i] = i;
        positionData.push(position.x, position.y, position.z);
        normalData.push(normal.x, normal.y, normal.z);
        uvData.push(uv.x, uv.y);
        colors.push(color.r, color.g, color.b, color.a);
    }
    lg.positions = positionData;
    lg.uvs = uvData;
    lg.normals = normalData;
    lg.indices = indices;
    lg.colors = colors;
}

registerLogic('PointGeometry', PointGeometryLogic);
registerCloneFactory('PointGeometry', (src: PointGeometry) => createPointGeometryWithData(src));
