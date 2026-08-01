import { Vector3 } from '@feng3d/math';
import type { Shape2 } from '@feng3d/math';
import { Geometry, geometryLogic, GeometryLogic, registerCloneFactory } from 'feng3d';
import { registerLogic, reactive, computed, Computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';

declare module 'feng3d'
{
    export interface GeometryMap
    {
        ExtrudeGeometry: ExtrudeGeometry;
    }
}

/**
 * 挤出几何体（纯数据接口）。
 *
 * 把 2D Shape2 沿 Z 轴挤出为 3D 实体。简化版（无 bevel 倒角），对应 three.js ExtrudeGeometry。
 */
export interface ExtrudeGeometry extends Geometry
{
    readonly __type__: 'ExtrudeGeometry';
    /** 2D 形状（含轮廓 + 孔洞） */
    readonly shapes: Shape2 | Shape2[];
    /** 挤出深度 */
    readonly depth?: number;
    /** 曲线细分数 */
    readonly curveSegments?: number;
    /** 挤出方向步数（默认 1，大于 1 时中间插入分段） */
    readonly steps?: number;
    /** 是否扭转（默认 false） */
    readonly bevelEnabled?: boolean;
}

/**
 * 创建 ExtrudeGeometryLogic 实例。
 *
 * 挤出算法（简化版，无 bevel）：
 * 1. 用 Shape2.triangulate 三角化顶面（z=0）和底面（z=depth，翻转法线）
 * 2. 沿轮廓边建侧面四边形（每边 2 三角形）
 */
export function extrudeGeometryLogic(geometry: ExtrudeGeometry): GeometryLogic
{
    const base = geometryLogic(geometry);

    const writable = geometry as UnReadonly<ExtrudeGeometry>;
    if (geometry.name === undefined) writable.name = '';
    if (geometry.depth === undefined) writable.depth = 1;
    if (geometry.curveSegments === undefined) writable.curveSegments = 12;
    if (geometry.steps === undefined) writable.steps = 1;

    function buildExtrude(): { positions: Float32Array; normals: Float32Array; uvs: Float32Array; indices: number[] }
    {
        const g = reactive(geometry);
        const shapes = g.shapes;
        if (!shapes) return { positions: new Float32Array(0), normals: new Float32Array(0), uvs: new Float32Array(0), indices: [] };

        const depth = g.depth ?? 1;
        const divisions = g.curveSegments ?? 12;
        const shapeList = Array.isArray(shapes) ? shapes : [shapes];

        const positions: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];

        for (const shape of shapeList)
        {
            // 三角化顶面（z=0）
            const tri = shape.triangulate({ points: [], indices: [] });
            const pts2d = tri.points;
            const triIdx = tri.indices;

            const baseVert = positions.length / 3;

            // 顶面（z=0，法线 +Z）
            for (let i = 0; i < pts2d.length; i += 2)
            {
                positions.push(pts2d[i], pts2d[i + 1], 0);
                normals.push(0, 0, 1);
                uvs.push(pts2d[i], pts2d[i + 1]);
            }
            for (let i = 0; i < triIdx.length; i += 3)
            {
                indices.push(baseVert + triIdx[i], baseVert + triIdx[i + 1], baseVert + triIdx[i + 2]);
            }

            // 底面（z=depth，法线 -Z，翻转索引）
            const botBase = positions.length / 3;
            for (let i = 0; i < pts2d.length; i += 2)
            {
                positions.push(pts2d[i], pts2d[i + 1], depth);
                normals.push(0, 0, -1);
                uvs.push(pts2d[i], pts2d[i + 1]);
            }
            for (let i = 0; i < triIdx.length; i += 3)
            {
                indices.push(botBase + triIdx[i + 2], botBase + triIdx[i + 1], botBase + triIdx[i]);
            }

            // 侧面：沿轮廓边建四边形
            const contour = shape.getPoints(divisions);
            const sideBase = positions.length / 3;
            for (let i = 0; i < contour.length; i++)
            {
                const a = contour[i];
                const b = contour[(i + 1) % contour.length];
                // 计算法线（2D 边的法线 = perp(b-a)）
                const ex = b.x - a.x;
                const ey = b.y - a.y;
                const len = Math.sqrt(ex * ex + ey * ey);
                const nx = len > 0 ? ey / len : 0;
                const ny = len > 0 ? -ex / len : 0;

                const vi = sideBase + i * 4;
                positions.push(a.x, a.y, 0, b.x, b.y, 0, b.x, b.y, depth, a.x, a.y, depth);
                normals.push(nx, ny, 0, nx, ny, 0, nx, ny, 0, nx, ny, 0);
                uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
                indices.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
            }
        }

        return {
            positions: new Float32Array(positions),
            normals: new Float32Array(normals),
            uvs: new Float32Array(uvs),
            indices,
        };
    }

    const _data = computed(() => buildExtrude());
    const _positions = computed(() => _data.value.positions);
    const _normals = computed(() => _data.value.normals);
    const _uvs = computed(() => _data.value.uvs);
    const _indices = computed(() => _data.value.indices);
    const _colors = computed(() =>
    {
        const n = _positions.value.length / 3;
        const d = new Float32Array(n * 4);
        d.fill(1);

        return d;
    });
    const _tangents = computed(() => new Float32Array(_positions.value.length));

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

    base.setAttributes(createAttributes());
    Object.defineProperty(base, 'indices', { get() { return _indices.value; }, enumerable: true, configurable: true });

    return base;
}

registerLogic('ExtrudeGeometry', extrudeGeometryLogic);
registerCloneFactory('ExtrudeGeometry', (src: ExtrudeGeometry) => ({ ...src }) as ExtrudeGeometry);
