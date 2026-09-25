import { Vector2 } from '@feng3d/math';
import { Geometry, GeometryLogic } from 'feng3d';
import { registerLogic, reactive, computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        LatheGeometry: LatheGeometryLogic;
    }
}

declare module 'feng3d'
{
    export interface GeometryMap
    {
        LatheGeometry: LatheGeometry;
    }
}

/**
 * 旋转体几何体（纯数据接口）。
 *
 * 由 2D 轮廓线（points）绕 Y 轴旋转生成。移植自 three.js LatheGeometry。
 * points 通过运行时隐藏字段 __points 传递（无法序列化）。
 */
export interface LatheGeometry extends Geometry
{
    readonly __type__: 'LatheGeometry';
    /** 旋转分段数，默认 12 */
    readonly segments: number;
    /** 起始角（弧度），默认 0 */
    readonly phiStart: number;
    /** 扫掠角（弧度），默认 2π */
    readonly phiLength: number;
}

/**
 * 运行时隐藏字段类型（points 无法序列化但运行时需要）。
 */
type LatheGeometryRuntime = LatheGeometry & {
    __points: Vector2[];
};

/**
 * LatheGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic}，每个顶点属性用 computed 独立懒计算，
 * 依赖 segments/phiStart/phiLength 与运行时隐藏字段 __points。
 */
export class LatheGeometryLogic extends GeometryLogic
{
    // 响应式参数访问器（构造时已填充默认值，直接读取；__points 为运行时隐藏字段）
    readonly #points = (): Vector2[] => reactive(this._data as unknown as LatheGeometryRuntime).__points;
    readonly #segments = (): number => reactive(this._data as LatheGeometry).segments;
    readonly #phiStart = (): number => reactive(this._data as LatheGeometry).phiStart;
    readonly #phiLength = (): number => reactive(this._data as LatheGeometry).phiLength;

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
    readonly #_tangents = computed(() => new Float32Array(this.#_positions.value.length / 3 * 3));

    // attributes: data 由 computed getter 驱动
    readonly #_attrTable: VertexAttributes = {
        a_position: this.computedAttr(this.#_positions, 'float32x3'),
        a_color: this.computedAttr(this.#_colors, 'float32x4'),
        a_uv: this.computedAttr(this.#_uvs, 'float32x2'),
        a_normal: this.computedAttr(this.#_normals, 'float32x3'),
        a_tangent: this.computedAttr(this.#_tangents, 'float32x3'),
    };

    protected constructor(data: LatheGeometry)
    {
        // 默认值填充（super 之前完成，构造完成即已填充）
        const writable = data as UnReadonly<LatheGeometry>;
        if (data.name === undefined) writable.name = 'Lathe';
        if (data.scaleU === undefined) writable.scaleU = 1;
        if (data.scaleV === undefined) writable.scaleV = 1;
        if (data.segments === undefined) writable.segments = 12;
        if (data.phiStart === undefined) writable.phiStart = 0;
        if (data.phiLength === undefined) writable.phiLength = Math.PI * 2;

        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: LatheGeometry): LatheGeometryLogic
    {
        return new LatheGeometryLogic(data);
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
        const points = this.#points();
        const segments = Math.floor(this.#segments());
        const phiStart = this.#phiStart();
        const phiLength = this.#phiLength();
        if (!points || points.length === 0) return new Float32Array(0);

        const positions: number[] = [];
        const inverseSegments = 1 / segments;
        for (let i = 0; i <= segments; i++)
        {
            const phi = phiStart + i * inverseSegments * phiLength;
            const sin = Math.sin(phi);
            const cos = Math.cos(phi);
            for (let j = 0; j <= points.length - 1; j++)
            {
                positions.push(points[j].x * sin, points[j].y, points[j].x * cos);
            }
        }

        return new Float32Array(positions);
    }

    #buildNormals(): Float32Array
    {
        const points = this.#points();
        const segments = Math.floor(this.#segments());
        const phiStart = this.#phiStart();
        const phiLength = this.#phiLength();
        if (!points || points.length === 0) return new Float32Array(0);

        // 预计算 2D 轮廓线每个点的法线（在 XY 平面，垂直于切线）
        const initNormals: number[] = [];
        const pointCount = points.length;
        let prevNormal = new Vector2();
        for (let j = 0; j < pointCount; j++)
        {
            let dx: number; let dy: number;
            if (j === 0)
            {
                dx = points[j + 1].x - points[j].x;
                dy = points[j + 1].y - points[j].y;
            }
            else if (j === pointCount - 1)
            {
                // 用前一个法线
                initNormals.push(prevNormal.x, prevNormal.y);
                continue;
            }
            else
            {
                dx = points[j + 1].x - points[j].x;
                dy = points[j + 1].y - points[j].y;
            }
            const normal = new Vector2(dy, -dx);
            if (j > 0)
            {
                normal.x += prevNormal.x;
                normal.y += prevNormal.y;
            }
            prevNormal = normal;
            initNormals.push(normal.x, normal.y);
        }
        // 归一化并对第一个点也做处理（three.js 的算法在 j=0 时不归一化，但实际效果上需归一化）
        for (let j = 0; j < pointCount; j++)
        {
            const nx = initNormals[j * 2];
            const ny = initNormals[j * 2 + 1];
            const len = Math.sqrt(nx * nx + ny * ny);
            if (len > 1e-6)
            {
                initNormals[j * 2] = nx / len;
                initNormals[j * 2 + 1] = ny / len;
            }
        }

        const normals: number[] = [];
        const inverseSegments = 1 / segments;
        for (let i = 0; i <= segments; i++)
        {
            const phi = phiStart + i * inverseSegments * phiLength;
            const sin = Math.sin(phi);
            const cos = Math.cos(phi);
            for (let j = 0; j <= pointCount - 1; j++)
            {
                const nx = initNormals[j * 2] * sin;
                const ny = initNormals[j * 2 + 1];
                const nz = initNormals[j * 2] * cos;
                normals.push(nx, ny, nz);
            }
        }

        return new Float32Array(normals);
    }

    #buildUVs(): Float32Array
    {
        const points = this.#points();
        const segments = Math.floor(this.#segments());
        if (!points || points.length === 0) return new Float32Array(0);

        const uvs: number[] = [];
        for (let i = 0; i <= segments; i++)
        {
            for (let j = 0; j <= points.length - 1; j++)
            {
                uvs.push(i / segments, j / (points.length - 1));
            }
        }

        return new Float32Array(uvs);
    }

    #buildIndices(): number[]
    {
        const points = this.#points();
        const segments = Math.floor(this.#segments());
        if (!points || points.length === 0) return [];

        const indices: number[] = [];
        const pointCount = points.length;
        for (let i = 0; i < segments; i++)
        {
            for (let j = 0; j < pointCount - 1; j++)
            {
                const baseIdx = j + i * pointCount;
                const a = baseIdx;
                const b = baseIdx + pointCount;
                const c = baseIdx + pointCount + 1;
                const d = baseIdx + 1;
                indices.push(a, b, d);
                indices.push(c, d, b); // three.js 原始顺序（注意与 Ring 反向）
            }
        }

        return indices;
    }
}

registerLogic('LatheGeometry', LatheGeometryLogic as unknown as new (data: LatheGeometry) => LatheGeometryLogic);
