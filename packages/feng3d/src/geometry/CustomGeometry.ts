import { computedAttr, DrawRange, Geometry, geometryLogicProto, setupGeometryLogicState, GeometryLogic, type GeometryLogicState } from './Geometry';
import { computed, createLogicProto, reactive, registerLogic, toRaw, type Computed } from '@feng3d/reactivity';
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

/** CustomGeometryLogic 实例的内部状态（不进公开接口，工厂装配时写入） */
interface CustomGeometryLogicState extends GeometryLogicState
{
    _attrTable: VertexAttributes;
    _indicesComputed: Computed<number[]>;
}

/** CustomGeometryLogic 的共享原型：继承 Geometry 基类实现，覆写 vertices / vertexIndices */
const customGeometryLogicProto = createLogicProto<CustomGeometryLogic>(geometryLogicProto, {
    vertices: {
        get: function (this: CustomGeometryLogic & CustomGeometryLogicState): VertexAttributes { return this._attrTable; },
    },
    /** indices 由 computed 驱动（覆写基类 getter） */
    vertexIndices: {
        get: function (this: CustomGeometryLogic & CustomGeometryLogicState): number[] { return this._indicesComputed.value; },
    },
});

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
    // indices 是整数索引数组，保持 number[]（不用 Float32Array，避免精度问题）
    const indicesComputed = computed(() => toNumberArray(reactive(data).indices));

    const logic = setupGeometryLogicState(Object.create(customGeometryLogicProto) as CustomGeometryLogic & CustomGeometryLogicState, data);
    logic._attrTable = {
        a_position: computedAttr(positions, 'float32x3'),
        a_color: computedAttr(colors, 'float32x4'),
        a_uv: computedAttr(uvs, 'float32x2'),
        a_normal: computedAttr(normals, 'float32x3'),
        a_tangent: computedAttr(tangents, 'float32x3'),
        a_skinIndices: computedAttr(skinIndices, 'float32x4'),
        a_skinWeights: computedAttr(skinWeights, 'float32x4'),
        a_skinIndices1: computedAttr(skinIndices1, 'float32x4'),
        a_skinWeights1: computedAttr(skinWeights1, 'float32x4'),
    };
    logic._indicesComputed = indicesComputed;

    return logic;
}
registerLogic('CustomGeometry', customGeometryLogic);
