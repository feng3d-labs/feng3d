import { Box3, Ray3 } from '@feng3d/math';
import { reactive, registerLogic, computed, Computed } from '@feng3d/reactivity';
import { IDraw, IndicesDataTypes, RenderObject, VertexAttribute, VertexAttributes } from '@feng3d/webgpu';
import { CullFace } from '../render/data/enums';
import { geometryUtils } from './GeometryUtils';

/**
 * 绘制范围（对应 three.js BufferGeometry.setDrawRange）。
 *
 * - 索引绘制时：`firstIndex`/`indexCount` 生效（对应 setDrawRange(start, count)）
 * - 无索引绘制时：`firstVertex`/`vertexCount` 生效
 * - 缺省字段表示不覆盖（保持全长）
 */
export interface DrawRange
{
    /** 起始顶点（无索引绘制时生效） */
    firstVertex?: number;
    /** 顶点数（无索引绘制时生效） */
    vertexCount?: number;
    /** 起始索引（索引绘制时生效） */
    firstIndex?: number;
    /** 索引数（索引绘制时生效） */
    indexCount?: number;
}

/**
 * 几何体（纯数据接口）。
 *
 * 基接口只保留通用字段（名称/纹理缩放）与可选的顶点数据（供 CustomGeometry/TerrainGeometry
 * 等外部填充）。具体子接口（CubeGeometry/PlaneGeometry 等）继承本接口并声明自身的
 * `readonly __type__: '<字面量>'` 与构造参数字段，通过 `declare module './Geometry'`
 * 注册到 {@link GeometryMap} 以纳入 {@link Geometrys} 联合类型。
 *
 * 基接口不声明 `__type__`：不应直接构造 `Geometry` 实例，只用其具体子接口。
 * 仅保留通用字段（名称/纹理缩放/绘制范围）。顶点数据字段（positions/normals 等）
 * 见 {@link CustomGeometry}，由外部填充型几何体（CustomGeometry/TerrainGeometry）继承。
 */
export interface Geometry
{
    /** 名称（缺失时由子工厂自动填充默认值） */
    readonly name?: string;
    /** 纹理U缩放，默认为1（缺失时由子工厂自动填充） */
    readonly scaleU?: number;
    /** 纹理V缩放，默认为1（缺失时由子工厂自动填充） */
    readonly scaleV?: number;
}

/**
 * Geometry 类型注册表，由各子类通过 `declare module './Geometry'` 扩展。
 */
export interface GeometryMap { }

/**
 * 所有 Geometry 具体子类型的联合类型。
 *
 * 用于 Renderable.geometry 等字段，使 TS 可按 `__type__` 识别具体子类型。
 * 不含基类 Geometry（基接口无 `__type__`，不应直接构造）。
 */
export type Geometrys = GeometryMap[keyof GeometryMap];

/**
 * 任意 Geometry 类型别名（向后兼容）。
 */
export type GeometryLike = Geometry;

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        Geometry: GeometryLogic;
    }
}

declare module '@feng3d/webgpu'
{
    interface VertexAttributes
    {
        a_position?: { readonly data: Float32Array; readonly format: 'float32x3'; readonly offset?: number; readonly arrayStride?: number; readonly stepMode?: 'vertex' };
        a_normal?: { readonly data: Float32Array; readonly format: 'float32x3'; readonly offset?: number; readonly arrayStride?: number; readonly stepMode?: 'vertex' };
        a_uv?: { readonly data: Float32Array; readonly format: 'float32x2'; readonly offset?: number; readonly arrayStride?: number; readonly stepMode?: 'vertex' };
        a_color?: { readonly data: Float32Array; readonly format: 'float32x4'; readonly offset?: number; readonly arrayStride?: number; readonly stepMode?: 'vertex' };
        a_tangent?: { readonly data: Float32Array; readonly format: 'float32x3'; readonly offset?: number; readonly arrayStride?: number; readonly stepMode?: 'vertex' };
    }
}

/**
 * GeometryLogic 逻辑类（所有几何体 logic 的基类）。
 *
 * 顶点数据（vertices / indices / draw / bounding）全部由本 logic 维护；Geometry 接口只保留构造参数。
 *
 * 行为：bounding / raycast。
 *
 * 子类（CubeGeometryLogic 等）继承本类，覆写 vertices / vertexIndices getter
 *（computed 驱动的属性表与索引）；indices / draw 由基类 computed 从
 * vertexIndices + drawRange 派生。顶点数据不对外暴露 getter，渲染数据只经
 * beforeRender 写入 renderObject。
 */
export class GeometryLogic
{
    /** 纯数据引用（子类读取自身具体数据字段用） */
    protected readonly _data: Geometry;

    /**
     * indices（TypedArray）：computed 从子类的 vertexIndices（number[]）转换。
     * 顶点数 > 65535 时用 Uint32，否则 Uint16。子类覆写 vertexIndices getter
     * 返回 computed 驱动的 number[]。
     */
    readonly #_indices = computed<IndicesDataTypes>(() =>
    {
        const raw = this.vertexIndices;
        if (!raw || raw.length === 0) return new Uint16Array();
        const maxIndex = raw.reduce((m, v) => v > m ? v : m, 0);

        return maxIndex > 65535 ? new Uint32Array(raw) : new Uint16Array(raw);
    });

    /**
     * draw：computed 从 indices + drawRange 派生。
     * drawRange 从响应式数据接口字段 reactive(geometry).drawRange 读取，变化时自动失效。
     */
    readonly #_draw = computed<IDraw>(() =>
    {
        const raw = this.vertexIndices;
        const range = (reactive(this._data) as unknown as { drawRange?: DrawRange | null }).drawRange ?? null;
        if (raw && raw.length > 0)
        {
            const indexCount = range?.indexCount ?? raw.length;
            const firstIndex = range?.firstIndex ?? 0;

            return {
                __type__: 'DrawIndexed',
                indexCount,
                firstIndex,
                instanceCount: 1,
            };
        }
        // 无索引，按顶点绘制
        const firstAttr = Object.values(this.vertices)[0];
        const fullVertexCount = firstAttr ? VertexAttribute.getVertexCount(firstAttr) : 0;
        const vertexCount = range?.vertexCount ?? fullVertexCount;
        const firstVertex = range?.firstVertex ?? 0;

        return {
            __type__: 'DrawVertex',
            vertexCount,
            firstVertex,
            instanceCount: 1,
        };
    });

    protected constructor(geometry: Geometry)
    {
        this._data = geometry;
    }

    /** 内部创建入口（protected constructor 的唯一出口，供子类使用） */
    static create(geometry: Geometry): GeometryLogic
    {
        return new GeometryLogic(geometry);
    }

    /** 顶点属性表（基类返回空表，子类覆写返回 computed 驱动的属性表） */
    get vertices(): VertexAttributes
    {
        return {};
    }

    /** 子类辅助：构建 data 由 computed 驱动的顶点属性（computed 惰性求值，读取 data 时建立依赖） */
    protected computedAttr<F extends 'float32x2' | 'float32x3' | 'float32x4'>(ref: Computed<Float32Array>, format: F): { readonly data: Float32Array; readonly format: F }
    {
        const obj = { data: new Float32Array(), format };
        Object.defineProperty(obj, 'data', { get() { return ref.value; }, enumerable: true });

        return obj;
    }

    /** 顶点索引（基类返回空数组，子类覆写为 computed 驱动） */
    get vertexIndices(): number[]
    {
        return [];
    }

    /** indices（TypedArray，从 vertexIndices 转换） */
    get indices(): IndicesDataTypes
    {
        return this.#_indices.value;
    }

    /** 绘制指令（从 indices + drawRange 派生） */
    get draw(): IDraw
    {
        return this.#_draw.value;
    }

    /** 包围盒（顶点数据变化时自动重算） */
    get bounding(): Box3
    {
        const positions = this.vertices.a_position?.data as unknown as number[] | undefined;
        if (!positions || positions.length === 0)
        {
            return new Box3();
        }

        return Box3.formPositions(positions);
    }

    /** 射线投影（读子类覆写的 vertices getter） */
    raycast(ray: Ray3, shortestCollisionDistance = Number.MAX_VALUE, cullFace = CullFace.NONE): ReturnType<GeometryUtils['raycast']>
    {
        const attr = this.vertices;

        return geometryUtils.raycast(
            ray,
            this.vertexIndices,
            attr.a_position?.data as unknown as number[] ?? [],
            attr.a_uv?.data as unknown as number[] ?? [],
            shortestCollisionDistance,
            cullFace);
    }

    /**
     * 渲染前写入渲染数据（vertices / indices / draw 到 renderObject）。
     *
     * 与 Object3DLogic/MaterialLogic.beforeRender 同模式：在 Renderable 的
     * renderObject computed 内调用，内部经响应式读取（顶点属性表 computed、
     * indices/draw computed）建立依赖，几何数据变化自动失效重跑。
     * 顶点数据不对外暴露 getter，渲染数据只经本方法流向 renderObject。
     */
    beforeRender(renderObject: RenderObject): void
    {
        const ro = renderObject as { vertices?: VertexAttributes; indices?: IndicesDataTypes; draw?: IDraw };
        ro.vertices = this.vertices;
        ro.indices = this.indices;
        ro.draw = this.draw;
    }
}

/**
 * 组合函数：创建 GeometryLogic 实例（子类工厂的组合入口）。
 *
 * 保留泛型签名：registerLogic 的 data 类型为 `{ __type__: K }`（与 Geometry 弱类型
 * 不相交），泛型函数可经由实例化通过类型检查。
 */
export function geometryLogic<T extends Geometrys>(geometry: T): GeometryLogic
{
    return GeometryLogic.create(geometry);
}

// GeometryUtils 的可射线投影方法类型别名（避免 any）
type GeometryUtils = typeof geometryUtils;

// ---- 注册基类 ----

registerLogic('Geometry', geometryLogic);
