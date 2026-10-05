import { computedAttr, Geometry, geometryLogicProto, setupGeometryLogicState, GeometryLogic, type GeometryLogicState } from '../geometry/Geometry';
import { registerLogic, computed, type Computed, createLogicProto } from '@feng3d/reactivity';
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
export interface QuadGeometryLogic extends GeometryLogic
{
}

/** QuadGeometryLogic 实例的内部状态（不进公开接口，工厂装配时写入） */
interface QuadGeometryLogicState extends GeometryLogicState
{
    _attrTable: VertexAttributes;
    _indicesComputed: Computed<number[]>;
}

/** QuadGeometryLogic 的共享原型：继承 Geometry 基类实现，覆写 vertices / vertexIndices */
const quadGeometryLogicProto = createLogicProto<QuadGeometryLogic>(geometryLogicProto, {
    vertices: {
        get: function (this: QuadGeometryLogic & QuadGeometryLogicState): VertexAttributes { return this._attrTable; },
    },
    /** indices 由 computed 驱动（覆写基类 getter） */
    vertexIndices: {
        get: function (this: QuadGeometryLogic & QuadGeometryLogicState): number[] { return this._indicesComputed.value; },
    },
});

/**
 * 工厂函数：QuadGeometryLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 几何数据（raw）
 */
export function quadGeometryLogic(data: QuadGeometry): QuadGeometryLogic
{
    // ---- 顶点构建（直接返回 Float32Array/number[]） ----

    function buildPositions(): Float32Array
    {
        const size = 0.5;

        return new Float32Array([-size, size, 0, size, size, 0, size, -size, 0, -size, -size, 0]);
    }

    function buildUVs(): Float32Array
    {
        return new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
    }

    function buildIndices(): number[]
    {
        return [0, 1, 2, 0, 2, 3];
    }

    function buildNormals(): Float32Array
    {
        // 读取 positions/indices computed 以建立跨依赖
        const indices = indicesComputed.value;
        const positions = Array.from(positionsComputed.value);

        return new Float32Array(geometryUtils.createVertexNormals(indices, positions, true));
    }

    function buildTangents(): Float32Array
    {
        // 读取 positions/uvs/indices computed 以建立跨依赖
        const indices = indicesComputed.value;
        const positions = Array.from(positionsComputed.value);
        const uvs = Array.from(uvsComputed.value);

        return new Float32Array(geometryUtils.createVertexTangents(indices, positions, uvs, true));
    }

    // 每个属性独立 computed，仅在实际被读取时计算
    const positionsComputed = computed(() => buildPositions());
    const uvsComputed = computed(() => buildUVs());
    const indicesComputed = computed(() => buildIndices());
    // normals/tangents 依赖 positions/uvs/indices computed，跨 computed 依赖
    const normals = computed(() => buildNormals());
    const tangents = computed(() => buildTangents());

    const logic = setupGeometryLogicState(Object.create(quadGeometryLogicProto) as QuadGeometryLogic & QuadGeometryLogicState, data);
    // attributes: data 由 computed getter 驱动
    logic._attrTable = {
        a_position: computedAttr(positionsComputed, 'float32x3'),
        a_color: { data: new Float32Array(), format: 'float32x4' },
        a_uv: computedAttr(uvsComputed, 'float32x2'),
        a_normal: computedAttr(normals, 'float32x3'),
        a_tangent: computedAttr(tangents, 'float32x3'),
    };
    logic._indicesComputed = indicesComputed;

    return logic;
}
registerLogic('QuadGeometry', quadGeometryLogic);
