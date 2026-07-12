import { Color4 as Color4Math, Vector2, Vector3 } from '@feng3d/math';
import type { Color4 } from '../core/Color4';
import { Geometry, GeometryLogic, registerCloneFactory } from './Geometry';
import { registerLogic, reactive, computed, Computed } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';

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
 * 通过 {@link points} 列表声明点位，geometryLogic 用 computed 按 points 懒生成
 * positions/uvs/normals/colors/indices。points 变化时 computed 自动失效重算。
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
    private readonly _positions: Computed<Float32Array>;
    private readonly _normals: Computed<Float32Array>;
    private readonly _uvs: Computed<Float32Array>;
    private readonly _colors: Computed<Float32Array>;
    private readonly _indicesComputed: Computed<number[]>;

    constructor(geometry: PointGeometry)
    {
        super(geometry);

        this._positions = computed(() => this.buildPositions());
        this._normals = computed(() => this.buildNormals());
        this._uvs = computed(() => this.buildUVs());
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
            a_uv: computedAttr(this._uvs, 'float32x2'),
            a_normal: computedAttr(this._normals, 'float32x3'),
            a_tangent: { data: new Float32Array(), format: 'float32x3' },
            a_skinIndices: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights: { data: new Float32Array(), format: 'float32x4' },
            a_skinIndices1: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights1: { data: new Float32Array(), format: 'float32x4' },
        };
    }

    private buildPositions(): Float32Array
    {
        const g = reactive(this._geometry as PointGeometry);
        const numPoints = Math.max(1, g.points.length);
        const data: number[] = [];
        for (let i = 0; i < numPoints; i++)
        {
            const element = g.points[i];
            const position = (element && element.position) || Vector3.ZERO;
            data.push(position.x, position.y, position.z);
        }

        return new Float32Array(data);
    }

    private buildNormals(): Float32Array
    {
        const g = reactive(this._geometry as PointGeometry);
        const numPoints = Math.max(1, g.points.length);
        const data: number[] = [];
        for (let i = 0; i < numPoints; i++)
        {
            const element = g.points[i];
            const normal = (element && element.normal) || Vector3.ZERO;
            data.push(normal.x, normal.y, normal.z);
        }

        return new Float32Array(data);
    }

    private buildUVs(): Float32Array
    {
        const g = reactive(this._geometry as PointGeometry);
        const numPoints = Math.max(1, g.points.length);
        const data: number[] = [];
        for (let i = 0; i < numPoints; i++)
        {
            const element = g.points[i];
            const uv = (element && element.uv) || Vector2.zero;
            data.push(uv.x, uv.y);
        }

        return new Float32Array(data);
    }

    private buildColors(): Float32Array
    {
        const g = reactive(this._geometry as PointGeometry);
        const numPoints = Math.max(1, g.points.length);
        const data: number[] = [];
        for (let i = 0; i < numPoints; i++)
        {
            const element = g.points[i];
            const color = (element && element.color) || Color4Math.WHITE;
            data.push(color.r, color.g, color.b, color.a);
        }

        return new Float32Array(data);
    }

    private buildIndices(): number[]
    {
        const g = reactive(this._geometry as PointGeometry);
        const numPoints = Math.max(1, g.points.length);
        const indices: number[] = [];
        for (let i = 0; i < numPoints; i++)
        {
            indices[i] = i;
        }

        return indices;
    }
}

registerLogic('PointGeometry', PointGeometryLogic);
registerCloneFactory('PointGeometry', (src: PointGeometry) => createPointGeometryWithData(src));
