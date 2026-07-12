import { Box3, Matrix4x4, Ray3 } from '@feng3d/math';
import { reactive, logic, registerLogic, effect } from '@feng3d/reactivity';
import { RenderObject, VertexAttribute } from '@feng3d/webgpu';
import { CullFace } from '../render/data/enums';
import { Index } from '../render/data/Index';
import { applyGeometryRenderData } from '../render/webgpu/MaterialPipeline';
import { geometryUtils } from './GeometryUtils';

/**
 * 几何体（纯数据接口）。
 *
 * 仅保留 `__type__` 与构造参数；顶点数据（positions/normals/uvs/indices 等）与行为
 * （buildGeometry/beforeRender/bounding/raycast/clone）由 {@link GeometryLogic} 提供。
 *
 * 具体子类（CubeGeometry/PlaneGeometry 等）继承本接口，添加自身构造参数字段，
 * 并通过 `declare module './Geometry'` 注册到 {@link GeometryMap} 以纳入 {@link Geometrys} 联合类型。
 */
export interface Geometry
{
    /** 数据类型标识，对应 registerLogic 工厂注册名 */
    readonly __type__: string;
    /** 名称（缺失时由 registerLogic 自动填充） */
    name?: string;
    /** 纹理U缩放，默认为1（缺失时由 registerLogic 自动填充） */
    scaleU?: number;
    /** 纹理V缩放，默认为1（缺失时由 registerLogic 自动填充） */
    scaleV?: number;
}

/**
 * Geometry 类型注册表，由各子类通过 `declare module './Geometry'` 扩展。
 */
export interface GeometryMap { }

/**
 * 所有 Geometry 具体子类型的联合类型（含基类 Geometry 兜底）。
 *
 * 用于 Renderable.geometry 等字段，使 TS 可按 `__type__` 识别具体子类型，
 * 同时允许基类 Geometry（如 getDefaultGeometry 返回值）赋值。
 */
export type Geometrys = GeometryMap[keyof GeometryMap] | Geometry;

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
        ParametricGeometry: GeometryLogic;
    }
}

/**
 * Geometry 逻辑处理输出。
 *
 * 顶点数据（_attributes / _indexBuffer / positions / normals / uvs / indices / tangents /
 * colors / skin* / bounding）全部由本 logic 维护；Geometry 接口只保留构造参数。
 *
 * 行为：updateGeometry / beforeRender / bounding / raycast / clone / cloneFrom /
 * addGeometry / applyTransformation / invalidate / clear。
 */
export class GeometryLogic
{
    /** 关联的数据对象（用于 clone/cloneFrom 时按 __type__ 找克隆工厂） */
    protected readonly _geometry: Geometry;
    /** 顶点属性表（由子类在构造函数中初始化） */
    attributes: Record<string, VertexAttribute>;
    /** 索引缓冲（由子类在构造函数中初始化） */
    indexBuffer: Index;
    /** 几何体是否已失效（需重新 buildGeometry） */
    protected _geometryInvalid: boolean;
    /** 包围盒缓存 */
    protected _bounding: Box3;

    constructor(geometry: Geometry)
    {
        this._geometry = geometry;
        this._geometryInvalid = true;
        this._bounding = null as any;
    }

    /** 设置某个顶点属性数据（number[] → Float32Array） */
    protected setAttr(key: string, value: number[]): void
    {
        this.attributes[key].data = new Float32Array(value);
    }

    /**
     * 构建几何体顶点数据（子类覆盖）。
     * 在 updateGeometry 标记失效时调用。
     */
    buildGeometry(): void { /* 默认空 */ }

    /** 索引数据 */
    get indices(): number[]
    {
        this.updateGeometry();

        return this.indexBuffer.indices;
    }

    set indices(v: number[]) { this.indexBuffer.indices = v; }

    /** 坐标数据 */
    get positions(): number[] { return this.attributes.a_position.data as unknown as number[]; }
    set positions(v: number[]) { this.setAttr('a_position', v); }
    /** 颜色数据 */
    get colors(): number[] { return this.attributes.a_color.data as unknown as number[]; }
    set colors(v: number[]) { this.setAttr('a_color', v); }
    /** uv 数据 */
    get uvs(): number[] { return this.attributes.a_uv.data as unknown as number[]; }
    set uvs(v: number[]) { this.setAttr('a_uv', v); }
    /** 法线数据 */
    get normals(): number[] { return this.attributes.a_normal.data as unknown as number[]; }
    set normals(v: number[]) { this.setAttr('a_normal', v); }
    /** 切线数据 */
    get tangents(): number[] { return this.attributes.a_tangent.data as unknown as number[]; }
    set tangents(v: number[]) { this.setAttr('a_tangent', v); }
    /** 蒙皮索引 */
    get skinIndices(): number[] { return this.attributes.a_skinIndices.data as unknown as number[]; }
    set skinIndices(v: number[]) { this.setAttr('a_skinIndices', v); }
    /** 蒙皮权重 */
    get skinWeights(): number[] { return this.attributes.a_skinWeights.data as unknown as number[]; }
    set skinWeights(v: number[]) { this.setAttr('a_skinWeights', v); }
    /** 蒙皮索引 1 */
    get skinIndices1(): number[] { return this.attributes.a_skinIndices1.data as unknown as number[]; }
    set skinIndices1(v: number[]) { this.setAttr('a_skinIndices1', v); }
    /** 蒙皮权重 1 */
    get skinWeights1(): number[] { return this.attributes.a_skinWeights1.data as unknown as number[]; }
    set skinWeights1(v: number[]) { this.setAttr('a_skinWeights1', v); }

    /** 顶点数量 */
    get numVertex(): number { return this.positions.length / 3; }
    /** 三角形数量 */
    get numTriangles(): number { return this.indices.length / 3; }

    /** 包围盒 */
    get bounding(): Box3
    {
        this.updateGeometry();
        if (!this._bounding)
        {
            const positions = this.positions;
            if (!positions || positions.length === 0)
            {
                return new Box3();
            }
            this._bounding = Box3.formPositions(positions);
        }

        return this._bounding;
    }

    set bounding(v: Box3) { this._bounding = v; }

    /** 标记需要更新几何体 */
    invalidateGeometry(): void
    {
        this._geometryInvalid = true;
        this.invalidateBounds();
    }

    /** 更新几何体（若已失效则触发 buildGeometry） */
    updateGeometry(): void
    {
        if (this._geometryInvalid)
        {
            this._geometryInvalid = false;
            this.buildGeometry();
        }
    }

    /** 渲染前把顶点/索引/draw 写入 renderObject */
    beforeRender(renderObject: RenderObject): void
    {
        this.updateGeometry();
        applyGeometryRenderData(renderObject, this);
    }

    /** 射线投影 */
    raycast(ray: Ray3, shortestCollisionDistance = Number.MAX_VALUE, cullFace = CullFace.NONE): ReturnType<GeometryUtils['raycast']>
    {
        return geometryUtils.raycast(ray, this.indices, this.positions, this.uvs, shortestCollisionDistance, cullFace);
    }

    /** 克隆（深拷贝顶点数据，复用同一份构造参数） */
    clone(): Geometry
    {
        // 通过 __type__ 找到对应工厂创建同类型空数据，再克隆顶点数据
        const cloned = cloneGeometryData(this._geometry);
        this.cloneFrom(cloned);

        return cloned;
    }

    /** 从另一个 geometry 克隆顶点数据 */
    cloneFrom(source: Geometry): void
    {
        const sourceLogic = logic(source);
        sourceLogic.updateGeometry();
        this.indices = sourceLogic.indices.concat();
        for (const attributeName in sourceLogic.attributes)
        {
            const src = sourceLogic.attributes[attributeName];
            this.attributes[attributeName].data = new Float32Array(src.data as Float32Array);
        }
    }

    /** 合并另一个 geometry 的顶点数据（可选变换） */
    addGeometry(source: Geometry, transform?: Matrix4x4): void
    {
        this.updateGeometry();
        const sourceLogic = logic(source);
        sourceLogic.updateGeometry();
        let other = sourceLogic;
        if (transform)
        {
            const cloned = sourceLogic.clone();
            logic(cloned).applyTransformation(transform);
            other = logic(cloned);
        }

        // 自身为空时直接克隆
        if (!this.indices || this.indices.length === 0)
        {
            this.cloneFrom(source);

            return;
        }

        const oldNumVertex = this.numVertex;
        // 合并索引
        const selfIndices = this.indices;
        const otherIndices = other.indices;
        const totalIndices = selfIndices.concat();
        for (let i = 0; i < otherIndices.length; i++)
        {
            totalIndices[selfIndices.length + i] = otherIndices[i] + oldNumVertex;
        }
        this.indices = totalIndices;
        // 合并属性
        for (const attributeName in this.attributes)
        {
            const selfAttr = this.attributes[attributeName];
            const otherAttr = other.attributes[attributeName];
            selfAttr.data = new Float32Array(
                Array.from(selfAttr.data as Float32Array).concat(Array.from(otherAttr.data as Float32Array))
            );
        }
    }

    /** 应用变换矩阵到顶点数据 */
    applyTransformation(transform: Matrix4x4): void
    {
        this.updateGeometry();
        const vertices = this.positions;
        const normals = this.normals;
        const tangents = this.tangents;
        geometryUtils.applyTransformation(transform, vertices, normals, tangents);
        this.positions = vertices;
        this.normals = normals;
        this.tangents = tangents;
    }

    /** 包围盒失效 */
    invalidateBounds(): void { this._bounding = null as any; }

    /** 清理顶点数据 */
    clear(): void
    {
        for (const key in this.attributes)
        {
            this.attributes[key].data = new Float32Array([]);
        }
    }
}

// GeometryUtils 的可射线投影方法类型别名（避免 any）
type GeometryUtils = typeof geometryUtils;

// ---- 响应式失效监听（参数变化触发 invalidateGeometry） ----

/**
 * 监听 geometry 数据字段变化，变化时标记 logic 需要重新 build。
 *
 * 子类 Logic 构造函数调用本函数注册响应式依赖。
 */
export function watchGeometryInvalid(geometry: Geometry, keys: string[], lg: GeometryLogic): void
{
    const rg = reactive(geometry as any);
    for (const key of keys)
    {
        effect(() =>
        {
            // 读取以建立依赖
            void rg[key];
            lg.invalidateGeometry();
        });
    }
}

// ---- 默认 Geometry 注册表（惰性创建，避免 import 期副作用） ----

const _defaultGeometrys: Record<string, Geometry> = {};
const _defaultGeometryFactories: Record<string, () => Geometry> = {};

let _defaultsRegistered = false;

/**
 * 注册默认几何体工厂（由各子文件调用，避免循环 import）。
 */
export function registerDefaultGeometryFactory(name: string, factory: () => Geometry): void
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
export function setDefaultGeometry(name: string, geometry: Geometry): void
{
    _defaultGeometrys[name] = geometry;
}

/**
 * 获取默认几何体。
 *
 * @param name 默认几何体名称
 */
export function getDefaultGeometry(name: string): Geometry
{
    ensureDefaultGeometrys();
    return _defaultGeometrys[name];
}

// ---- 辅助函数 ----

/**
 * 创建标准顶点属性表（供子类构造函数使用）。
 */
export function createGeometryAttributes(): Record<string, VertexAttribute>
{
    return {
        a_position: { data: new Float32Array([]), format: 'float32x3' },
        a_color: { data: new Float32Array([]), format: 'float32x4' },
        a_uv: { data: new Float32Array([]), format: 'float32x2' },
        a_normal: { data: new Float32Array([]), format: 'float32x3' },
        a_tangent: { data: new Float32Array([]), format: 'float32x3' },
        a_skinIndices: { data: new Float32Array([]), format: 'float32x4' },
        a_skinWeights: { data: new Float32Array([]), format: 'float32x4' },
        a_skinIndices1: { data: new Float32Array([]), format: 'float32x4' },
        a_skinWeights1: { data: new Float32Array([]), format: 'float32x4' },
    };
}

// ---- 克隆工厂注册表 ----

// 按 __type__ 克隆一份同类型空数据（用于 clone 时构造新实例）
function cloneGeometryData(geometry: Geometry): Geometry
{
    const fn = _cloneFactories.get(geometry.__type__);
    if (!fn) throw new Error(`未注册 ${geometry.__type__} 的克隆工厂`);
    const cloned = fn(geometry);

    return cloned;
}

// 子类注册"按数据克隆"工厂（避免依赖 class 构造器）
const _cloneFactories = new Map<string, (src: any) => Geometry>();

/**
 * 注册克隆工厂（由各子文件调用）。
 */
export function registerCloneFactory(__type__: string, factory: (src: any) => Geometry): void
{
    _cloneFactories.set(__type__, factory);
}

// ---- 注册基类 ----

registerLogic('Geometry', GeometryLogic as any);
