import { Geometry, GeometryLogic, registerCloneFactory, registerDefaultGeometryFactory } from '../geometry/Geometry';
import { registerLogic, computed, Computed } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';
import { geometryUtils } from '../geometry/GeometryUtils';

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        QuadGeometry: QuadGeometry;
    }
}

/**
 * 四边形面皮几何体（纯数据接口，无构造参数）。
 */
export interface QuadGeometry extends Geometry
{
    readonly __type__: 'QuadGeometry';
}

/**
 * 创建 QuadGeometry 实例。
 */
export function createQuadGeometry(): QuadGeometry
{
    return {
        __type__: 'QuadGeometry',
        name: 'Quad',
        scaleU: 1,
        scaleV: 1,
    };
}

/**
 * 四边形面皮几何体逻辑。
 *
 * positions/uvs/indices 为常量（非响应式），但 normals/tangents 依赖 positions/indices，
 * 仍以 computed 表达以便在 positions 被替换时联动重算。所有属性独立懒计算。
 */
export class QuadGeometryLogic extends GeometryLogic
{
    private readonly _positions: Computed<Float32Array>;
    private readonly _normals: Computed<Float32Array>;
    private readonly _tangents: Computed<Float32Array>;
    private readonly _uvs: Computed<Float32Array>;
    private readonly _indicesComputed: Computed<number[]>;

    constructor(geometry: Geometry)
    {
        super(geometry);

        // 每个属性独立 computed，仅在实际被读取时计算
        this._positions = computed(() => this.buildPositions());
        this._uvs = computed(() => this.buildUVs());
        this._indicesComputed = computed(() => this.buildIndices());
        // normals/tangents 依赖 positions/uvs/indices computed，跨 computed 依赖
        this._normals = computed(() => this.buildNormals());
        this._tangents = computed(() => this.buildTangents());

        // attributes: data 由 computed getter 驱动
        this.attributes = this.createAttributes();
    }

    /** indices 由 computed 驱动（override 基类 getter） */
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
            a_color: { data: new Float32Array(), format: 'float32x4' },
            a_uv: computedAttr(this._uvs, 'float32x2'),
            a_normal: computedAttr(this._normals, 'float32x3'),
            a_tangent: computedAttr(this._tangents, 'float32x3'),
            a_skinIndices: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights: { data: new Float32Array(), format: 'float32x4' },
            a_skinIndices1: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights1: { data: new Float32Array(), format: 'float32x4' },
        };
    }

    // ---- 顶点构建（直接返回 Float32Array/number[]） ----

    private buildPositions(): Float32Array
    {
        const size = 0.5;

        return new Float32Array([-size, size, 0, size, size, 0, size, -size, 0, -size, -size, 0]);
    }

    private buildUVs(): Float32Array
    {
        return new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
    }

    private buildIndices(): number[]
    {
        return [0, 1, 2, 0, 2, 3];
    }

    private buildNormals(): Float32Array
    {
        // 读取 positions/indices computed 以建立跨依赖
        const indices = this._indicesComputed.value;
        const positions = Array.from(this._positions.value);

        return new Float32Array(geometryUtils.createVertexNormals(indices, positions, true));
    }

    private buildTangents(): Float32Array
    {
        // 读取 positions/uvs/indices computed 以建立跨依赖
        const indices = this._indicesComputed.value;
        const positions = Array.from(this._positions.value);
        const uvs = Array.from(this._uvs.value);

        return new Float32Array(geometryUtils.createVertexTangents(indices, positions, uvs, true));
    }
}

registerLogic('QuadGeometry', QuadGeometryLogic);
registerCloneFactory('QuadGeometry', () => createQuadGeometry());
registerDefaultGeometryFactory('Quad', createQuadGeometry);
