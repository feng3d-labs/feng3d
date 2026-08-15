import { Vector3 } from '@feng3d/math';
import { Geometry, GeometryLogic, geometryUtils } from 'feng3d';
import { registerLogic, reactive, computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        PolyhedronGeometry: PolyhedronGeometryLogic;
    }
}

declare module 'feng3d'
{
    export interface GeometryMap
    {
        PolyhedronGeometry: PolyhedronGeometry;
    }
}

/**
 * 多面体几何体（纯数据接口）。
 *
 * 由基底顶点表 + 基底索引表定义初始凸多面体（如二十面体/八面体/四面体），
 * 通过 `detail` 控制面细分等级（0 = 不细分），再投影到 `radius` 球面上。
 *
 * 移植自 three.js PolyhedronGeometry：非索引化输出，UV 用球面参数化，
 * detail=0 时法线为平面法线（computeVertexNormals），detail>0 时为平滑法线（normalizeNormals）。
 */
export interface PolyhedronGeometry extends Geometry
{
    readonly __type__: 'PolyhedronGeometry';
    /** 基底顶点表 [x,y,z, x,y,z, ...]（不可序列化，运行时通过 __vertices 读取） */
    readonly vertices?: number[];
    /** 基底索引表 [i0,i1,i2, ...]（不可序列化，运行时通过 __indices 读取） */
    readonly indices?: number[];
    /** 外接球半径（缺失时由工厂填充默认值） */
    readonly radius?: number;
    /** 细分等级（0 = 不细分，缺失时由工厂填充默认值） */
    readonly detail?: number;
}

/**
 * 运行时隐藏字段类型（vertices/indices 无法序列化但运行时需要）。
 */
type PolyhedronGeometryRuntime = PolyhedronGeometry & {
    __vertices: number[];
    __indices: number[];
};

/**
 * PolyhedronGeometryLogic 逻辑类（多面体基类引擎）。
 *
 * 继承 {@link GeometryLogic}，每个顶点属性用 computed 独立懒计算，
 * 依赖 __vertices/__indices/radius/detail。
 * 子类（IcosahedronGeometry 等）通过注入不同的 __vertices/__indices 复用本引擎。
 */
export class PolyhedronGeometryLogic extends GeometryLogic
{
    readonly #geometry: PolyhedronGeometry;

    // 缓冲区（生成过程共用）
    readonly #vertexBuffer: number[] = [];
    readonly #uvBuffer: number[] = [];

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

    protected constructor(data: PolyhedronGeometry)
    {
        const writable = data as UnReadonly<PolyhedronGeometry>;
        if (data.name === undefined) writable.name = 'Polyhedron';
        if (data.scaleU === undefined) writable.scaleU = 1;
        if (data.scaleV === undefined) writable.scaleV = 1;
        if (data.radius === undefined) writable.radius = 1;
        if (data.detail === undefined) writable.detail = 0;

        super(data);
        this.#geometry = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: PolyhedronGeometry): PolyhedronGeometryLogic
    {
        return new PolyhedronGeometryLogic(data);
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
        const r_g = reactive(this.#geometry as unknown as PolyhedronGeometryRuntime);
        const vertices = r_g.__vertices;
        const indices = r_g.__indices;
        const radius = r_g.radius;
        const detail = r_g.detail;
        if (!vertices || !indices || vertices.length === 0) return new Float32Array(0);

        // 重置缓冲区
        this.#vertexBuffer.length = 0;
        this.#uvBuffer.length = 0;

        // 子流程：缓存已生成的边中点（避免重复）
        const subdivideDetail = detail;

        // the subdivision creator
        const subdivide = (i: number, j: number, k: number, detail: number): void =>
        {
            const cols = detail + 1;
            // 构造 v[i][j]，i = 0..cols, j = 0..i
            const v: Vector3[][] = [];
            for (let col = 0; col <= cols; col++)
            {
                const aj = getVertexByIndex(i).clone().lerpNumber(getVertexByIndex(k), col / cols);
                const bj = getVertexByIndex(j).clone().lerpNumber(getVertexByIndex(k), col / cols);
                const rows = cols - col;
                const arr: Vector3[] = [];
                for (let row = 0; row <= rows; row++)
                {
                    if (rows === 0)
                    {
                        arr.push(aj);
                    }
                    else
                    {
                        arr.push(aj.clone().lerpNumber(bj, row / rows));
                    }
                }
                v.push(arr);
            }

            for (let col = 0; col < cols; col++)
            {
                for (let row = 0; row < 2 * (cols - col) - 1; row++)
                {
                    const kk = Math.floor(row / 2);
                    if (row % 2 === 0)
                    {
                        pushVertex(v[col][kk + 1]);
                        pushVertex(v[col + 1][kk]);
                        pushVertex(v[col][kk]);
                    }
                    else
                    {
                        pushVertex(v[col][kk + 1]);
                        pushVertex(v[col + 1][kk + 1]);
                        pushVertex(v[col + 1][kk]);
                    }
                }
            }
        };

        const getVertexByIndex = (index: number): Vector3 =>
        {
            const stride = index * 3;

            return new Vector3(vertices[stride], vertices[stride + 1], vertices[stride + 2]);
        };

        const pushVertex = (vertex: Vector3): void =>
        {
            this.#vertexBuffer.push(vertex.x, vertex.y, vertex.z);
        };

        // 1) subdivide each face
        for (let i = 0; i < indices.length; i += 3)
        {
            subdivide(indices[i], indices[i + 1], indices[i + 2], subdivideDetail);
        }

        // 2) apply radius
        this.#applyRadius(radius);

        // 3) generate UVs
        this.#generateUVs(this.#vertexBuffer, this.#uvBuffer);

        return new Float32Array(this.#vertexBuffer);
    }

    #applyRadius(radius: number): void
    {
        const v = new Vector3();
        for (let i = 0; i < this.#vertexBuffer.length; i += 3)
        {
            v.set(this.#vertexBuffer[i], this.#vertexBuffer[i + 1], this.#vertexBuffer[i + 2]);
            v.normalize().scaleNumber(radius);
            this.#vertexBuffer[i] = v.x;
            this.#vertexBuffer[i + 1] = v.y;
            this.#vertexBuffer[i + 2] = v.z;
        }
    }

    #generateUVs(positions: number[], uvs: number[]): void
    {
        const azimuth = (v: Vector3): number => Math.atan2(v.z, -v.x);
        const inclination = (v: Vector3): number => Math.atan2(-v.y, Math.sqrt(v.x * v.x + v.z * v.z));

        for (let i = 0; i < positions.length; i += 3)
        {
            const v = new Vector3(positions[i], positions[i + 1], positions[i + 2]);
            const u = azimuth(v) / 2 / Math.PI + 0.5;
            const vv = inclination(v) / Math.PI + 0.5;
            uvs.push(u, 1 - vv);
        }

        this.#correctUVs(uvs);

        this.#correctSeam(uvs);
    }

    #correctUVs(uvs: number[]): void
    {
        // 对于位于极点（x=0,z=0）的顶点，重新计算 u 以避免接缝错位
        for (let i = 0, j = 0; i < this.#vertexBuffer.length; i += 3, j += 2)
        {
            const v = new Vector3(this.#vertexBuffer[i], this.#vertexBuffer[i + 1], this.#vertexBuffer[i + 2]);
            if (Math.abs(v.x) < 1e-6 && Math.abs(v.z) < 1e-6)
            {
                const azimuth = Math.atan2(v.z, -v.x);
                const u = azimuth / 2 / Math.PI + 0.5;
                uvs[j] = u;
            }
        }
    }

    #correctSeam(uvs: number[]): void
    {
        // 修复 UV 接缝：每 3 个顶点（一个三角形）检查 u 跨越接缝
        for (let i = 0; i < uvs.length; i += 6)
        {
            const x0 = uvs[i];
            const x1 = uvs[i + 2];
            const x2 = uvs[i + 4];
            const max = Math.max(x0, x1, x2);
            const min = Math.min(x0, x1, x2);
            if (max > 0.9 && min < 0.1)
            {
                if (x0 < 0.2) uvs[i] += 1;
                if (x1 < 0.2) uvs[i + 2] += 1;
                if (x2 < 0.2) uvs[i + 4] += 1;
            }
        }
    }

    #buildUVs(): Float32Array
    {
        // buildPositions 已经填充了 uvBuffer，这里只需读取
        // 但需要确保 buildPositions 已被调用（computed 链路）
        void this.#_positions.value;

        return new Float32Array(this.#uvBuffer);
    }

    #buildIndices(): number[]
    {
        // 非索引化输出（顶点已按三角形顺序展开），生成顺序索引 [0,1,2, 3,4,5, ...]
        const pos = this.#_positions.value;
        const vertexCount = pos.length / 3;
        const indices: number[] = [];
        for (let i = 0; i < vertexCount; i++)
        {
            indices.push(i);
        }

        return indices;
    }

    #buildNormals(): Float32Array
    {
        const r_g = reactive(this.#geometry as unknown as PolyhedronGeometryRuntime);
        const detail = r_g.detail;
        const positions = this.#_positions.value;
        if (positions.length === 0) return new Float32Array(0);

        if (detail === 0)
        {
            // 平面法线（非索引）
            return new Float32Array(geometryUtils.createVertexNormals([], Array.from(positions), true));
        }
        // detail > 0：平滑法线（每顶点法线 = 归一化的位置，因为已投影到球面）
        const normals = new Float32Array(positions.length);
        const v = new Vector3();
        for (let i = 0; i < positions.length; i += 3)
        {
            v.set(positions[i], positions[i + 1], positions[i + 2]).normalize();
            normals[i] = v.x;
            normals[i + 1] = v.y;
            normals[i + 2] = v.z;
        }

        return normals;
    }
}

registerLogic('PolyhedronGeometry', PolyhedronGeometryLogic as unknown as new (data: PolyhedronGeometry) => PolyhedronGeometryLogic);
