import { Color4 as Color4Math, Vector3 } from '@feng3d/math';
import type { Color4 } from '../core/Color4';
import { Geometry, GeometryLogic, registerCloneFactory } from './Geometry';
import { registerLogic, reactive, computed, Computed } from '@feng3d/reactivity';
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
 * 通过 {@link segments} 列表声明线段，geometryLogic 用 computed 按 segments 懒生成
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
    private readonly _positions: Computed<Float32Array>;
    private readonly _colors: Computed<Float32Array>;
    private readonly _indicesComputed: Computed<number[]>;

    constructor(geometry: SegmentGeometry)
    {
        super(geometry);

        this._positions = computed(() => this.buildPositions());
        this._colors = computed(() => this.buildColors());
        this._indicesComputed = computed(() => this.buildIndices());

        this.attributes = this.createAttributes();
    }

    get indices(): number[] { return this._indicesComputed.value; }

    private createAttributes(): Record<string, VertexAttribute>
    {
        const computedAttr = (ref: Computed<Float32Array>, format: VertexAttribute['format']): VertexAttribute =>
        {
            const obj: VertexAttribute = { data: new Float32Array(), format };
            Object.defineProperty(obj, 'data', { get() { return ref.value; }, enumerable: true });

            return obj;
        };

        return {
            a_position: computedAttr(this._positions, 'float32x3'),
            a_color: computedAttr(this._colors, 'float32x4'),
            a_uv: { data: new Float32Array(), format: 'float32x2' },
            a_normal: { data: new Float32Array(), format: 'float32x3' },
            a_tangent: { data: new Float32Array(), format: 'float32x3' },
            a_skinIndices: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights: { data: new Float32Array(), format: 'float32x4' },
            a_skinIndices1: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights1: { data: new Float32Array(), format: 'float32x4' },
        };
    }

    private buildPositions(): Float32Array
    {
        const g = reactive(this._geometry as SegmentGeometry);
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

    private buildColors(): Float32Array
    {
        const g = reactive(this._geometry as SegmentGeometry);
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

    private buildIndices(): number[]
    {
        const g = reactive(this._geometry as SegmentGeometry);
        const numSegments = Math.max(1, g.segments.length);
        const indices: number[] = [];
        for (let i = 0; i < numSegments; i++)
        {
            indices.push(i * 2, i * 2 + 1);
        }

        return indices;
    }
}

registerLogic('SegmentGeometry', SegmentGeometryLogic);
registerCloneFactory('SegmentGeometry', (src: SegmentGeometry) => createSegmentGeometryWithData(src));
