import { Vector2 } from '@feng3d/math';
import { Geometry, geometryLogic, GeometryLogic } from 'feng3d';
import { registerLogic, reactive, computed, Computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';

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
 * 创建 LatheGeometry logic。
 */
export function latheGeometryLogic(geometry: LatheGeometry): GeometryLogic
{
    const base = geometryLogic(geometry);

    const writable = geometry as UnReadonly<LatheGeometry>;
    if (geometry.name === undefined) writable.name = 'Lathe';
    if (geometry.scaleU === undefined) writable.scaleU = 1;
    if (geometry.scaleV === undefined) writable.scaleV = 1;
    if (geometry.segments === undefined) writable.segments = 12;
    if (geometry.phiStart === undefined) writable.phiStart = 0;
    if (geometry.phiLength === undefined) writable.phiLength = Math.PI * 2;

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
    const _tangents = computed(() => new Float32Array(_positions.value.length / 3 * 3));

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

    function buildPositions(): Float32Array
    {
        const g = reactive(geometry as unknown as LatheGeometryRuntime);
        const points = g.__points;
        const segments = Math.floor(g.segments);
        const phiStart = g.phiStart;
        const phiLength = g.phiLength;
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

    function buildNormals(): Float32Array
    {
        const g = reactive(geometry as unknown as LatheGeometryRuntime);
        const points = g.__points;
        const segments = Math.floor(g.segments);
        const phiStart = g.phiStart;
        const phiLength = g.phiLength;
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

    function buildUVs(): Float32Array
    {
        const g = reactive(geometry as unknown as LatheGeometryRuntime);
        const points = g.__points;
        const segments = Math.floor(g.segments);
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

    function buildIndices(): number[]
    {
        const g = reactive(geometry as unknown as LatheGeometryRuntime);
        const points = g.__points;
        const segments = Math.floor(g.segments);
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

    return base;
}

registerLogic('LatheGeometry', latheGeometryLogic);
