import { Vector2, Vector3, Matrix4x4 } from '@feng3d/math';
import type { Curve } from '@feng3d/math';
import { Geometry, geometryLogic, GeometryLogic } from 'feng3d';
import { registerLogic, reactive, computed, Computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';

declare module 'feng3d'
{
    export interface GeometryMap
    {
        TubeGeometry: TubeGeometry;
    }
}

/**
 * 管道几何体（纯数据接口）。
 *
 * 沿 3D 曲线挤出一条管道。用 Frenet 坐标系（切线/法线/副法线）计算管道截面顶点。
 *
 * 对应 three.js src/geometries/TubeGeometry.js。
 */
export interface TubeGeometry extends Geometry
{
    readonly __type__: 'TubeGeometry';
    /** 3D 曲线（需有 getPoint/getTangentAt/computeFrenetFrames） */
    readonly path: Curve<Vector3>;
    /** 管道路径分段数 */
    readonly tubularSegments: number;
    /** 管道半径 */
    readonly radius: number;
    /** 截面径向分段数 */
    readonly radialSegments: number;
    /** 是否闭合 */
    readonly closed: boolean;
}

/**
 * 创建 TubeGeometryLogic 实例。
 *
 * 沿 path 用 Frenet 坐标系挤出管道网格（positions/normals/uvs/indices，computed 懒求值）。
 */
export function tubeGeometryLogic(geometry: TubeGeometry): GeometryLogic
{
    const base = geometryLogic(geometry);

    const writable = geometry as UnReadonly<TubeGeometry>;
    if (geometry.name === undefined) writable.name = '';
    if (geometry.tubularSegments === undefined) writable.tubularSegments = 64;
    if (geometry.radius === undefined) writable.radius = 1;
    if (geometry.radialSegments === undefined) writable.radialSegments = 8;
    if (geometry.closed === undefined) writable.closed = false;

    function buildTube(): { positions: Float32Array; normals: Float32Array; uvs: Float32Array; indices: number[] }
    {
        const g = reactive(geometry);
        const path = g.path;
        const tubularSegments = g.tubularSegments;
        const radius = g.radius;
        const radialSegments = g.radialSegments;
        const closed = g.closed;

        if (!path) return { positions: new Float32Array(0), normals: new Float32Array(0), uvs: new Float32Array(0), indices: [] };

        const frames = path.computeFrenetFrames(tubularSegments, closed);
        const tangents = frames.tangents;
        const normals = frames.normals;
        const binormals = frames.binormals;

        const positions: number[] = [];
        const normalsArr: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];

        const vertex = new Vector3();
        const normal = new Vector3();
        const uv = new Vector2();
        const P = new Vector3();

        for (let i = 0; i <= tubularSegments; i++)
        {
            const u = i / tubularSegments;
            P.copy(path.getPointAt(u, new Vector3()));

            for (let j = 0; j <= radialSegments; j++)
            {
                const v = j / radialSegments * Math.PI * 2;
                const sin = Math.sin(v);
                const cos = -Math.cos(v);

                normal.x = cos * normals[i].x + sin * binormals[i].x;
                normal.y = cos * normals[i].y + sin * binormals[i].y;
                normal.z = cos * normals[i].z + sin * binormals[i].z;
                normal.normalize();

                vertex.x = P.x + radius * normal.x;
                vertex.y = P.y + radius * normal.y;
                vertex.z = P.z + radius * normal.z;

                positions.push(vertex.x, vertex.y, vertex.z);
                normalsArr.push(normal.x, normal.y, normal.z);
                uv.x = u;
                uv.y = v / (Math.PI * 2);
                uvs.push(uv.x, uv.y);
            }
        }

        for (let j = 1; j <= tubularSegments; j++)
        {
            for (let i = 1; i <= radialSegments; i++)
            {
                const a = (radialSegments + 1) * (j - 1) + (i - 1);
                const b = (radialSegments + 1) * j + (i - 1);
                const c = (radialSegments + 1) * j + i;
                const d = (radialSegments + 1) * (j - 1) + i;

                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        return {
            positions: new Float32Array(positions),
            normals: new Float32Array(normalsArr),
            uvs: new Float32Array(uvs),
            indices,
        };
    }

    const _data = computed(() => buildTube());
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

    const _attrTable = createAttributes();
    Object.defineProperty(base, 'vertices', { get() { return _attrTable; }, enumerable: true, configurable: true });
    Object.defineProperty(base, 'vertexIndices', { get() { return _indices.value; }, enumerable: true, configurable: true });

    return base;
}

registerLogic('TubeGeometry', tubeGeometryLogic);
