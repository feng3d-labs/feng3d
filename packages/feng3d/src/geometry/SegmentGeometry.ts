import { Color4 as Color4Math, Vector3, Vector3Like } from '@feng3d/math';
import type { Color4 } from '../core/Color4';
import { Geometry, geometryLogic, GeometryLogic } from './Geometry';
import { registerLogic, reactive, computed, Computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';

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
    readonly start: Vector3Like;
    /** 终点坐标 */
    readonly end: Vector3Like;
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
 * 通过 {@link segments} 列表声明线段，geometryLogic 用 computed 按 segments 懒生成
 * positions/colors/indices。
 */
export interface SegmentGeometry extends Geometry
{
    readonly __type__: 'SegmentGeometry';
    /** 线段列表 */
    readonly segments: Segment[];
}

// SegmentGeometry 默认值由 segmentGeometryLogic 工厂顶部处理（见下）

/**
 * 创建 SegmentGeometryLogic 实例（函数式实现）。
 *
 * 组合 {@link geometryLogic}，用 computed 按 segments 懒生成
 * positions/colors/indices。segments 变化时 computed 自动失效重算。
 */
export function segmentGeometryLogic(geometry: SegmentGeometry): GeometryLogic
{
    // 组合基座
    const base = geometryLogic(geometry);

    // 默认值（缺失字段单独赋值）
    const writable = geometry as UnReadonly<SegmentGeometry>;
    if (geometry.name === undefined) writable.name = 'Segment';
    if (geometry.scaleU === undefined) writable.scaleU = 1;
    if (geometry.scaleV === undefined) writable.scaleV = 1;
    if (geometry.segments === undefined) writable.segments = [];

    const _positions = computed(() => buildPositions());
    const _colors = computed(() => buildColors());
    const _indicesComputed = computed(() => buildIndices());

    base.setAttributes(createAttributes());

    // indices 由 computed 驱动（覆盖基类 getter）
    Object.defineProperty(base, 'indices', { get() { return _indicesComputed.value; }, enumerable: true, configurable: true });

    function createAttributes(): Record<string, VertexAttribute>
    {
        const computedAttr = (ref: Computed<Float32Array>, format: VertexAttribute['format']): VertexAttribute =>
        {
            const obj: VertexAttribute = { data: new Float32Array(), format };
            Object.defineProperty(obj, 'data', { get() { return ref.value; }, enumerable: true });

            return obj;
        };

        return {
            a_position: computedAttr(_positions, 'float32x3'),
            a_color: computedAttr(_colors, 'float32x4'),
            a_uv: { data: new Float32Array(), format: 'float32x2' },
            a_normal: { data: new Float32Array(), format: 'float32x3' },
            a_tangent: { data: new Float32Array(), format: 'float32x3' },
            a_skinIndices: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights: { data: new Float32Array(), format: 'float32x4' },
            a_skinIndices1: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights1: { data: new Float32Array(), format: 'float32x4' },
        };
    }

    function buildPositions(): Float32Array
    {
        const g = reactive(geometry);
        const numSegments = Math.max(1, g.segments.length);
        const data: number[] = [];
        for (let i = 0; i < numSegments; i++)
        {
            const element = g.segments[i];
            const start = (element && element.start) || new Vector3();
            const end = (element && element.end) || new Vector3();
            data.push(start.x, start.y, start.z, end.x, end.y, end.z);
        }

        return new Float32Array(data);
    }

    function buildColors(): Float32Array
    {
        const g = reactive(geometry);
        const numSegments = Math.max(1, g.segments.length);
        const data: number[] = [];
        for (let i = 0; i < numSegments; i++)
        {
            const element = g.segments[i];
            const startColor = (element && element.startColor) || new Color4Math();
            const endColor = (element && element.endColor) || new Color4Math();
            data.push(startColor.r, startColor.g, startColor.b, startColor.a,
                endColor.r, endColor.g, endColor.b, endColor.a);
        }

        return new Float32Array(data);
    }

    function buildIndices(): number[]
    {
        const g = reactive(geometry);
        const numSegments = Math.max(1, g.segments.length);
        const indices: number[] = [];
        for (let i = 0; i < numSegments; i++)
        {
            indices.push(i * 2, i * 2 + 1);
        }

        return indices;
    }

    return base;
}

registerLogic('SegmentGeometry', segmentGeometryLogic);
