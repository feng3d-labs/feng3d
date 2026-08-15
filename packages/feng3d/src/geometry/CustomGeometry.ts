import { Geometry, GeometryLogic, DrawRange } from './Geometry';
import { registerLogic, reactive, computed, toRaw } from '@feng3d/reactivity';
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
export class CustomGeometryLogic extends GeometryLogic
{
    // 每个顶点属性用 computed 读取数据接口字段，桥接到 attributes.data
    readonly #_positions = computed(() => CustomGeometryLogic.toFloat32(reactive(this._data as CustomGeometry).positions));
    readonly #_normals = computed(() => CustomGeometryLogic.toFloat32(reactive(this._data as CustomGeometry).normals));
    readonly #_uvs = computed(() => CustomGeometryLogic.toFloat32(reactive(this._data as CustomGeometry).uvs));
    readonly #_colors = computed(() => CustomGeometryLogic.toFloat32(reactive(this._data as CustomGeometry).colors));
    readonly #_tangents = computed(() => CustomGeometryLogic.toFloat32(reactive(this._data as CustomGeometry).tangents));
    // indices 是整数索引数组，保持 number[]（不用 Float32Array，避免精度问题）
    readonly #_indices = computed(() => CustomGeometryLogic.toNumberArray(reactive(this._data as CustomGeometry).indices));

    readonly #_attrTable: VertexAttributes = {
        a_position: this.computedAttr(this.#_positions, 'float32x3'),
        a_color: this.computedAttr(this.#_colors, 'float32x4'),
        a_uv: this.computedAttr(this.#_uvs, 'float32x2'),
        a_normal: this.computedAttr(this.#_normals, 'float32x3'),
        a_tangent: this.computedAttr(this.#_tangents, 'float32x3'),
    };

    /** 把 readonly number[] 转为 Float32Array（undefined → 空）。reactive 代理数组须先 toRaw 还原再喂 TypedArray */
    static toFloat32(v: ReadonlyArray<number> | undefined): Float32Array
    {
        if (!v) return new Float32Array();
        const raw = toRaw(v as unknown as object) as number[];

        return new Float32Array(raw);
    }

    /** 把 readonly number[] 转为 number[]（undefined → 空数组） */
    static toNumberArray(v: ReadonlyArray<number> | undefined): number[]
    {
        return v ? Array.from(v) : [];
    }

    protected constructor(data: CustomGeometry)
    {
        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: CustomGeometry): CustomGeometryLogic
    {
        return new CustomGeometryLogic(data);
    }

    override get vertices(): VertexAttributes
    {
        return this.#_attrTable;
    }

    /** indices 由 computed 驱动（覆写基类 getter） */
    override get vertexIndices(): number[]
    {
        return this.#_indices.value;
    }
}

registerLogic('CustomGeometry', CustomGeometryLogic as unknown as new (data: CustomGeometry) => CustomGeometryLogic);
