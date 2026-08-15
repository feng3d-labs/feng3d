import { Geometry, GeometryLogic, geometryUtils } from 'feng3d';
import { registerLogic, reactive, computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        CircleGeometry: CircleGeometryLogic;
    }
}

declare module 'feng3d'
{
    export interface GeometryMap
    {
        CircleGeometry: CircleGeometry;
    }
}

/**
 * 圆盘几何体（纯数据接口）。
 *
 * XY 平面圆盘，法线 +Z。中心顶点 + 扇形三角化。移植自 three.js CircleGeometry。
 */
export interface CircleGeometry extends Geometry
{
    readonly __type__: 'CircleGeometry';
    /** 半径，默认 0.5 */
    readonly radius: number;
    /** 分段数（≥3），默认 32 */
    readonly segments: number;
    /** 起始角（弧度），默认 0 */
    readonly thetaStart: number;
    /** 扫掠角（弧度），默认 2π */
    readonly thetaLength: number;
}

/**
 * CircleGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic}，每个顶点属性用 computed 独立懒计算，
 * 依赖 radius/segments/thetaStart/thetaLength。
 */
export class CircleGeometryLogic extends GeometryLogic
{
    // 响应式参数访问器（构造时已填充默认值，直接读取）
    readonly #radius = (): number => reactive(this._data as CircleGeometry).radius;
    readonly #segments = (): number => reactive(this._data as CircleGeometry).segments;
    readonly #thetaStart = (): number => reactive(this._data as CircleGeometry).thetaStart;
    readonly #thetaLength = (): number => reactive(this._data as CircleGeometry).thetaLength;

    // 每个属性独立 computed，仅在实际被读取时计算
    readonly #_positions = computed(() => this.#buildPositions());
    readonly #_normals = computed(() => this.#buildNormals());
    readonly #_uvs = computed(() => this.#buildUVs());
    readonly #_indices = computed(() => this.#buildIndices());
    readonly #_colors = computed(() =>
    {
        const pos = this.#_positions.value;
        if (pos.length === 0) return new Float32Array(0);
        const count = pos.length / 3;

        return new Float32Array(count * 4).fill(1);
    });
    readonly #_tangents = computed(() =>
    {
        const positions = Array.from(this.#_positions.value);
        const uvs = Array.from(this.#_uvs.value);

        return new Float32Array(geometryUtils.createVertexTangents(this.#_indices.value, positions, uvs, true));
    });

    // attributes: data 由 computed getter 驱动
    readonly #_attrTable: VertexAttributes = {
        a_position: this.computedAttr(this.#_positions, 'float32x3'),
        a_color: this.computedAttr(this.#_colors, 'float32x4'),
        a_uv: this.computedAttr(this.#_uvs, 'float32x2'),
        a_normal: this.computedAttr(this.#_normals, 'float32x3'),
        a_tangent: this.computedAttr(this.#_tangents, 'float32x3'),
    };

    protected constructor(data: CircleGeometry)
    {
        // 默认值填充（super 之前完成，构造完成即已填充）
        const writable = data as UnReadonly<CircleGeometry>;
        if (data.name === undefined) writable.name = 'Circle';
        if (data.scaleU === undefined) writable.scaleU = 1;
        if (data.scaleV === undefined) writable.scaleV = 1;
        if (data.radius === undefined) writable.radius = 0.5;
        if (data.segments === undefined) writable.segments = 32;
        if (data.thetaStart === undefined) writable.thetaStart = 0;
        if (data.thetaLength === undefined) writable.thetaLength = Math.PI * 2;

        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: CircleGeometry): CircleGeometryLogic
    {
        return new CircleGeometryLogic(data);
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

    #buildPositions(): Float32Array
    {
        const radius = this.#radius();
        const segments = Math.max(3, this.#segments());
        const thetaStart = this.#thetaStart();
        const thetaLength = this.#thetaLength();

        const positions: number[] = [];
        // 中心顶点
        positions.push(0, 0, 0);
        for (let s = 0; s <= segments; s++)
        {
            const segment = thetaStart + s / segments * thetaLength;
            positions.push(radius * Math.cos(segment), radius * Math.sin(segment), 0);
        }

        return new Float32Array(positions);
    }

    #buildNormals(): Float32Array
    {
        const segments = Math.max(3, this.#segments());
        const count = (segments + 2); // 中心 + segments+1 个周边
        const normals: number[] = [];
        for (let i = 0; i < count; i++)
        {
            normals.push(0, 0, 1); // 法线 +Z
        }

        return new Float32Array(normals);
    }

    #buildUVs(): Float32Array
    {
        const radius = this.#radius();
        const segments = Math.max(3, this.#segments());
        const thetaStart = this.#thetaStart();
        const thetaLength = this.#thetaLength();

        const uvs: number[] = [];
        // 中心顶点 uv
        uvs.push(0.5, 0.5);
        for (let s = 0; s <= segments; s++)
        {
            const segment = thetaStart + s / segments * thetaLength;
            const x = radius * Math.cos(segment);
            const y = radius * Math.sin(segment);
            uvs.push((x / radius + 1) / 2, (y / radius + 1) / 2);
        }

        return new Float32Array(uvs);
    }

    #buildIndices(): number[]
    {
        const segments = Math.max(3, this.#segments());
        const indices: number[] = [];
        for (let i = 1; i <= segments; i++)
        {
            indices.push(i, i + 1, 0); // CCW（从 +Z 看）
        }

        return indices;
    }
}

registerLogic('CircleGeometry', CircleGeometryLogic as unknown as new (data: CircleGeometry) => CircleGeometryLogic);
