import { Color4 as Color4Math, Vector3 } from '@feng3d/math';
import type { Color4 } from '../core/Color4';
import { Geometry, GeometryLogic, watchGeometryInvalid, registerCloneFactory } from './Geometry';
import { registerLogic } from '@feng3d/reactivity';

declare module './Geometry'
{
    export interface GeometryMap
    {
        SegmentGeometry: SegmentGeometry;
    }
}

/**
 * 线段
 */
export interface Segment
{
    /** 起点坐标 */
    readonly start: Vector3;
    /** 终点坐标 */
    readonly end: Vector3;
    /** 起点颜色 */
    readonly startColor: Color4;
    /** 终点颜色 */
    readonly endColor: Color4;
}

/**
 * 创建线段数据。
 */
export function createSegment(): Segment
{
    return {
        start: new Vector3(),
        end: new Vector3(),
        startColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        endColor: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
    };
}

/**
 * 线段几何体（纯数据接口）。
 *
 * 通过 {@link segments} 列表声明线段，geometryLogic 在 updateGeometry 时按线段生成
 * positions/colors/indices。
 */
export interface SegmentGeometry extends Geometry
{
    readonly __type__: 'SegmentGeometry';
    /** 线段列表 */
    readonly segments: Segment[];
}

/**
 * 创建 SegmentGeometry 实例。
 */
export function createSegmentGeometry(): SegmentGeometry
{
    return {
        __type__: 'SegmentGeometry',
        name: 'Segment',
        scaleU: 1,
        scaleV: 1,
        segments: [],
    };
}

// 注册默认值（缺失字段自动填充）
registerLogic('SegmentGeometry', undefined, {
    name: 'Segment',
    scaleU: 1,
    scaleV: 1,
    segments: [],
});

/**
 * 按现有数据克隆一份 SegmentGeometry（用于 clone）。
 */
export function createSegmentGeometryWithData(src: SegmentGeometry): SegmentGeometry
{
    return {
        __type__: 'SegmentGeometry',
        name: src.name,
        scaleU: src.scaleU,
        scaleV: src.scaleV,
        segments: src.segments.map(s => ({
            start: s.start.clone(),
            end: s.end.clone(),
            startColor: { __type__: 'Color4', r: s.startColor.r, g: s.startColor.g, b: s.startColor.b, a: s.startColor.a },
            endColor: { __type__: 'Color4', r: s.endColor.r, g: s.endColor.g, b: s.endColor.b, a: s.endColor.a },
        })),
    };
}

export class SegmentGeometryLogic extends GeometryLogic
{
    constructor(geometry: SegmentGeometry)
    {
        super(geometry, () => buildSegment(geometry, this));
        watchGeometryInvalid(geometry, ['segments'], this);
    }
}

function buildSegment(g: SegmentGeometry, lg: GeometryLogic): void
{
    let numSegments = g.segments.length;
    numSegments = Math.max(1, numSegments);
    const indices: number[] = [];
    const positionData: number[] = [];
    const colorData: number[] = [];
    for (let i = 0; i < numSegments; i++)
    {
        const element = g.segments[i];
        const start = (element && element.start) || new Vector3();
        const end = (element && element.end) || new Vector3();
        const startColor = (element && element.startColor) || new Color4Math();
        const endColor = (element && element.endColor) || new Color4Math();
        indices.push(i * 2, i * 2 + 1);
        positionData.push(start.x, start.y, start.z, end.x, end.y, end.z);
        colorData.push(startColor.r, startColor.g, startColor.b, startColor.a,
            endColor.r, endColor.g, endColor.b, endColor.a);
    }
    lg.positions = positionData;
    lg.colors = colorData;
    lg.indices = indices;
}

registerLogic('SegmentGeometry', SegmentGeometryLogic);
registerCloneFactory('SegmentGeometry', (src: SegmentGeometry) => createSegmentGeometryWithData(src));
