import { Geometry, geometryLogic, GeometryLogic, registerCloneFactory, registerDefaultGeometryFactory } from '../geometry/Geometry';
import { registerLogic, reactive, computed, Computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';
import { geometryUtils } from '../geometry/GeometryUtils';

declare module '../geometry/Geometry'
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
 * 创建 CircleGeometry logic。
 */
export function circleGeometryLogic(geometry: CircleGeometry): GeometryLogic
{
    const base = geometryLogic(geometry);

    const writable = geometry as UnReadonly<CircleGeometry>;
    if (geometry.name === undefined) writable.name = 'Circle';
    if (geometry.scaleU === undefined) writable.scaleU = 1;
    if (geometry.scaleV === undefined) writable.scaleV = 1;
    if (geometry.radius === undefined) writable.radius = 0.5;
    if (geometry.segments === undefined) writable.segments = 32;
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
        const segments = Math.max(3, g.segments);
        const thetaStart = g.thetaStart;
        const thetaLength = g.thetaLength;

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

    function buildNormals(): Float32Array
    {
        const g = reactive(geometry);
        const segments = Math.max(3, g.segments);
        const count = (segments + 2); // 中心 + segments+1 个周边
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
        const radius = g.radius;
        const segments = Math.max(3, g.segments);
        const thetaStart = g.thetaStart;
        const thetaLength = g.thetaLength;

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

    function buildIndices(): number[]
    {
        const g = reactive(geometry);
        const segments = Math.max(3, g.segments);
        const indices: number[] = [];
        for (let i = 1; i <= segments; i++)
        {
            indices.push(i, i + 1, 0); // CCW（从 +Z 看）
        }

        return indices;
    }

    return base;
}

registerLogic('CircleGeometry', circleGeometryLogic);
registerCloneFactory('CircleGeometry', (src: CircleGeometry) => ({ ...src }) as CircleGeometry);
registerDefaultGeometryFactory('Circle', () => ({ __type__: 'CircleGeometry' }));
