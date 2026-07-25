import { Vector3 } from '@feng3d/math';
import { Geometry, geometryLogic, GeometryLogic, registerCloneFactory, registerDefaultGeometryFactory } from '../geometry/Geometry';
import { registerLogic, reactive, computed, Computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        TorusKnotGeometry: TorusKnotGeometry;
    }
}

/**
 * 环面纽结几何体（纯数据接口）。
 *
 * 沿 (p,q) 纽结曲线扫描圆管。移植自 three.js TorusKnotGeometry。
 */
export interface TorusKnotGeometry extends Geometry
{
    readonly __type__: 'TorusKnotGeometry';
    /** 整体半径，默认 1 */
    readonly radius: number;
    /** 管半径，默认 0.4 */
    readonly tube: number;
    /** 沿曲线的分段数，默认 64 */
    readonly tubularSegments: number;
    /** 管截面的分段数，默认 8 */
    readonly radialSegments: number;
    /** 绕对称轴的缠绕数，默认 2 */
    readonly p: number;
    /** 绕圆的缠绕数，默认 3 */
    readonly q: number;
}

/**
 * 在纽结曲线上计算位置（移植自 three.js calculatePositionOnCurve）。
 */
function calculatePositionOnCurve(u: number, p: number, q: number, radius: number, position: Vector3): Vector3
{
    const cu = Math.cos(u);
    const su = Math.sin(u);
    const quOverP = q / p * u;
    const cs = Math.cos(quOverP);

    position.x = radius * (2 + cs) * 0.5 * cu;
    position.y = radius * (2 + cs) * su * 0.5;
    position.z = radius * Math.sin(quOverP) * 0.5;

    return position;
}

/**
 * 创建 TorusKnotGeometry logic。
 */
export function torusKnotGeometryLogic(geometry: TorusKnotGeometry): GeometryLogic
{
    const base = geometryLogic(geometry);

    const writable = geometry as UnReadonly<TorusKnotGeometry>;
    if (geometry.name === undefined) writable.name = 'TorusKnot';
    if (geometry.scaleU === undefined) writable.scaleU = 1;
    if (geometry.scaleV === undefined) writable.scaleV = 1;
    if (geometry.radius === undefined) writable.radius = 1;
    if (geometry.tube === undefined) writable.tube = 0.4;
    if (geometry.tubularSegments === undefined) writable.tubularSegments = 64;
    if (geometry.radialSegments === undefined) writable.radialSegments = 8;
    if (geometry.p === undefined) writable.p = 2;
    if (geometry.q === undefined) writable.q = 3;

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
        const g = reactive(geometry);
        const radius = g.radius;
        const tube = g.tube;
        const tubularSegments = Math.floor(g.tubularSegments);
        const radialSegments = Math.floor(g.radialSegments);
        const p = g.p;
        const q = g.q;

        const positions: number[] = [];
        const P1 = new Vector3();
        const P2 = new Vector3();
        const T = new Vector3();
        const N = new Vector3();
        const B = new Vector3();

        for (let i = 0; i <= tubularSegments; ++i)
        {
            const u = i / tubularSegments * p * Math.PI * 2;
            calculatePositionOnCurve(u, p, q, radius, P1);
            calculatePositionOnCurve(u + 0.01, p, q, radius, P2);

            // Frenet-like 坐标系：T = P2-P1, N = P2+P1, B = T×N, N = B×T
            P2.subTo(P1, T);
            P2.addTo(P1, N);
            T.crossTo(N, B);
            B.crossTo(T, N);
            B.normalize();
            N.normalize();

            for (let j = 0; j <= radialSegments; ++j)
            {
                const v = j / radialSegments * Math.PI * 2;
                const cx = -tube * Math.cos(v);
                const cy = tube * Math.sin(v);

                positions.push(
                    P1.x + cx * N.x + cy * B.x,
                    P1.y + cx * N.y + cy * B.y,
                    P1.z + cx * N.z + cy * B.z,
                );
            }
        }

        // 同时缓存每个管截面中心点 P1，供法线计算用
        // 这里 positions 已含管壁顶点，法线在 buildNormals 中重算
        return new Float32Array(positions);
    }

    function buildNormals(): Float32Array
    {
        const g = reactive(geometry);
        const radius = g.radius;
        const tube = g.tube;
        const tubularSegments = Math.floor(g.tubularSegments);
        const radialSegments = Math.floor(g.radialSegments);
        const p = g.p;
        const q = g.q;

        const normals: number[] = [];
        const P1 = new Vector3();
        const P2 = new Vector3();
        const T = new Vector3();
        const N = new Vector3();
        const B = new Vector3();
        const vertex = new Vector3();

        for (let i = 0; i <= tubularSegments; ++i)
        {
            const u = i / tubularSegments * p * Math.PI * 2;
            calculatePositionOnCurve(u, p, q, radius, P1);
            calculatePositionOnCurve(u + 0.01, p, q, radius, P2);
            P2.subTo(P1, T);
            P2.addTo(P1, N);
            T.crossTo(N, B);
            B.crossTo(T, N);
            B.normalize();
            N.normalize();

            for (let j = 0; j <= radialSegments; ++j)
            {
                const v = j / radialSegments * Math.PI * 2;
                const cx = -tube * Math.cos(v);
                const cy = tube * Math.sin(v);
                vertex.set(
                    P1.x + cx * N.x + cy * B.x,
                    P1.y + cx * N.y + cy * B.y,
                    P1.z + cx * N.z + cy * B.z,
                );
                vertex.sub(P1).normalize();
                normals.push(vertex.x, vertex.y, vertex.z);
            }
        }

        return new Float32Array(normals);
    }

    function buildUVs(): Float32Array
    {
        const g = reactive(geometry);
        const tubularSegments = Math.floor(g.tubularSegments);
        const radialSegments = Math.floor(g.radialSegments);

        const uvs: number[] = [];
        for (let i = 0; i <= tubularSegments; ++i)
        {
            for (let j = 0; j <= radialSegments; ++j)
            {
                uvs.push(i / tubularSegments, j / radialSegments);
            }
        }

        return new Float32Array(uvs);
    }

    function buildIndices(): number[]
    {
        const g = reactive(geometry);
        const tubularSegments = Math.floor(g.tubularSegments);
        const radialSegments = Math.floor(g.radialSegments);

        const indices: number[] = [];
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

        return indices;
    }

    return base;
}

registerLogic('TorusKnotGeometry', torusKnotGeometryLogic);
registerCloneFactory('TorusKnotGeometry', (src: TorusKnotGeometry) => ({ ...src }) as TorusKnotGeometry);
registerDefaultGeometryFactory('TorusKnot', () => ({ __type__: 'TorusKnotGeometry' }));
