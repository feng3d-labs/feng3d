import { Geometry, geometryLogic, GeometryLogic, registerDefaultGeometryFactory } from '../geometry/Geometry';
import { registerLogic, computed, Computed } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';
import { geometryUtils } from '../geometry/GeometryUtils';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        QuadGeometry: GeometryLogic;
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
 * 创建 QuadGeometryLogic 实例（函数式实现）。
 *
 * 组合 {@link geometryLogic}。positions/uvs/indices 为常量（非响应式），
 * 但 normals/tangents 依赖 positions/indices，仍以 computed 表达以便在 positions
 * 被替换时联动重算。所有属性独立懒计算。
 */
export function quadGeometryLogic(geometry: QuadGeometry): GeometryLogic
{
    // 组合基座
    const base = geometryLogic(geometry);

    // 每个属性独立 computed，仅在实际被读取时计算
    const _positions = computed(() => buildPositions());
    const _uvs = computed(() => buildUVs());
    const _indicesComputed = computed(() => buildIndices());
    // normals/tangents 依赖 positions/uvs/indices computed，跨 computed 依赖
    const _normals = computed(() => buildNormals());
    const _tangents = computed(() => buildTangents());

    // attributes: data 由 computed getter 驱动
    const _attrTable = createAttributes();
    Object.defineProperty(base, 'vertices', { get() { return _attrTable; }, enumerable: true, configurable: true });

    // indices 由 computed 驱动（覆盖基类 getter）
    Object.defineProperty(base, 'vertexIndices', { get() { return _indicesComputed.value; }, enumerable: true, configurable: true });

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
            a_color: { data: new Float32Array(), format: 'float32x4' },
            a_uv: computedAttr(_uvs, 'float32x2'),
            a_normal: computedAttr(_normals, 'float32x3'),
            a_tangent: computedAttr(_tangents, 'float32x3'),
            a_skinIndices: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights: { data: new Float32Array(), format: 'float32x4' },
            a_skinIndices1: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights1: { data: new Float32Array(), format: 'float32x4' },
        };
    }

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
        const indices = _indicesComputed.value;
        const positions = Array.from(_positions.value);

        return new Float32Array(geometryUtils.createVertexNormals(indices, positions, true));
    }

    function buildTangents(): Float32Array
    {
        // 读取 positions/uvs/indices computed 以建立跨依赖
        const indices = _indicesComputed.value;
        const positions = Array.from(_positions.value);
        const uvs = Array.from(_uvs.value);

        return new Float32Array(geometryUtils.createVertexTangents(indices, positions, uvs, true));
    }

    return base;
}

registerLogic('QuadGeometry', quadGeometryLogic);
registerDefaultGeometryFactory('Quad', () => ({ __type__: 'QuadGeometry' } as QuadGeometry));
