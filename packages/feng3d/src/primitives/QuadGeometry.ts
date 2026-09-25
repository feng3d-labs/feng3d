import { Geometry, GeometryLogic } from '../geometry/Geometry';
import { registerLogic, computed } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';
import { geometryUtils } from '../geometry/GeometryUtils';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        QuadGeometry: QuadGeometryLogic;
    }
}

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
 * QuadGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic}。positions/uvs/indices 为常量（非响应式），
 * 但 normals/tangents 依赖 positions/indices，仍以 computed 表达以便在 positions
 * 被替换时联动重算。所有属性独立懒计算。
 */
export class QuadGeometryLogic extends GeometryLogic
{
    // 每个属性独立 computed，仅在实际被读取时计算
    readonly #_positions = computed(() => this.#buildPositions());
    readonly #_uvs = computed(() => this.#buildUVs());
    readonly #_indicesComputed = computed(() => this.#buildIndices());
    // normals/tangents 依赖 positions/uvs/indices computed，跨 computed 依赖
    readonly #_normals = computed(() => this.#buildNormals());
    readonly #_tangents = computed(() => this.#buildTangents());

    // attributes: data 由 computed getter 驱动
    readonly #_attrTable: VertexAttributes = {
        a_position: this.computedAttr(this.#_positions, 'float32x3'),
        a_color: { data: new Float32Array(), format: 'float32x4' },
        a_uv: this.computedAttr(this.#_uvs, 'float32x2'),
        a_normal: this.computedAttr(this.#_normals, 'float32x3'),
        a_tangent: this.computedAttr(this.#_tangents, 'float32x3'),
    };

    protected constructor(data: QuadGeometry)
    {
        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: QuadGeometry): QuadGeometryLogic
    {
        return new QuadGeometryLogic(data);
    }

    override get vertices(): VertexAttributes
    {
        return this.#_attrTable;
    }

    /** indices 由 computed 驱动（覆写基类 getter） */
    override get vertexIndices(): number[]
    {
        return this.#_indicesComputed.value;
    }

    // ---- 顶点构建（直接返回 Float32Array/number[]） ----

    #buildPositions(): Float32Array
    {
        const size = 0.5;

        return new Float32Array([-size, size, 0, size, size, 0, size, -size, 0, -size, -size, 0]);
    }

    #buildUVs(): Float32Array
    {
        return new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
    }

    #buildIndices(): number[]
    {
        return [0, 1, 2, 0, 2, 3];
    }

    #buildNormals(): Float32Array
    {
        // 读取 positions/indices computed 以建立跨依赖
        const indices = this.#_indicesComputed.value;
        const positions = Array.from(this.#_positions.value);

        return new Float32Array(geometryUtils.createVertexNormals(indices, positions, true));
    }

    #buildTangents(): Float32Array
    {
        // 读取 positions/uvs/indices computed 以建立跨依赖
        const indices = this.#_indicesComputed.value;
        const positions = Array.from(this.#_positions.value);
        const uvs = Array.from(this.#_uvs.value);

        return new Float32Array(geometryUtils.createVertexTangents(indices, positions, uvs, true));
    }
}

registerLogic('QuadGeometry', QuadGeometryLogic as unknown as new (data: QuadGeometry) => QuadGeometryLogic);
