import { Geometry, geometryLogic, GeometryLogic, DrawRange } from './Geometry';
import { registerLogic, reactive, computed, Computed, UnReadonly, toRaw } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';

// 触发 geometryLogic 注册
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
 * {@link customGeometryLogic} 用 computed 桥接这些字段到顶点属性，字段变化时 computed 自动失效。
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
    /** 索引数据 */
    readonly indices?: ReadonlyArray<number>;
}

/**
 * 创建 CustomGeometryLogic 实例（函数式实现）。
 *
 * 组合 {@link geometryLogic} 获得全部通用顶点/索引/包围盒行为。每个顶点属性用 computed
 * 读取数据接口字段（positions/normals/uvs/colors/tangents/indices），变化时自动失效重算。
 * 外部通过 `reactive(vertexDataGeometry).positions = [...]` 写入数据。
 */
export function customGeometryLogic(geometry: CustomGeometry): GeometryLogic
{
    // 组合基座
    const base = geometryLogic(geometry);

    // 默认值（缺失字段单独赋值）
    const writable = geometry as UnReadonly<CustomGeometry>;
    if (geometry.name === undefined) writable.name = '';
    if (geometry.scaleU === undefined) writable.scaleU = 1;
    if (geometry.scaleV === undefined) writable.scaleV = 1;

    // 每个顶点属性用 computed 读取数据接口字段，桥接到 attributes.data
    const _positions = computed(() => toFloat32(reactive(geometry).positions));
    const _normals = computed(() => toFloat32(reactive(geometry).normals));
    const _uvs = computed(() => toFloat32(reactive(geometry).uvs));
    const _colors = computed(() => toFloat32(reactive(geometry).colors));
    const _tangents = computed(() => toFloat32(reactive(geometry).tangents));
    // indices 是整数索引数组，保持 number[]（不用 Float32Array，避免精度问题）
    const _indices = computed(() => toNumberArray(reactive(geometry).indices));

    const _attrTable = createAttributes();
    Object.defineProperty(base, 'vertices', { get() { return _attrTable; }, enumerable: true, configurable: true });

    // indices 由 computed 驱动（覆盖基类 getter）
    Object.defineProperty(base, 'vertexIndices', { get() { return _indices.value; }, enumerable: true, configurable: true });

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
            a_color: computedAttr(_colors, 'float32x4'),
            a_uv: computedAttr(_uvs, 'float32x2'),
            a_normal: computedAttr(_normals, 'float32x3'),
            a_tangent: computedAttr(_tangents, 'float32x3'),
            a_skinIndices: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights: { data: new Float32Array(), format: 'float32x4' },
            a_skinIndices1: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights1: { data: new Float32Array(), format: 'float32x4' },
        };
    }

    /**
     * 把 readonly number[] 转为 Float32Array（undefined → 空）。
     *
     * 注意：`reactive(geometry).positions` 返回的是 Proxy 代理数组，
     * **不能直接传给 `new Float32Array(proxyArray)`**（运行时报 "this is not a typed array"）。
     * 这里用 `toRaw()` 先还原为原始数组，再交给 Float32Array 构造器。
     * 凡是把响应式代理的数组喂给 TypedArray / WebGPU 原生 API 的边界，都要做同样处理。
     */
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

    return base;
}

registerLogic('CustomGeometry', customGeometryLogic);
