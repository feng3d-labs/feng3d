import { Vector3 } from '@feng3d/math';
import { Geometry, geometryLogic, GeometryLogic } from 'feng3d';
import { registerLogic, reactive, computed, Computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';
import { geometryUtils } from 'feng3d';

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
 * 创建 PolyhedronGeometry logic（多面体基类引擎）。
 *
 * 子类（IcosahedronGeometry 等）通过传入不同的 __vertices/__indices 复用本工厂。
 */
export function polyhedronGeometryLogic(geometry: PolyhedronGeometry): GeometryLogic
{
    const base = geometryLogic(geometry);

    const writable = geometry as UnReadonly<PolyhedronGeometry>;
    if (geometry.name === undefined) writable.name = 'Polyhedron';
    if (geometry.scaleU === undefined) writable.scaleU = 1;
    if (geometry.scaleV === undefined) writable.scaleV = 1;
    if (geometry.radius === undefined) writable.radius = 1;
    if (geometry.detail === undefined) writable.detail = 0;

    const _positions = computed(() => buildPositions());
    const _normals = computed(() => buildNormals());
    const _uvs = computed(() => buildUVs());
    const _indices = computed(() => buildIndices());
    const _colors = computed(() =>
    {
        const pos = _positions.value;
        if (pos.length === 0) return new Float32Array(0);
        const count = pos.length / 3;

        return new Float32Array(count * 4).fill(1);
    });
    const _tangents = computed(() =>
    {
        const positions = Array.from(_positions.value);
        const uvs = Array.from(_uvs.value);

        return new Float32Array(geometryUtils.createVertexTangents(_indices.value, positions, uvs, true));
    });

    base.setAttributes(createAttributes());
    Object.defineProperty(base, 'indices', { get() { return _indices.value; }, enumerable: true, configurable: true });

    function createAttributes(): Record<string, VertexAttribute>
    {
        const computedAttr = (ref: Computed<Float32Array>, format: VertexAttribute['format']): VertexAttribute =>
        {
            const obj: VertexAttribute = { data: new Float32Array(), format };
            Object.defineProperty(obj, 'data', { get() { return ref.value; }, enumerable: true });

            return obj;
        };

        return {
            a_position: computedAttr(_positions, 'float32x3'),
            a_color: computedAttr(_colors, 'float32x4'),
            a_uv: computedAttr(_uvs, 'float32x2'),
            a_normal: computedAttr(_normals, 'float32x3'),
            a_tangent: computedAttr(_tangents, 'float32x3'),
            a_skinIndices: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights: { data: new Float32Array(), format: 'float32x4' },
            a_skinIndices1: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights1: { data: new Float32Array(), format: 'float32x4' },
        };
    }

    // 缓冲区（生成过程共用）
    const vertexBuffer: number[] = [];
    const uvBuffer: number[] = [];

    function buildPositions(): Float32Array
    {
        const g = reactive(geometry as unknown as PolyhedronGeometryRuntime);
        const vertices = g.__vertices;
        const indices = g.__indices;
        const radius = g.radius;
        const detail = g.detail;
        if (!vertices || !indices || vertices.length === 0) return new Float32Array(0);

        // 重置缓冲区
        vertexBuffer.length = 0;
        uvBuffer.length = 0;

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
            vertexBuffer.push(vertex.x, vertex.y, vertex.z);
        };

        // 1) subdivide each face
        for (let i = 0; i < indices.length; i += 3)
        {
            subdivide(indices[i], indices[i + 1], indices[i + 2], subdivideDetail);
        }

        // 2) apply radius
        applyRadius(radius);

        // 3) generate UVs
        generateUVs(vertexBuffer, uvBuffer);

        return new Float32Array(vertexBuffer);
    }

    function applyRadius(radius: number): void
    {
        const v = new Vector3();
        for (let i = 0; i < vertexBuffer.length; i += 3)
        {
            v.set(vertexBuffer[i], vertexBuffer[i + 1], vertexBuffer[i + 2]);
            v.normalize().scaleNumber(radius);
            vertexBuffer[i] = v.x;
            vertexBuffer[i + 1] = v.y;
            vertexBuffer[i + 2] = v.z;
        }
    }

    function generateUVs(positions: number[], uvs: number[]): void
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

        correctUVs(uvs);

        correctSeam(uvs);
    }

    function correctUVs(uvs: number[]): void
    {
        // 对于位于极点（x=0,z=0）的顶点，重新计算 u 以避免接缝错位
        for (let i = 0, j = 0; i < vertexBuffer.length; i += 3, j += 2)
        {
            const v = new Vector3(vertexBuffer[i], vertexBuffer[i + 1], vertexBuffer[i + 2]);
            if (Math.abs(v.x) < 1e-6 && Math.abs(v.z) < 1e-6)
            {
                const azimuth = Math.atan2(v.z, -v.x);
                const u = azimuth / 2 / Math.PI + 0.5;
                uvs[j] = u;
            }
        }
    }

    function correctSeam(uvs: number[]): void
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

    function buildUVs(): Float32Array
    {
        // buildPositions 已经填充了 uvBuffer，这里只需读取
        // 但需要确保 buildPositions 已被调用（computed 链路）
        void _positions.value;

        return new Float32Array(uvBuffer);
    }

    function buildIndices(): number[]
    {
        // 非索引化输出（顶点已按三角形顺序展开），生成顺序索引 [0,1,2, 3,4,5, ...]
        const pos = _positions.value;
        const vertexCount = pos.length / 3;
        const indices: number[] = [];
        for (let i = 0; i < vertexCount; i++)
        {
            indices.push(i);
        }

        return indices;
    }

    function buildNormals(): Float32Array
    {
        const g = reactive(geometry as unknown as PolyhedronGeometryRuntime);
        const detail = g.detail;
        const positions = _positions.value;
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

    return base;
}

registerLogic('PolyhedronGeometry', polyhedronGeometryLogic);
