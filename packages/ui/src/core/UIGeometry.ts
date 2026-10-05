import { Geometry, GeometryLogic, geometryUtils } from 'feng3d';
import { computed, registerLogic } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module 'feng3d'
{
    export interface GeometryMap
    {
        UIGeometry: UIGeometry;
    }
}

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        UIGeometry: UIGeometryLogic;
    }
}

/**
 * UI几何体（纯数据接口）。
 *
 * 单位四边形：顶点取 `(0,0)` → `(1,1)`，实际尺寸由着色器里的 `u_rect` uniform 缩放
 * （**注意与 `QuadGeometry` 的居中四边形 `[-0.5,0.5]` 不同**，不要互换）。
 *
 * 无构造参数，字面量 `{ __type__: 'UIGeometry' }` 即完整数据；顶点数据全部由
 * {@link UIGeometryLogic} 维护。
 */
export interface UIGeometry extends Geometry
{
    readonly __type__: 'UIGeometry';
}

/**
 * UIGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic}。顶点数据与原实现逐字一致：
 * positions / uvs / indices 为常量，normals / tangents 由它们派生（原实现是在构造函数里
 * 就地算好写进字段，这里改为 computed，语义与读取结果不变）。
 */
export class UIGeometryLogic extends GeometryLogic
{
    // 每个属性独立 computed，仅在实际被读取时计算
    readonly #_positions = computed(() => new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]));
    readonly #_uvs = computed(() => new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]));
    readonly #_indices = computed(() => [0, 1, 2, 0, 2, 3]);
    readonly #_normals = computed(() => new Float32Array(geometryUtils.createVertexNormals(
        this.#_indices.value, Array.from(this.#_positions.value), true)));
    readonly #_tangents = computed(() => new Float32Array(geometryUtils.createVertexTangents(
        this.#_indices.value, Array.from(this.#_positions.value), Array.from(this.#_uvs.value), true)));

    // attributes：data 由各 computed getter 驱动
    readonly #_attrTable: VertexAttributes = {
        a_position: this.computedAttr(this.#_positions, 'float32x3'),
        a_uv: this.computedAttr(this.#_uvs, 'float32x2'),
        a_normal: this.computedAttr(this.#_normals, 'float32x3'),
        a_tangent: this.computedAttr(this.#_tangents, 'float32x3'),
    };

    protected constructor(data: UIGeometry)
    {
        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: UIGeometry): UIGeometryLogic
    {
        return new UIGeometryLogic(data);
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

// 注册到统一 logic 分发表
registerLogic('UIGeometry', UIGeometryLogic as unknown as new (data: UIGeometry) => UIGeometryLogic);

/**
 * 创建 UI 几何体数据。
 *
 * 迁移前这里是 `Geometry.setDefault('Default-UIGeometry', new UIGeometry())`：
 * 把实例登记进默认几何体注册表，供 `Geometry.getDefault('Default-UIGeometry')` 取用。
 * 主仓已移除默认几何体注册表（`Geometry.setDefault` / `getDefaultGeometry` 都不存在），
 * 需要默认几何体的位置改为直接写纯数据字面量 `{ __type__: 'UIGeometry' }` 或调用本工厂。
 *
 * @returns UI 几何体数据
 */
export function createUIGeometry(): UIGeometry
{
    return { __type__: 'UIGeometry' };
}
