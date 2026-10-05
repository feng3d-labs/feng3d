import { Vector3 } from '@feng3d/math';
import { Geometry, GeometryLogic, geometryUtils, computedAttr, createGeometryLogicState, geometryBeforeRender, geometryBounding, geometryRaycast } from 'feng3d';
import { registerLogic, reactive, computed } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        ParametricGeometry: ParametricGeometryLogic;
    }
}

declare module 'feng3d'
{
    export interface GeometryMap
    {
        ParametricGeometry: ParametricGeometry;
    }
}

/**
 * 参数化曲面几何体（纯数据接口）。
 *
 * 通过构造参数 `func/slices/stacks/doubleside` 定义，logic 在 computed 计算时
 * 调用 func 生成顶点。func/slices/stacks/doubleside 为运行时字段（func 无法序列化），
 * 其余字段可序列化。
 *
 * 移植自 three.js examples/jsm/geometries/ParametricGeometry.js。
 * 与 three.js 差异：feng3d 的 func 签名是 `(u, v) => Vector3`（返回新向量），
 * three.js 是 `(u, v, target) => void`（写入 target）。
 */
export interface ParametricGeometry extends Geometry
{
    readonly __type__: 'ParametricGeometry';
    /**
     * 参数曲面函数：在 (u, v) ∈ [0,1]×[0,1] 上返回世界坐标。
     *
     * 注意：函数字段无法序列化，序列化场景时需通过其他方式重建。
     */
    readonly func: (u: number, v: number) => Vector3;
    /** u 方向切片数（顶点列数 = slices + 1） */
    readonly slices: number;
    /** v 方向堆叠数（顶点行数 = stacks + 1） */
    readonly stacks: number;
    /** 是否生成反面（double side）：true 时追加反向顶点与索引 */
    readonly doubleside: boolean;
}

/**
 * ParametricGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic}，每个顶点属性用 computed 独立懒计算，
 * 依赖 func/slices/stacks/doubleside。
 */
export interface ParametricGeometryLogic extends GeometryLogic
{
}

/**
 * 工厂函数：ParametricGeometryLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 几何数据（raw）
 */
export function parametricGeometryLogic(data: ParametricGeometry): ParametricGeometryLogic
{
    // ---- 顶点构建（直接返回 Float32Array/number[]，内部 reactive 建立依赖） ----

    function buildPositions(): Float32Array
    {
        const r_g = reactive(data);
        const func = r_g.func;
        const slices = r_g.slices;
        const stacks = r_g.stacks;
        const doubleside = r_g.doubleside;
        if (!func || slices == null || stacks == null) return new Float32Array(0);

        let positions: number[] = [];
        for (let i = 0; i <= stacks; i++)
        {
            const v = i / stacks;
            for (let j = 0; j <= slices; j++)
            {
                const u = j / slices;
                const p = func(u, v);
                positions.push(p.x, p.y, p.z);
            }
        }
        if (doubleside)
        {
            positions = positions.concat(positions);
        }

        return new Float32Array(positions);
    }

    function buildUVs(): Float32Array
    {
        const r_g = reactive(data);
        const func = r_g.func;
        const slices = r_g.slices;
        const stacks = r_g.stacks;
        const doubleside = r_g.doubleside;
        if (!func || slices == null || stacks == null) return new Float32Array(0);

        let uvs: number[] = [];
        for (let i = 0; i <= stacks; i++)
        {
            const v = i / stacks;
            for (let j = 0; j <= slices; j++)
            {
                const u = j / slices;
                uvs.push(u, v);
            }
        }
        if (doubleside)
        {
            uvs = uvs.concat(uvs);
        }

        return new Float32Array(uvs);
    }

    function buildIndices(): number[]
    {
        const r_g = reactive(data);
        const func = r_g.func;
        const slices = r_g.slices;
        const stacks = r_g.stacks;
        const doubleside = r_g.doubleside;
        if (!func || slices == null || stacks == null) return [];

        const indices: number[] = [];
        const sliceCount = slices + 1;
        for (let i = 0; i <= stacks; i++)
        {
            for (let j = 0; j <= slices; j++)
            {
                if (i < stacks && j < slices)
                {
                    const a = i * sliceCount + j;
                    const b = i * sliceCount + j + 1;
                    const c = (i + 1) * sliceCount + j + 1;
                    const d = (i + 1) * sliceCount + j;
                    indices.push(a, b, d);
                    indices.push(b, c, d);
                }
            }
        }
        if (doubleside)
        {
            const start = (stacks + 1) * (slices + 1);
            for (let i = 0, n = indices.length; i < n; i += 3)
            {
                indices.push(start + indices[i], start + indices[i + 2], start + indices[i + 1]);
            }
        }

        return indices;
    }

    function buildNormals(): Float32Array
    {
        // 读取 positions/indices computed 以建立跨依赖
        const indices = indicesComputed.value;
        const positions = Array.from(positionsComputed.value);
        if (indices.length === 0 || positions.length === 0) return new Float32Array(0);

        return new Float32Array(geometryUtils.createVertexNormals(indices, positions, true));
    }

    function buildTangents(): Float32Array
    {
        // 读取 positions/uvs/indices computed 以建立跨依赖
        const indices = indicesComputed.value;
        const positions = Array.from(positionsComputed.value);
        const uvs = Array.from(uvsComputed.value);
        if (indices.length === 0 || positions.length === 0) return new Float32Array(0);

        return new Float32Array(geometryUtils.createVertexTangents(indices, positions, uvs, true));
    }

    // 每个属性独立 computed，仅在实际被读取时计算
    const positionsComputed = computed(() => buildPositions());
    const uvsComputed = computed(() => buildUVs());
    const indicesComputed = computed(() => buildIndices());
    // normals/tangents 依赖 positions/uvs/indices computed，跨 computed 依赖
    const normalsComputed = computed(() => buildNormals());
    const tangentsComputed = computed(() => buildTangents());

    // attributes: data 由 computed getter 驱动
    const attrTable: VertexAttributes = {
        a_position: computedAttr(positionsComputed, 'float32x3'),
        a_color: { data: new Float32Array(), format: 'float32x4' },
        a_uv: computedAttr(uvsComputed, 'float32x2'),
        a_normal: computedAttr(normalsComputed, 'float32x3'),
        a_tangent: computedAttr(tangentsComputed, 'float32x3'),
    };
    const state = createGeometryLogicState(() => attrTable, () => indicesComputed.value, data);

    const logic: ParametricGeometryLogic = {
        get vertices() { return attrTable; },
        get vertexIndices() { return indicesComputed.value; },
        get indices() { return state.indices.value; },
        get draw() { return state.draw.value; },
        get bounding() { return geometryBounding(logic); },
        raycast(ray, shortestCollisionDistance, cullFace) { return geometryRaycast(logic, ray, shortestCollisionDistance, cullFace); },
        beforeRender(renderObject) { geometryBeforeRender(logic, renderObject); },
    };

    return logic;
}
registerLogic('ParametricGeometry', parametricGeometryLogic);
