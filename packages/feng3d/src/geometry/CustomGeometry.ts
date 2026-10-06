import { computedAttr, createGeometryLogicState, DrawRange, Geometry, geometryBeforeRender, geometryBounding, geometryRaycast, GeometryLogic } from './Geometry';
import { computed, reactive, registerLogic, toRaw, type Computed } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

// 触发 GeometryLogic 注册
import './Geometry';

declare module './Geometry'
{
    export interface GeometryMap
    {
        CustomGeometry: CustomGeometry;
    }
}

/**
 * 顶点数据几何体（纯数据接口）。
 *
 * 直接承载顶点数据字段（positions/normals/uvs/colors/tangents/indices），不含构造参数。
 * 顶点数据由外部通过响应式数据接口字段写入：
 * `reactive(vertexDataGeometry).positions = [...]` / `.normals` / `.uvs` / `.colors` / `.tangents` / `.indices`。
 * {@link CustomGeometryLogic} 用 computed 桥接这些字段到顶点属性，字段变化时 computed 自动失效。
 *
 * 需要自定义构造参数的几何体可继承本接口并声明自身 `__type__` 与参数字段（如 TerrainGeometry）。
 */
export interface CustomGeometry extends Geometry
{
    readonly __type__: 'CustomGeometry';
    /**
     * 绘制范围（drawRange），覆盖自动计算的 draw。
     *
     * - 索引绘制（DrawIndexed）：`indexCount` / `firstIndex` 生效
     * - 无索引绘制（DrawVertex）：`vertexCount` / `firstVertex` 生效
     * - null/undefined 时按顶点/索引全长绘制
     */
    readonly drawRange?: DrawRange | null;
    /** 坐标数据 */
    readonly positions?: ReadonlyArray<number>;
    /** 法线数据 */
    readonly normals?: ReadonlyArray<number>;
    /** uv 数据 */
    readonly uvs?: ReadonlyArray<number>;
    /** 颜色数据 */
    readonly colors?: ReadonlyArray<number>;
    /** 切线数据 */
    readonly tangents?: ReadonlyArray<number>;
    /** 骨骼索引（每顶点 4 个，来自 glTF `JOINTS_0`；issue #337） */
    readonly a_skinIndices?: ReadonlyArray<number>;
    /** 骨骼权重（每顶点 4 个，来自 glTF `WEIGHTS_0`） */
    readonly a_skinWeights?: ReadonlyArray<number>;
    /** 骨骼索引第二组（来自 glTF `JOINTS_1`；每顶点最多 8 根骨骼） */
    readonly a_skinIndices1?: ReadonlyArray<number>;
    /** 骨骼权重第二组（来自 glTF `WEIGHTS_1`） */
    readonly a_skinWeights1?: ReadonlyArray<number>;
    /**
     * morph target（形变目标）的顶点位置 delta，按 target 顺序（来自 glTF `primitives[].targets`）。
     *
     * 每项是扁平数组（每顶点 3 分量，与 `positions` 的顶点数一致）。
     * 形变量**不走顶点属性**：target 数可达十几个、会超出顶点 location 上限，数据量也远超 uniform 的
     * 64KB（实测 Horse 的 796 顶点 × 15 target 需要约 186KB）——渲染层应把它落成 storage buffer，
     * 顶点着色器按 `targetIndex * vertexCount + vertexIndex` 索引。
     */
    readonly morphTargets?: readonly (readonly number[])[];
    /** 索引数据 */
    readonly indices?: ReadonlyArray<number>;
}

/**
 * CustomGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic} 获得全部通用顶点/索引/包围盒行为。每个顶点属性用 computed
 * 读取数据接口字段（positions/normals/uvs/colors/tangents/indices），变化时自动失效重算。
 * 外部通过 `reactive(vertexDataGeometry).positions = [...]` 写入数据。
 */
export interface CustomGeometryLogic extends GeometryLogic
{
}

/** 把 readonly number[] 转为 Float32Array（undefined → 空）。reactive 代理数组须先 toRaw 还原再喂 TypedArray */
function toFloat32(v: ReadonlyArray<number> | undefined): Float32Array
{
    if (!v) return new Float32Array();
    const raw = toRaw(v as unknown as object) as number[];

    return new Float32Array(raw);
}

/** 把 readonly number[] 转为 number[]（undefined → 空数组） */
function toNumberArray(v: ReadonlyArray<number> | undefined): number[]
{
    return v ? Array.from(v) : [];
}

/** 交错顶点缓冲中单个顶点的字节数：4 个 vec4<f32>（indices0 / weights0 / indices1 / weights1） */
const SKIN_INTERLEAVED_STRIDE = 64;

/**
 * 把四个蒙皮属性交错进同一个顶点缓冲（issue #337 第二批）。
 *
 * 顶点缓冲按"属性数据对象"（同一个 TypedArray 引用）分组：4 个属性各自独立时是 4 个缓冲，
 * 标准材质原有 5 个属性 + 4 = 9 > WebGPU 默认 `maxVertexBuffers` 8，创建管线直接失败。
 * 交错后 4 个属性共享同一 data，归并为 1 个缓冲（5 + 1 = 6 ≤ 8）。
 *
 * 每顶点 16 个 float（4 个 vec4<f32>），顺序 `[indices0 | weights0 | indices1 | weights1]`，
 * 与着色器里 location 5–8 的 offset 0/16/32/48 一一对应。
 *
 * 顶点数取各分组与位置顶点数的最大值：某组缺失时该组填 0，保证每个顶点的 4 段都能被完整读到，
 * 不会读到相邻顶点的数据。权重为 0 的骨骼对 `skinPosition` 无贡献（与 GLSL 旧源一致）。
 *
 * @param indices0 第一组骨骼索引（每顶点 4 个分量）
 * @param weights0 第一组骨骼权重
 * @param indices1 第二组骨骼索引
 * @param weights1 第二组骨骼权重
 * @param fallbackVertexCount 位置属性给出的顶点数（某组完全缺失时用它撑起交错缓冲长度）
 */
export function interleaveSkinAttributes(
    indices0: Float32Array, weights0: Float32Array,
    indices1: Float32Array, weights1: Float32Array,
    fallbackVertexCount: number,
): Float32Array
{
    const vertexCount = Math.max(
        Math.ceil(indices0.length / 4), Math.ceil(weights0.length / 4),
        Math.ceil(indices1.length / 4), Math.ceil(weights1.length / 4),
        fallbackVertexCount,
    );
    const out = new Float32Array(vertexCount * 16);

    for (let v = 0; v < vertexCount; v++)
    {
        const base = v * 16;
        for (let i = 0; i < 4; i++)
        {
            out[base + i] = indices0[v * 4 + i] ?? 0;
            out[base + 4 + i] = weights0[v * 4 + i] ?? 0;
            out[base + 8 + i] = indices1[v * 4 + i] ?? 0;
            out[base + 12 + i] = weights1[v * 4 + i] ?? 0;
        }
    }

    return out;
}

/**
 * 构建共享交错顶点缓冲的蒙皮属性（data 由 computed 驱动，offset/arrayStride 描述其在缓冲中的位置）。
 *
 * 与 {@link GeometryLogic} 的 `computedAttr` 同构，额外携带交错布局信息——WebGPU 顶点布局按
 * `arrayStride` 步进、按 `offset` 取值，共享同一 data 的属性不会再各占一个缓冲。
 */
function skinnedAttr(ref: Computed<Float32Array>, offset: number, arrayStride: number)
{
    const obj = { data: new Float32Array(), format: 'float32x4' as const, offset, arrayStride };
    Object.defineProperty(obj, 'data', { get() { return ref.value; }, enumerable: true });

    return obj;
}

/**
 * 工厂函数：CustomGeometryLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 几何数据（raw）
 */
export function customGeometryLogic(data: CustomGeometry): CustomGeometryLogic
{
    // 每个顶点属性用 computed 读取数据接口字段，桥接到 attributes.data
    const positions = computed(() => toFloat32(reactive(data).positions));
    const normals = computed(() => toFloat32(reactive(data).normals));
    const uvs = computed(() => toFloat32(reactive(data).uvs));
    const colors = computed(() => toFloat32(reactive(data).colors));
    const tangents = computed(() => toFloat32(reactive(data).tangents));
    // 蒙皮属性（issue #337）：骨骼索引以 float32x4 上传（着色器侧 i32(...) 取整），与 GLSL `attribute vec4` 一致
    const skinIndices = computed(() => toFloat32(reactive(data).a_skinIndices));
    const skinWeights = computed(() => toFloat32(reactive(data).a_skinWeights));
    const skinIndices1 = computed(() => toFloat32(reactive(data).a_skinIndices1));
    const skinWeights1 = computed(() => toFloat32(reactive(data).a_skinWeights1));
    // 4 个蒙皮属性交错进同一个顶点缓冲（issue #337 第二批）：顺序 indices0 | weights0 | indices1 | weights1
    const skinInterleaved = computed(() => interleaveSkinAttributes(
        skinIndices.value, skinWeights.value,
        skinIndices1.value, skinWeights1.value,
        Math.floor(positions.value.length / 3),
    ));
    // indices 是整数索引数组，保持 number[]（不用 Float32Array，避免精度问题）
    const indicesComputed = computed(() => toNumberArray(reactive(data).indices));

    // attributes: data 由 computed getter 驱动
    const attrTable: VertexAttributes = {
        a_position: computedAttr(positions, 'float32x3'),
        a_color: computedAttr(colors, 'float32x4'),
        a_uv: computedAttr(uvs, 'float32x2'),
        a_normal: computedAttr(normals, 'float32x3'),
        a_tangent: computedAttr(tangents, 'float32x3'),
        // 4 个蒙皮属性共享同一个交错缓冲：offset 依次为 0/16/32/48 字节，stride 为 64 字节
        a_skinIndices: skinnedAttr(skinInterleaved, 0, SKIN_INTERLEAVED_STRIDE),
        a_skinWeights: skinnedAttr(skinInterleaved, 16, SKIN_INTERLEAVED_STRIDE),
        a_skinIndices1: skinnedAttr(skinInterleaved, 32, SKIN_INTERLEAVED_STRIDE),
        a_skinWeights1: skinnedAttr(skinInterleaved, 48, SKIN_INTERLEAVED_STRIDE),
    };
    const state = createGeometryLogicState(() => attrTable, () => indicesComputed.value, data);

    const logic: CustomGeometryLogic = {
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
registerLogic('CustomGeometry', customGeometryLogic);
