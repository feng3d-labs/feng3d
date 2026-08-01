import { Vector3 } from '@feng3d/math';
import type { Shape2 } from '@feng3d/math';
import { Geometry, geometryLogic, GeometryLogic, registerCloneFactory } from 'feng3d';
import { registerLogic, reactive, computed, Computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';

declare module 'feng3d'
{
    export interface GeometryMap
    {
        ShapeGeometry: ShapeGeometry;
    }
}

/**
 * 2D 形状几何体（纯数据接口）。
 *
 * 把 Shape2（2D 轮廓 + 孔洞）三角化为平面网格。对应 three.js ShapeGeometry。
 */
export interface ShapeGeometry extends Geometry
{
    readonly __type__: 'ShapeGeometry';
    /** 2D 形状（含轮廓 + 孔洞） */
    readonly shape: Shape2;
    /** 曲线细分数（默认 12） */
    readonly curveSegments?: number;
}

/**
 * 创建 ShapeGeometryLogic 实例。
 */
export function shapeGeometryLogic(geometry: ShapeGeometry): GeometryLogic
{
    const base = geometryLogic(geometry);

    const writable = geometry as UnReadonly<ShapeGeometry>;
    if (geometry.name === undefined) writable.name = '';
    if (geometry.curveSegments === undefined) writable.curveSegments = 12;

    function buildShape(): { positions: Float32Array; normals: Float32Array; uvs: Float32Array; indices: number[] }
    {
        const g = reactive(geometry);
        const shape = g.shape;
        if (!shape) return { positions: new Float32Array(0), normals: new Float32Array(0), uvs: new Float32Array(0), indices: [] };

        const divisions = g.curveSegments ?? 12;

        // 用 Shape2.triangulate 三角化（返回 {points: number[2N], indices: number[]}）
        const tri = shape.triangulate({ points: [], indices: [] });
        const pts2d = tri.points;
        const idx = tri.indices;

        // 2D 点 → 3D（z=0）+ UV（直接用 xy）
        const positions: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        for (let i = 0; i < pts2d.length; i += 2)
        {
            positions.push(pts2d[i], pts2d[i + 1], 0);
            normals.push(0, 0, 1);
            uvs.push(pts2d[i], pts2d[i + 1]);
        }

        return {
            positions: new Float32Array(positions),
            normals: new Float32Array(normals),
            uvs: new Float32Array(uvs),
            indices: idx,
        };
    }

    const _data = computed(() => buildShape());
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

registerLogic('ShapeGeometry', shapeGeometryLogic);
registerCloneFactory('ShapeGeometry', (src: ShapeGeometry) => ({ ...src }) as ShapeGeometry);
