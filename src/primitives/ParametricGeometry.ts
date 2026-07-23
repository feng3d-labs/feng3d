import { Vector3 } from '@feng3d/math';
import { Geometry, geometryLogic, GeometryLogic, registerCloneFactory } from '../geometry/Geometry';
import { registerLogic, reactive, computed, Computed } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';
import { geometryUtils } from '../geometry/GeometryUtils';

/**
 * 参数化曲面几何体的运行时隐藏字段（__func/__slices/__stacks/__doubleside）。
 *
 * 这些字段由 createParametricGeometry 工厂写入，无法序列化但运行时需要。
 */
type ParametricGeometryRuntime = ParametricGeometry & {
    __func: (u: number, v: number) => Vector3;
    __slices: number;
    __stacks: number;
    __doubleside: boolean;
};

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        ParametricGeometry: ParametricGeometry;
    }
}

/**
 * 参数化曲面几何体（纯数据接口）。
 *
 * 通过构造参数 func/slices/stacks/doubleside 定义，geometryLogic 在 computed 计算时
 * 调用 func 生成顶点。func/slices/stacks/doubleside 由 createParametricGeometry 工厂
 * 写入到 `__func/__slices/__stacks/__doubleside` 隐藏字段（无法序列化但运行时需要）。
 */
export interface ParametricGeometry extends Geometry
{
    readonly __type__: 'ParametricGeometry';
    /** 切片数（运行时通过 __slices 读取） */
    readonly slices: number;
    /** 堆叠数（运行时通过 __stacks 读取） */
    readonly stacks: number;
    /** 是否双面（运行时通过 __doubleside 读取） */
    readonly doubleside: boolean;
}

/**
 * 创建 ParametricGeometry 实例。
 *
 * @param func 参数化函数 (u, v) → Vector3
 * @param slices 切片数
 * @param stacks 堆叠数
 * @param doubleside 是否双面
 */
export function createParametricGeometry(func: (u: number, v: number) => Vector3, slices = 8, stacks = 8, doubleside = false): ParametricGeometry
{
    const g = {
        __type__: 'ParametricGeometry',
        name: '',
        scaleU: 1,
        scaleV: 1,
        slices,
        stacks,
        doubleside,
        __func: func,
        __slices: slices,
        __stacks: stacks,
        __doubleside: doubleside,
    } as unknown as ParametricGeometryRuntime;

    return g;
}

/**
 * 按现有数据克隆一份 ParametricGeometry（用于 clone）。
 */
export function createParametricGeometryWithData(src: ParametricGeometry): ParametricGeometry
{
    const runtimeSrc = src as unknown as ParametricGeometryRuntime;

    return createParametricGeometry(runtimeSrc.__func, runtimeSrc.__slices, runtimeSrc.__stacks, runtimeSrc.__doubleside);
}

/**
 * 创建 ParametricGeometryLogic 实例（函数式实现）。
 *
 * 组合 {@link geometryLogic}，每个顶点属性用 computed 独立懒计算，
 * 依赖 __func/__slices/__stacks/__doubleside。
 * 不使用 buildGeometry — 参数变化时 computed 自动失效重算。
 */
export function parametricGeometryLogic(geometry: ParametricGeometry): GeometryLogic
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

    // ---- 顶点构建（直接返回 Float32Array/number[]，内部 reactive 建立依赖） ----

    function buildPositions(): Float32Array
    {
        const g = reactive(geometry as unknown as ParametricGeometryRuntime);
        const func = g.__func;
        const slices = g.__slices;
        const stacks = g.__stacks;
        const doubleside = g.__doubleside;
        if (!func || slices == null || stacks == null) return new Float32Array(0);

        let positions: number[] = [];
        const sliceCount = slices + 1;
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
        const g = reactive(geometry as unknown as ParametricGeometryRuntime);
        const func = g.__func;
        const slices = g.__slices;
        const stacks = g.__stacks;
        const doubleside = g.__doubleside;
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
        const g = reactive(geometry as unknown as ParametricGeometryRuntime);
        const func = g.__func;
        const slices = g.__slices;
        const stacks = g.__stacks;
        const doubleside = g.__doubleside;
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
        const indices = _indicesComputed.value;
        const positions = Array.from(_positions.value);
        if (indices.length === 0 || positions.length === 0) return new Float32Array(0);

        return new Float32Array(geometryUtils.createVertexNormals(indices, positions, true));
    }

    function buildTangents(): Float32Array
    {
        // 读取 positions/uvs/indices computed 以建立跨依赖
        const indices = _indicesComputed.value;
        const positions = Array.from(_positions.value);
        const uvs = Array.from(_uvs.value);
        if (indices.length === 0 || positions.length === 0) return new Float32Array(0);

        return new Float32Array(geometryUtils.createVertexTangents(indices, positions, uvs, true));
    }

    return base;
}

registerLogic('ParametricGeometry', parametricGeometryLogic);
registerCloneFactory('ParametricGeometry', (src: ParametricGeometry) => createParametricGeometryWithData(src));
