import { Box3, Ray3 } from '@feng3d/math';
import { reactive, logic, registerLogic, computed, type UnReadonly } from '@feng3d/reactivity';
import { IDraw, RenderObject, VertexAttribute, VertexAttributes } from '@feng3d/webgpu';
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
        CubeGeometry: GeometryLogic;
        PlaneGeometry: GeometryLogic;
        SphereGeometry: GeometryLogic;
        CapsuleGeometry: GeometryLogic;
        CylinderGeometry: GeometryLogic;
        ConeGeometry: GeometryLogic;
        TorusGeometry: GeometryLogic;
        QuadGeometry: GeometryLogic;
        PointGeometry: GeometryLogic;
        SegmentGeometry: GeometryLogic;
        CustomGeometry: GeometryLogic;
    }
}

/**
 * geometryLogic 实例接口（函数式实现）。
 *
 * 顶点数据（attributes / positions / normals / uvs / indices / tangents /
 * colors / skin* / bounding）全部由本 logic 维护；Geometry 接口只保留构造参数。
 *
 * 行为：beforeRender / bounding / raycast。
 *
 * 作为所有几何体 logic 的组合基座，被各 geometry 子类工厂（cubeGeometryLogic 等）
 * 调用以复用全部通用顶点/索引/包围盒/渲染行为。子工厂通过重写 attributes getter
 *（Object.defineProperty）注入自身 computed 驱动的属性表。
 */
export interface GeometryLogic
{
    /**
     * 顶点属性表（子类工厂通过重写本 getter 注入；基座默认返回空表）。
     *
     * 顶点数据（positions/normals/uvs/colors/tangents/skin* 等）统一通过本属性访问，
     * 如 `attributes.a_position.data`。子工厂重写本 getter 返回 createAttributes() 创建的
     * 属性表，其中 `a_xxx.data` 可用 `Object.defineProperty` 覆盖为 computed 驱动，
     * 形成响应式链条：顶点数据变化时 computed 自动失效。
     */
    get attributes(): VertexAttributes;
    /** 包围盒（顶点数据变化时自动重算） */
    get bounding(): Box3;
    /** 渲染前把顶点/索引/draw 写入 renderObject */
    beforeRender(renderObject: RenderObject): void;
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
    // ---- 渲染数据缓存（按 vertices 引用 + indicesRef 检测失效） ----
    let renderDataCache: {
        indicesRef: number[] | undefined;
        vertices: VertexAttributes;
        indicesTyped: Uint16Array | Uint32Array | undefined;
        /** drawRange=null 时的基准 draw（全长），每次 beforeRender 用 applyDrawRange 派生最终 draw */
        baseDraw: IDraw;
        /** 无索引绘制时的完整顶点数（供 drawRange.vertexCount 缺省时回退） */
        fullVertexCount: number;
    } | undefined;

    /**
     * 按 drawRange 派生最终 draw（覆盖基准 draw 的 indexCount/firstIndex 或 vertexCount/firstVertex）。
     * drawRange=null/undefined 时直接返回基准 draw。
     *
     * drawRange 从响应式数据接口字段 `reactive(geometry).drawRange` 读取，
     * 变化时（每帧 beforeRender 重新调用本函数）自动反映最新值。
     */
    function applyDrawRange(baseDraw: IDraw, _curIndices: number[], fullVertexCount: number): IDraw
    {
        const range = reactive(geometry).drawRange ?? null;
        if (!range)
        {
            return baseDraw;
        }
        if (baseDraw.__type__ === 'DrawIndexed')
        {
            return {
                __type__: 'DrawIndexed',
                indexCount: range.indexCount ?? baseDraw.indexCount,
                firstIndex: range.firstIndex ?? baseDraw.firstIndex ?? 0,
                instanceCount: baseDraw.instanceCount ?? 1,
            };
        }
        if (baseDraw.__type__ === 'DrawVertex')
        {
            return {
                __type__: 'DrawVertex',
                vertexCount: range.vertexCount ?? fullVertexCount,
                firstVertex: range.firstVertex ?? baseDraw.firstVertex ?? 0,
                instanceCount: baseDraw.instanceCount ?? 1,
            };
        }
        // DrawIndexedIndirect / DrawIndirect 不支持 drawRange，原样返回
        return baseDraw;
    }

    /**
     * 渲染前把顶点/索引/draw 写入 renderObject。
     *
     * 命中缓存（vertices 引用 + indicesRef 未变）则直接复用，避免每帧重建对象导致
     * renderPipeline/顶点 buffer 缓存膨胀（GPU 资源泄漏）。vertices 引用来自子工厂覆盖的
     * attributes getter（通常含 computed data），顶点数据变化时产生新引用，缓存随之失效。
     */
    function beforeRender(renderObject: RenderObject): void
    {
        // vertices 来自子工厂覆盖的 attributes getter
        const vertices = lg.attributes;
        // indices 由子工厂通过 Object.defineProperty 覆盖为 computed 驱动
        const curIndices = lg.indices;
        // RenderObject 接口的 vertices/indices/draw 声明为 readonly（纯数据接口约定），
        // 但构建阶段需可变写入。此处为构建边界，用 UnReadonly 断言为可变类型
        //（与 Object3DLogic.beforeRender 写 bindingResources 的模式一致）。
        const ro = renderObject as UnReadonly<RenderObject>;

        // 命中缓存则复用顶点/索引数据（geometry 数据未变化），但 draw 仍需按 drawRange 重新计算
        const cache = renderDataCache;
        if (cache && cache.vertices === vertices && cache.indicesRef === curIndices)
        {
            ro.vertices = cache.vertices;
            ro.indices = cache.indicesTyped;
            ro.draw = applyDrawRange(cache.baseDraw, curIndices, cache.fullVertexCount);

            return;
        }

        // 索引数据 + draw 描述符（基准全长，drawRange 在 applyDrawRange 里覆盖）
        let indicesTyped: Uint16Array | Uint32Array | undefined;
        let baseDraw: IDraw;
        let fullVertexCount = 0;
        if (curIndices && curIndices.length > 0)
        {
            // 顶点数超过 65535 时需要 Uint32，否则用 Uint16 节省显存
            const maxIndex = curIndices.reduce((m, v) => v > m ? v : m, 0);
            indicesTyped = maxIndex > 65535 ? new Uint32Array(curIndices) : new Uint16Array(curIndices);
            baseDraw = {
                __type__: 'DrawIndexed',
                indexCount: curIndices.length,
                firstIndex: 0,
                instanceCount: 1,
            };
        }
        else
        {
            // 无索引，按顶点绘制。用 WebGPU VertexAttribute.getVertexCount 计算顶点数。
            const firstAttr = Object.values(vertices)[0];
            fullVertexCount = firstAttr ? VertexAttribute.getVertexCount(firstAttr) : 0;
            baseDraw = {
                __type__: 'DrawVertex',
                vertexCount: fullVertexCount,
                instanceCount: 1,
            };
        }

        ro.vertices = vertices;
        ro.indices = indicesTyped;
        ro.draw = applyDrawRange(baseDraw, curIndices, fullVertexCount);

        // 写入缓存
        renderDataCache = { indicesRef: curIndices, vertices, indicesTyped, baseDraw, fullVertexCount };
    }

    /** 射线投影（读子工厂覆盖的 attributes getter） */
    function raycast(ray: Ray3, shortestCollisionDistance = Number.MAX_VALUE, cullFace = CullFace.NONE): ReturnType<GeometryUtils['raycast']>
    {
        const attr = lg.attributes;

        return geometryUtils.raycast(
            ray,
            lg.indices,
            attr.a_position?.data as unknown as number[] ?? [],
            attr.a_uv?.data as unknown as number[] ?? [],
            shortestCollisionDistance,
            cullFace);
    }

    // ---- 返回对象（子类工厂在其上 defineProperty 覆盖 attributes/indices getter） ----
    // attributes 基座默认返回空表，子工厂用 Object.defineProperty 覆盖返回自身属性表。
    // indices 基座默认返回空数组，子工厂用 Object.defineProperty 覆盖为 computed 驱动。
    const lg = {
        get attributes(): VertexAttributes { return {}; },
        get indices(): number[] { return []; },
        get bounding(): Box3
        {
            const positions = lg.attributes.a_position?.data as unknown as number[] | undefined;
            if (!positions || positions.length === 0)
            {
                return new Box3();
            }

            return Box3.formPositions(positions);
        },
        beforeRender,
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
