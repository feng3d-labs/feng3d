import { Color4 as Color4Math, Vector2, Vector3, Vector3Like } from '@feng3d/math';
import type { Color4 } from '../core/Color4';
import { Geometry, geometryLogic, GeometryLogic } from './Geometry';
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
    readonly position?: Vector3Like;
    readonly color?: Color4;
    readonly normal?: Vector3Like;
    readonly uv?: Vector2;
}

/**
 * 点几何体（纯数据接口）。
 *
 * 通过 {@link points} 列表声明点位，geometryLogic 用 computed 按 points 懒生成
 * positions/uvs/normals/colors/indices。points 变化时 computed 自动失效重算。
 *
 * 每个点扩展成 4 顶点的 billboard 四边形（2 三角形），a_uv 承载角偏移（-1..1），
 * 供 PointMaterial 在屏幕空间按 u_PointSize 展开成可变尺寸的方形点。WebGPU 的
 * point-list 拓扑固定 1 像素、不支持顶点着色器输出点尺寸，故用 triangle-list 画
 * 四边形模拟（与 three.js WebGPU 后端 Points 渲染一致）。
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

    const _attrTable = createAttributes();
    Object.defineProperty(base, 'vertices', { get() { return _attrTable; }, enumerable: true, configurable: true });

    // indices 由 computed 驱动（覆盖基类 getter）
    Object.defineProperty(base, 'vertexIndices', { get() { return _indicesComputed.value; }, enumerable: true, configurable: true });

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
    //
    // 每个点扩展成一个面向相机的四边形（4 顶点 × 2 三角形），用 billboard 方式渲染可变
    // 尺寸的点。WebGPU 的 point-list 拓扑固定 1 像素、不支持顶点着色器输出点尺寸，故用
    // triangle-list 画四边形模拟（与 three.js WebGPU 后端 Points 渲染一致）。
    //
    // 顶点布局（每点 4 顶点）：
    //   角偏移 corner（存入 a_uv，范围 [-1,1]²）：左下(-1,-1) 右下(1,-1) 右上(1,1) 左上(-1,1)
    //   索引（每点 6 个，2 三角形）：base+0, base+1, base+2,  base+0, base+2, base+3

    /** 4 个角的偏移（左下/右下/右上/左上），存入 a_uv 供顶点着色器展开四边形 */
    const CORNERS: ReadonlyArray<readonly [number, number]> = [
        [-1, -1], [1, -1], [1, 1], [-1, 1],
    ];

    function buildPositions(): Float32Array
    {
        const g = reactive(geometry);
        const numPoints = Math.max(1, g.points.length);
        const data: number[] = [];
        for (let i = 0; i < numPoints; i++)
        {
            const element = g.points[i];
            const position = (element && element.position) || Vector3.ZERO;
            // 每点重复 4 顶点（四边形 4 角共享同一点位置，由着色器按 corner 展开）
            for (let c = 0; c < 4; c++)
            {
                data.push(position.x, position.y, position.z);
            }
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
            for (let c = 0; c < 4; c++)
            {
                data.push(normal.x, normal.y, normal.z);
            }
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
            // a_uv 复用：优先用 PointInfo.uv 作为四边形角偏移的基准（默认 corner）。
            // 这里直接写死 4 个角的偏移（-1..1），着色器按此在屏幕空间展开四边形。
            for (let c = 0; c < 4; c++)
            {
                const corner = CORNERS[c];
                data.push(corner[0], corner[1]);
            }
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
            for (let c = 0; c < 4; c++)
            {
                data.push(color.r, color.g, color.b, color.a);
            }
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
            const base = i * 4;
            // 两个三角形：base+0, base+1, base+2  与  base+0, base+2, base+3
            indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }

        return indices;
    }

    return base;
}

registerLogic('PointGeometry', pointGeometryLogic);
