import { Color4, Vector3 } from '@feng3d/math';
import { Geometry } from './Geometry';
import { registerDefaults } from '../core/logic';

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
        startColor: new Color4(),
        endColor: new Color4(),
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
registerDefaults('SegmentGeometry', {
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
            startColor: s.startColor.clone(),
            endColor: s.endColor.clone(),
        })),
    };
}
