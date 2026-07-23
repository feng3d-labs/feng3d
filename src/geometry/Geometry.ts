import { Box3, Matrix4x4, Ray3 } from '@feng3d/math';
import { reactive, logic, registerLogic, effect, type UnReadonly } from '@feng3d/reactivity';
import { IDraw, RenderObject, VertexAttribute, VertexAttributes } from '@feng3d/webgpu';
import { CullFace } from '../render/data/enums';
import { geometryUtils } from './GeometryUtils';

/**
 * core 顶点属性名（如 `a_position`）→ WGSL `@location(N)` 形参名（如 `position`）的统一映射。
 *
 * core 的几何体属性名统一带 `a_` 前缀，WGSL 着色器统一使用无前缀名。
 * 某个 shader 不使用某属性时不会出错：WebGPU 顶点缓冲布局根据着色器反射
 * （见 `WGPUVertexBufferLayout`）按名匹配，多余属性自动忽略。
 */
const vertexAttributeMap: { [coreName: string]: string } = {
    a_position: 'position',
    a_color: 'color',
    a_uv: 'uv',
    a_normal: 'normal',
    a_tangent: 'tangent',
    a_skinIndices: 'skinIndices',
    a_skinWeights: 'skinWeights',
    a_skinIndices1: 'skinIndices1',
    a_skinWeights1: 'skinWeights1',
};

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
    /** 顶点属性表（由子类在构造函数中通过 setter 初始化） */
    private _attributes: Record<string, VertexAttribute> = {};
    /** 顶点属性表（只读 getter，子类通过 setter 赋值） */
    get attributes(): Record<string, VertexAttribute> { return this._attributes; }
    protected set attributes(v: Record<string, VertexAttribute>) { this._attributes = v; }
    /** 索引数据（子类可 override 为 computed 驱动） */
    protected _indices: number[];
    /** 几何体是否已失效（需重新 buildGeometry） */
    protected _geometryInvalid: boolean;
    /** 包围盒缓存 */
    protected _bounding: Box3 | null;
    /**
     * geometry 渲染数据缓存（按 posRef + indicesRef 检测失效）。
     *
     * beforeRender 每帧调用，若每次都 buildVertices + new TypedArray 会产生
     * 新对象引用 → renderPipeline/buffer 缓存 key 变化 → 每帧新建 GPU 资源（泄漏）。
     * 缓存按 position.data 引用 + indices 引用判断：数据不变则复用。
     */
    private _renderDataCache?: {
        posRef: object | undefined;
        indicesRef: number[] | undefined;
        vertices: VertexAttributes;
        indicesTyped: Uint16Array | Uint32Array | undefined;
        draw: IDraw;
    };
    /**
     * 默认 color 顶点属性缓存（按 position 数据引用缓存）。
     *
     * geometry 无 color 属性时由 buildVertices 合成默认白色 color 数据。
     * 按 positionAttr.data（Float32Array）引用缓存，避免每帧 new Float32Array
     * 产生新 ArrayBuffer → 新 WGPUBuffer（顶点 buffer 按 ArrayBuffer 引用缓存）。
     */
    private static _defaultColorCache = new WeakMap<object, { data: Float32Array, format: 'float32x4' }>();

    /** 默认 tangent 缓存（按 position 数据引用，避免每帧 new Float32Array） */
    private static _defaultTangentCache = new WeakMap<object, { data: Float32Array, format: 'float32x3' }>();

    constructor(geometry: Geometry)
    {
        this._geometry = geometry;
        this._indices = [];
        this._geometryInvalid = true;
        this._bounding = null;
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

    /** 索引数据（子类可 override 为 computed 驱动） */
    get indices(): number[]
    {
        this.updateGeometry();

        return this._indices;
    }

    set indices(v: number[]) { this._indices = v; }

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

    /**
     * 渲染前把顶点/索引/draw 写入 renderObject。
     *
     * 命中缓存（posRef/indicesRef 未变）则直接复用，避免每帧重建对象导致
     * renderPipeline/顶点 buffer 缓存膨胀（GPU 资源泄漏）。
     */
    beforeRender(renderObject: RenderObject): void
    {
        this.updateGeometry();
        const indices = this.indices;
        const posRef = this.attributes.a_position?.data as object | undefined;
        // RenderObject 接口的 vertices/indices/draw 声明为 readonly（纯数据接口约定），
        // 但构建阶段需可变写入。此处为构建边界，用 UnReadonly 断言为可变类型
        //（与 Object3DLogic.beforeRender 写 bindingResources 的模式一致）。
        const ro = renderObject as UnReadonly<RenderObject>;

        // 命中缓存则复用（geometry 数据未变化）
        const cache = this._renderDataCache;
        if (cache && cache.posRef === posRef && cache.indicesRef === indices)
        {
            ro.vertices = cache.vertices;
            ro.indices = cache.indicesTyped;
            ro.draw = cache.draw;

            return;
        }

        // 顶点属性
        const vertices = this.buildVertices();

        // 索引数据 + draw 描述符
        let indicesTyped: Uint16Array | Uint32Array | undefined;
        let draw: IDraw;
        if (indices && indices.length > 0)
        {
            // 顶点数超过 65535 时需要 Uint32，否则用 Uint16 节省显存
            const maxIndex = indices.reduce((m, v) => v > m ? v : m, 0);
            indicesTyped = maxIndex > 65535 ? new Uint32Array(indices) : new Uint16Array(indices);
            draw = {
                __type__: 'DrawIndexed',
                indexCount: indices.length,
                firstIndex: 0,
                instanceCount: 1,
            };
        }
        else
        {
            // 无索引，按顶点绘制。用 WebGPU VertexAttribute.getVertexCount 计算顶点数。
            const firstAttr = Object.values(vertices)[0];
            const vertexCount = firstAttr ? VertexAttribute.getVertexCount(firstAttr) : 0;
            draw = {
                __type__: 'DrawVertex',
                vertexCount,
                instanceCount: 1,
            };
        }

        ro.vertices = vertices;
        ro.indices = indicesTyped;
        ro.draw = draw;

        // 写入缓存
        this._renderDataCache = { posRef, indicesRef: indices, vertices, indicesTyped, draw };
    }

    /**
     * 构建 webgpu `VertexAttributes`。
     *
     * Geometry 的 `attributes` 已是 webgpu `VertexAttribute` 格式（data 为 Float32Array），
     * 这里仅做属性名映射（`a_position` → `position`）并跳过空数据。
     *
     * 注意：WebGPU 顶点缓冲布局根据着色器反射按名匹配（见 `WGPUVertexBufferLayout`），
     * 因此此处可以安全地提供全部属性，未被 shader 引用的属性会自动忽略。
     *
     * 若 geometry 无 color 属性，合成默认白色 color 数据（WGSL 着色器声明 @location color: vec4<f32>）。
     */
    private buildVertices(): VertexAttributes
    {
        const attributes = this.attributes;
        const vertices: VertexAttributes = {};

        for (const coreName in attributes)
        {
            if (!Object.prototype.hasOwnProperty.call(attributes, coreName)) continue;

            const wgslName = vertexAttributeMap[coreName];
            if (!wgslName) continue; // 未知属性，跳过

            const attr = attributes[coreName];
            if (!attr.data || attr.data.length === 0) continue;

            vertices[wgslName] = attr;
        }

        // 为着色器提供默认的 color 属性（如果 Geometry 没有）
        if (!vertices.color)
        {
            // 从 position 属性计算顶点数量（position 是 vec3，每个顶点 3 个 float）
            const positionAttr = attributes.a_position;
            if (positionAttr && positionAttr.data && positionAttr.data.length > 0)
            {
                // 按 positionAttr.data 引用缓存默认 color 数据，避免每帧 new Float32Array
                // 造成顶点 buffer 泄漏（WGPUBuffer 按 ArrayBuffer 引用缓存）。
                const posData = positionAttr.data;
                let colorAttr = GeometryLogic._defaultColorCache.get(posData);
                if (!colorAttr)
                {
                    const vertexCount = posData.length / 3;
                    const colorData = new Float32Array(vertexCount * 4);
                    // 填充白色 (1, 1, 1, 1)
                    for (let i = 0; i < vertexCount; i++)
                    {
                        colorData[i * 4] = 1;
                        colorData[i * 4 + 1] = 1;
                        colorData[i * 4 + 2] = 1;
                        colorData[i * 4 + 3] = 1;
                    }
                    colorAttr = { data: colorData, format: 'float32x4' as const };
                    GeometryLogic._defaultColorCache.set(posData, colorAttr);
                }
                vertices.color = colorAttr;
            }
        }

        // 为着色器提供默认的 tangent 属性（如果 Geometry 没有）。
        // 标准/地形顶点着色器声明了 @location(2) tangent: vec3<f32>，CustomGeometry 等
        // 无切线数据的几何体若不补默认会导致 WGPUVertexBufferLayout 反射找不到属性而崩溃。
        // tangent 当前未被片元着色器实际使用（法线贴图待后续），填 0 即可。
        if (!vertices.tangent)
        {
            const positionAttr = attributes.a_position;
            if (positionAttr && positionAttr.data && positionAttr.data.length > 0)
            {
                const posData = positionAttr.data;
                let tangentAttr = GeometryLogic._defaultTangentCache.get(posData);
                if (!tangentAttr)
                {
                    tangentAttr = { data: new Float32Array(posData.length), format: 'float32x3' as const };
                    GeometryLogic._defaultTangentCache.set(posData, tangentAttr);
                }
                vertices.tangent = tangentAttr;
            }
        }

        return vertices;
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
        this._indices = sourceLogic.indices.concat();
        for (const attributeName in sourceLogic.attributes)
        {
            if (!Object.prototype.hasOwnProperty.call(sourceLogic.attributes, attributeName)) continue;
            const src = sourceLogic.attributes[attributeName];
            this.setAttrDirect(attributeName, src.data as Float32Array);
        }
    }

    /** 直接设置属性数据（绕过 computed getter，用于 cloneFrom/addGeometry） */
    private setAttrDirect(key: string, data: Float32Array): void
    {
        // 如果属性 data 是 computed getter，用 defineProperty 替换为固定值
        const desc = Object.getOwnPropertyDescriptor(this.attributes, key);
        const attr = this.attributes[key];
        const dataDesc = Object.getOwnPropertyDescriptor(attr, 'data');
        if (dataDesc && dataDesc.get)
        {
            // computed 属性 — 替换为可写字段
            Object.defineProperty(attr, 'data', { value: new Float32Array(data), writable: true, enumerable: true, configurable: true });
        }
        else
        {
            attr.data = new Float32Array(data);
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
        this._indices = totalIndices;
        // 合并属性
        for (const attributeName in this.attributes)
        {
            if (!Object.prototype.hasOwnProperty.call(this.attributes, attributeName)) continue;
            const selfAttr = this.attributes[attributeName];
            const otherAttr = other.attributes[attributeName];
            this.setAttrDirect(attributeName, new Float32Array(
                Array.from(selfAttr.data as Float32Array).concat(Array.from(otherAttr.data as Float32Array))
            ));
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
        this.setAttrDirect('a_position', new Float32Array(vertices));
        this.setAttrDirect('a_normal', new Float32Array(normals));
        this.setAttrDirect('a_tangent', new Float32Array(tangents));
    }

    /** 包围盒失效 */
    invalidateBounds(): void { this._bounding = null; }

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
    const rg = reactive(geometry as unknown as Record<string, unknown>);
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
const _cloneFactories = new Map<string, (src: Geometry) => Geometry>();

/**
 * 注册克隆工厂（由各子文件调用）。
 */
export function registerCloneFactory(__type__: string, factory: (src: Geometry) => Geometry): void
{
    _cloneFactories.set(__type__, factory);
}

// ---- 注册基类 ----

registerLogic('Geometry', GeometryLogic as new (data: { readonly __type__: 'Geometry' }) => GeometryLogic);
