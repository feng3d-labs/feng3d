import { Box3, Ray3 } from '@feng3d/math';
import { reactive, logic, registerLogic, computed } from '@feng3d/reactivity';
import { IDraw, IndicesDataTypes, VertexAttribute, VertexAttributes } from '@feng3d/webgpu';
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
    /**
     * 绘制范围（drawRange），覆盖自动计算的 draw。
     *
     * - 索引绘制（DrawIndexed）：`indexCount` / `firstIndex` 生效
     * - 无索引绘制（DrawVertex）：`vertexCount` / `firstVertex` 生效
     * - null/undefined 时按顶点/索引全长绘制
     */
    readonly drawRange?: DrawRange | null;
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

/**
 * geometryLogic 实例接口（函数式实现）。
 *
 * 顶点数据（vertices / indices / draw / bounding）全部由本 logic 维护；Geometry 接口只保留构造参数。
 *
 * 行为：bounding / raycast。
 *
 * 作为所有几何体 logic 的组合基座，被各 geometry 子类工厂（cubeGeometryLogic 等）
 * 调用以复用全部通用顶点/索引/包围盒行为。子工厂通过重写 vertices/vertexIndices getter
 *（Object.defineProperty）注入自身 computed 驱动的属性表与索引。indices/draw 由基座
 * computed 从 vertexIndices + drawRange 派生。
 */
export interface GeometryLogic
{
    /**
     * 顶点属性表（子类工厂通过重写本 getter 注入；基座默认返回空表）。
     *
     * 子工厂重写本 getter 返回 createAttributes() 创建的属性表，
     * 其中 `a_xxx.data` 可用 `Object.defineProperty` 覆盖为 computed 驱动，
     * 形成响应式链条：顶点数据变化时 computed 自动失效。
     */
    get vertices(): VertexAttributes;
    /**
     * 索引数据（Uint16/Uint32 TypedArray，基座 computed 从子工厂的 vertexIndices 转换）。
     * 顶点数 > 65535 时自动用 Uint32，否则 Uint16。
     */
    get indices(): IndicesDataTypes;
    /**
     * 绘制指令（基座 computed 从 indices + drawRange 派生）。
     * drawRange 通过响应式数据接口字段 `reactive(geometry).drawRange` 控制。
     */
    get draw(): IDraw;

    /** 包围盒（顶点数据变化时自动重算） */
    get bounding(): Box3;
    /** 射线投影 */
    raycast(ray: Ray3, shortestCollisionDistance?: number, cullFace?: CullFace): ReturnType<GeometryUtils['raycast']>;
}

/**
 * 创建 GeometryLogic 实例（函数式实现）。
 *
 * Geometry 是独立 logic（不继承 ComponentLogic），仅维护顶点/索引/包围盒/渲染数据。
 * 通过 `logic(geometry)` 获取实例。所有几何体子类工厂（cubeGeometryLogic 等）组合本工厂，
 * 在返回对象上叠加自身 computed 属性（用 Object.defineProperty 覆盖 indices getter 等）。
 *
 * 顶点数据缓存（renderDataCache）按 vertices 引用 + indices 引用判断失效：
 * beforeRender 每帧调用，命中缓存则复用，避免每帧新建 GPU 资源（泄漏）。
 *
 * @param geometry 关联的数据对象（用于响应式 drawRange 读取）
 */
export function geometryLogic<T extends Geometrys>(geometry: T): GeometryLogic
{
    /**
     * indices（TypedArray）：computed 从子工厂的 vertexIndices（number[]）转换。
     * 顶点数 > 65535 时用 Uint32，否则 Uint16。子工厂用 Object.defineProperty 覆盖
     * vertexIndices getter 返回 computed 驱动的 number[]。
     */
    const _indices = computed<IndicesDataTypes>(() =>
    {
        const raw = lg.vertexIndices;
        if (!raw || raw.length === 0) return new Uint16Array();
        const maxIndex = raw.reduce((m, v) => v > m ? v : m, 0);

        return maxIndex > 65535 ? new Uint32Array(raw) : new Uint16Array(raw);
    });

    /**
     * draw：computed 从 indices + drawRange 派生。
     * drawRange 从响应式数据接口字段 reactive(geometry).drawRange 读取，变化时自动失效。
     */
    const _draw = computed<IDraw>(() =>
    {
        const raw = lg.vertexIndices;
        const range = reactive(geometry).drawRange ?? null;
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
        const firstAttr = Object.values(lg.vertices)[0];
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

    /** 射线投影（读子工厂覆盖的 vertices getter） */
    function raycast(ray: Ray3, shortestCollisionDistance = Number.MAX_VALUE, cullFace = CullFace.NONE): ReturnType<GeometryUtils['raycast']>
    {
        const attr = lg.vertices;

        return geometryUtils.raycast(
            ray,
            lg.vertexIndices,
            attr.a_position?.data as unknown as number[] ?? [],
            attr.a_uv?.data as unknown as number[] ?? [],
            shortestCollisionDistance,
            cullFace);
    }

    // ---- 返回对象（子类工厂在其上 defineProperty 覆盖 vertices/vertexIndices getter） ----
    // vertices 基座默认返回空表，子工厂用 Object.defineProperty 覆盖返回自身属性表。
    // vertexIndices 基座默认返回空数组，子工厂用 Object.defineProperty 覆盖为 computed 驱动。
    // indices/draw 由基座 computed 从 vertexIndices + drawRange 派生（子工厂不覆盖）。
    const lg = {
        get vertices(): VertexAttributes { return {}; },
        get vertexIndices(): number[] { return []; },
        get indices(): IndicesDataTypes { return _indices.value; },
        get draw(): IDraw { return _draw.value; },
        get bounding(): Box3
        {
            const positions = lg.vertices.a_position?.data as unknown as number[] | undefined;
            if (!positions || positions.length === 0)
            {
                return new Box3();
            }

            return Box3.formPositions(positions);
        },
        raycast,
    };

    return lg;
}

// GeometryUtils 的可射线投影方法类型别名（避免 any）
type GeometryUtils = typeof geometryUtils;

// ---- 默认 Geometry 注册表（惰性创建，避免 import 期副作用） ----

const _defaultGeometrys: Record<string, Geometrys> = {};
const _defaultGeometryFactories: Record<string, () => Geometrys> = {};

let _defaultsRegistered = false;

/**
 * 注册默认几何体工厂（由各子文件调用，避免循环 import）。
 */
export function registerDefaultGeometryFactory(name: string, factory: () => Geometrys): void
{
    _defaultGeometryFactories[name] = factory;
}

function ensureDefaultGeometrys(): void
{
    if (_defaultsRegistered) return;
    _defaultsRegistered = true;
    for (const name in _defaultGeometryFactories)
    {
        _defaultGeometrys[name] = _defaultGeometryFactories[name]();
    }
}

/**
 * 设置默认几何体。
 *
 * @param name 默认几何体名称
 * @param geometry 默认几何体
 */
export function setDefaultGeometry(name: string, geometry: Geometrys): void
{
    _defaultGeometrys[name] = geometry;
}

/**
 * 获取默认几何体。
 *
 * @param name 默认几何体名称
 */
export function getDefaultGeometry(name: string): Geometrys
{
    ensureDefaultGeometrys();
    return _defaultGeometrys[name];
}

// ---- 注册基类 ----

registerLogic('Geometry', geometryLogic);
