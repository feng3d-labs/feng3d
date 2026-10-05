import type { Shape2 } from '@feng3d/math';
import { Geometry, GeometryLogic, computedAttr, geometryLogicProto, setupGeometryLogicState, type GeometryLogicState } from 'feng3d';
import { registerLogic, reactive, computed, UnReadonly, createLogicProto, type Computed } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        ExtrudeGeometry: ExtrudeGeometryLogic;
    }
}

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
 * ExtrudeGeometryLogic 逻辑类。
 *
 * 挤出算法（简化版，无 bevel）：
 * 1. 用 Shape2.triangulate 三角化顶面（z=0）和底面（z=depth，翻转法线）
 * 2. 沿轮廓边建侧面四边形（每边 2 三角形）
 */
export interface ExtrudeGeometryLogic extends GeometryLogic
{
}

/** ExtrudeGeometryLogic 实例的内部状态（不进公开接口，工厂装配时写入） */
interface ExtrudeGeometryLogicState extends GeometryLogicState
{
    _attrTable: VertexAttributes;
    _indicesComputed: Computed<number[]>;
}

/** ExtrudeGeometryLogic 的共享原型：继承 Geometry 基类实现，覆写 vertices / vertexIndices */
const extrudeGeometryLogicProto = createLogicProto<ExtrudeGeometryLogic>(geometryLogicProto, {
    vertices: {
        get: function (this: ExtrudeGeometryLogic & ExtrudeGeometryLogicState): VertexAttributes { return this._attrTable; },
    },
    /** indices 由 computed 驱动（覆写基类 getter） */
    vertexIndices: {
        get: function (this: ExtrudeGeometryLogic & ExtrudeGeometryLogicState): number[] { return this._indicesComputed.value; },
    },
});

/**
 * 工厂函数：ExtrudeGeometryLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 几何数据（raw）
 */
export function extrudeGeometryLogic(data: ExtrudeGeometry): ExtrudeGeometryLogic
{
    // 默认值填充（工厂内完成，创建完成即已填充）
    const writable = data as UnReadonly<ExtrudeGeometry>;
    if (data.name === undefined) writable.name = '';
    if (data.depth === undefined) writable.depth = 1;
    if (data.curveSegments === undefined) writable.curveSegments = 12;
    if (data.steps === undefined) writable.steps = 1;

    // 响应式参数访问器（默认值已填充，直接读取）
    const shapes = (): Shape2 | Shape2[] => reactive(data).shapes;
    const depth = (): number => reactive(data).depth ?? 1;
    const curveSegments = (): number => reactive(data).curveSegments ?? 12;

    function buildExtrude(): { positions: Float32Array; normals: Float32Array; uvs: Float32Array; indices: number[] }
    {
        const shapesValue = shapes();
        if (!shapesValue) return { positions: new Float32Array(0), normals: new Float32Array(0), uvs: new Float32Array(0), indices: [] };

        const depthValue = depth();
        const divisions = curveSegments();
        const shapeList = Array.isArray(shapesValue) ? shapesValue : [shapesValue];

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
                positions.push(pts2d[i], pts2d[i + 1], depthValue);
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
                positions.push(a.x, a.y, 0, b.x, b.y, 0, b.x, b.y, depthValue, a.x, a.y, depthValue);
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

    const _extrude = computed(() => buildExtrude());
    const _positions = computed(() => _extrude.value.positions);
    const _normals = computed(() => _extrude.value.normals);
    const _uvs = computed(() => _extrude.value.uvs);
    const _indicesComputed = computed(() => _extrude.value.indices);
    const _colors = computed(() =>
    {
        const n = _positions.value.length / 3;
        const d = new Float32Array(n * 4);
        d.fill(1);

        return d;
    });
    const _tangents = computed(() => new Float32Array(_positions.value.length));

    const logic = setupGeometryLogicState(Object.create(extrudeGeometryLogicProto) as ExtrudeGeometryLogic & ExtrudeGeometryLogicState, data);
    // attributes: data 由 computed getter 驱动
    logic._attrTable = {
        a_position: computedAttr(_positions, 'float32x3'),
        a_color: computedAttr(_colors, 'float32x4'),
        a_uv: computedAttr(_uvs, 'float32x2'),
        a_normal: computedAttr(_normals, 'float32x3'),
        a_tangent: computedAttr(_tangents, 'float32x3'),
    };
    logic._indicesComputed = _indicesComputed;

    return logic;
}
registerLogic('ExtrudeGeometry', extrudeGeometryLogic);