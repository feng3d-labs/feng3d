import { Color4 as Color4Math, Vector2, Vector3 } from '@feng3d/math';
import type { Color4 } from '../core/Color4';
import { Geometry, geometryLogic, GeometryLogic, registerCloneFactory } from './Geometry';
import { registerLogic, reactive, computed, Computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';

declare module './Geometry'
{
    export interface GeometryMap
    {
        PointGeometry: PointGeometry;
    }
}

/**
 * 点信息
 */
export interface PointInfo
{
    readonly position?: Vector3;
    readonly color?: Color4;
    readonly normal?: Vector3;
    readonly uv?: Vector2;
}

/**
 * 点几何体（纯数据接口）。
 *
 * 通过 {@link points} 列表声明点位，geometryLogic 用 computed 按 points 懒生成
 * positions/uvs/normals/colors/indices。points 变化时 computed 自动失效重算。
 */
export interface PointGeometry extends Geometry
{
    readonly __type__: 'PointGeometry';
    /** 点数据列表 */
    readonly points: PointInfo[];
}

// PointGeometry 默认值由 pointGeometryLogic 工厂顶部处理（见下）

/**
 * 创建 PointGeometryLogic 实例（函数式实现）。
 *
 * 组合 {@link geometryLogic}，用 computed 按 points 懒生成
 * positions/uvs/normals/colors/indices。points 变化时 computed 自动失效重算。
 */
export function pointGeometryLogic(geometry: PointGeometry): GeometryLogic
{
    // 组合基座
    const base = geometryLogic(geometry);

    // 默认值（缺失字段单独赋值）
    const writable = geometry as UnReadonly<PointGeometry>;
    if (geometry.name === undefined) writable.name = '';
    if (geometry.scaleU === undefined) writable.scaleU = 1;
    if (geometry.scaleV === undefined) writable.scaleV = 1;
    if (geometry.points === undefined) writable.points = [];

    const _positions = computed(() => buildPositions());
    const _normals = computed(() => buildNormals());
    const _uvs = computed(() => buildUVs());
    const _colors = computed(() => buildColors());
    const _indicesComputed = computed(() => buildIndices());

    base.setAttributes(createAttributes());

    // indices 由 computed 驱动（覆盖基类 getter）
    Object.defineProperty(base, 'indices', { get() { return _indicesComputed.value; }, enumerable: true, configurable: true });

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
            a_tangent: { data: new Float32Array(), format: 'float32x3' },
            a_skinIndices: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights: { data: new Float32Array(), format: 'float32x4' },
            a_skinIndices1: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights1: { data: new Float32Array(), format: 'float32x4' },
        };
    }

    // ---- 顶点构建（直接返回 Float32Array，内部 reactive 建立依赖） ----

    function buildPositions(): Float32Array
    {
        const g = reactive(geometry);
        const numPoints = Math.max(1, g.points.length);
        const data: number[] = [];
        for (let i = 0; i < numPoints; i++)
        {
            const element = g.points[i];
            const position = (element && element.position) || Vector3.ZERO;
            data.push(position.x, position.y, position.z);
        }

        return new Float32Array(data);
    }

    function buildNormals(): Float32Array
    {
        const g = reactive(geometry);
        const numPoints = Math.max(1, g.points.length);
        const data: number[] = [];
        for (let i = 0; i < numPoints; i++)
        {
            const element = g.points[i];
            const normal = (element && element.normal) || Vector3.ZERO;
            data.push(normal.x, normal.y, normal.z);
        }

        return new Float32Array(data);
    }

    function buildUVs(): Float32Array
    {
        const g = reactive(geometry);
        const numPoints = Math.max(1, g.points.length);
        const data: number[] = [];
        for (let i = 0; i < numPoints; i++)
        {
            const element = g.points[i];
            const uv = (element && element.uv) || Vector2.zero;
            data.push(uv.x, uv.y);
        }

        return new Float32Array(data);
    }

    function buildColors(): Float32Array
    {
        const g = reactive(geometry);
        const numPoints = Math.max(1, g.points.length);
        const data: number[] = [];
        for (let i = 0; i < numPoints; i++)
        {
            const element = g.points[i];
            const color = (element && element.color) || Color4Math.WHITE;
            data.push(color.r, color.g, color.b, color.a);
        }

        return new Float32Array(data);
    }

    function buildIndices(): number[]
    {
        const g = reactive(geometry);
        const numPoints = Math.max(1, g.points.length);
        const indices: number[] = [];
        for (let i = 0; i < numPoints; i++)
        {
            indices[i] = i;
        }

        return indices;
    }

    return base;
}

registerLogic('PointGeometry', pointGeometryLogic);
registerCloneFactory('PointGeometry', (src: PointGeometry) => ({ ...src }) as PointGeometry);
