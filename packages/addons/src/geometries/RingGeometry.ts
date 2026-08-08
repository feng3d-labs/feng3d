import { Geometry, geometryLogic, GeometryLogic, registerDefaultGeometryFactory } from 'feng3d';
import { registerLogic, reactive, computed, Computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';
import { geometryUtils } from 'feng3d';

declare module 'feng3d'
{
    export interface GeometryMap
    {
        RingGeometry: RingGeometry;
    }
}

/**
 * 圆环几何体（纯数据接口）。
 *
 * XY 平面圆环（内圆挖空），法线 +Z。移植自 three.js RingGeometry。
 */
export interface RingGeometry extends Geometry
{
    readonly __type__: 'RingGeometry';
    /** 内半径，默认 0.5 */
    readonly innerRadius: number;
    /** 外半径，默认 1 */
    readonly outerRadius: number;
    /** 圆周分段数（≥3），默认 32 */
    readonly thetaSegments: number;
    /** 径向分段数（≥1），默认 1 */
    readonly phiSegments: number;
    /** 起始角（弧度），默认 0 */
    readonly thetaStart: number;
    /** 扫掠角（弧度），默认 2π */
    readonly thetaLength: number;
}

/**
 * 创建 RingGeometry logic。
 */
export function ringGeometryLogic(geometry: RingGeometry): GeometryLogic
{
    const base = geometryLogic(geometry);

    const writable = geometry as UnReadonly<RingGeometry>;
    if (geometry.name === undefined) writable.name = 'Ring';
    if (geometry.scaleU === undefined) writable.scaleU = 1;
    if (geometry.scaleV === undefined) writable.scaleV = 1;
    if (geometry.innerRadius === undefined) writable.innerRadius = 0.5;
    if (geometry.outerRadius === undefined) writable.outerRadius = 1;
    if (geometry.thetaSegments === undefined) writable.thetaSegments = 32;
    if (geometry.phiSegments === undefined) writable.phiSegments = 1;
    if (geometry.thetaStart === undefined) writable.thetaStart = 0;
    if (geometry.thetaLength === undefined) writable.thetaLength = Math.PI * 2;

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

    const _attrTable = createAttributes();
    Object.defineProperty(base, 'attributes', { get() { return _attrTable; }, enumerable: true, configurable: true });
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
        const innerRadius = g.innerRadius;
        const outerRadius = g.outerRadius;
        const thetaSegments = Math.max(3, g.thetaSegments);
        const phiSegments = Math.max(1, g.phiSegments);
        const thetaStart = g.thetaStart;
        const thetaLength = g.thetaLength;

        const positions: number[] = [];
        let radius = innerRadius;
        const radiusStep = (outerRadius - innerRadius) / phiSegments;

        for (let j = 0; j <= phiSegments; j++)
        {
            for (let i = 0; i <= thetaSegments; i++)
            {
                const segment = thetaStart + i / thetaSegments * thetaLength;
                positions.push(radius * Math.cos(segment), radius * Math.sin(segment), 0);
            }
            radius += radiusStep;
        }

        return new Float32Array(positions);
    }

    function buildNormals(): Float32Array
    {
        const g = reactive(geometry);
        const thetaSegments = Math.max(3, g.thetaSegments);
        const phiSegments = Math.max(1, g.phiSegments);
        const count = (thetaSegments + 1) * (phiSegments + 1);
        const normals: number[] = [];
        for (let i = 0; i < count; i++)
        {
            normals.push(0, 0, 1); // 法线 +Z
        }

        return new Float32Array(normals);
    }

    function buildUVs(): Float32Array
    {
        const g = reactive(geometry);
        const outerRadius = g.outerRadius;
        const thetaSegments = Math.max(3, g.thetaSegments);
        const phiSegments = Math.max(1, g.phiSegments);
        const thetaStart = g.thetaStart;
        const thetaLength = g.thetaLength;

        const uvs: number[] = [];
        let radius = g.innerRadius;
        const radiusStep = (g.outerRadius - g.innerRadius) / phiSegments;
        for (let j = 0; j <= phiSegments; j++)
        {
            for (let i = 0; i <= thetaSegments; i++)
            {
                const segment = thetaStart + i / thetaSegments * thetaLength;
                const x = radius * Math.cos(segment);
                const y = radius * Math.sin(segment);
                uvs.push((x / outerRadius + 1) / 2, (y / outerRadius + 1) / 2);
            }
            radius += radiusStep;
        }

        return new Float32Array(uvs);
    }

    function buildIndices(): number[]
    {
        const g = reactive(geometry);
        const thetaSegments = Math.max(3, g.thetaSegments);
        const phiSegments = Math.max(1, g.phiSegments);
        const indices: number[] = [];
        for (let j = 0; j < phiSegments; j++)
        {
            const thetaSegmentLevel = j * (thetaSegments + 1);
            for (let i = 0; i < thetaSegments; i++)
            {
                const segment = i + thetaSegmentLevel;
                const a = segment;
                const b = segment + thetaSegments + 1;
                const c = segment + thetaSegments + 2;
                const d = segment + 1;
                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        return indices;
    }

    return base;
}

registerLogic('RingGeometry', ringGeometryLogic);
registerDefaultGeometryFactory('Ring', () => ({ __type__: 'RingGeometry' } as RingGeometry));
