import type { Shape2 } from '@feng3d/math';
import { Geometry, GeometryLogic, computedAttr, createGeometryLogicState, geometryBeforeRender, geometryBounding, geometryRaycast } from 'feng3d';
import { registerLogic, reactive, computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        ShapeGeometry: ShapeGeometryLogic;
    }
}

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
 * ShapeGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic}，用单一 computed 三角化 Shape2，
 * 派生 positions/normals/uvs/indices 各属性。
 */
export interface ShapeGeometryLogic extends GeometryLogic
{
}

/**
 * 工厂函数：ShapeGeometryLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 几何数据（raw）
 */
export function shapeGeometryLogic(data: ShapeGeometry): ShapeGeometryLogic
{
    // 默认值填充（工厂内完成，创建完成即已填充）
    const writable = data as UnReadonly<ShapeGeometry>;
    if (data.name === undefined) writable.name = '';
    if (data.curveSegments === undefined) writable.curveSegments = 12;

    function buildShape(): { positions: Float32Array; normals: Float32Array; uvs: Float32Array; indices: number[] }
    {
        const r_g = reactive(data);
        const shape = r_g.shape;
        if (!shape) return { positions: new Float32Array(0), normals: new Float32Array(0), uvs: new Float32Array(0), indices: [] };


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

    // 三角化结果（单一 computed），各属性从中派生
    const shapeDataComputed = computed(() => buildShape());
    const positionsComputed = computed(() => shapeDataComputed.value.positions);
    const normalsComputed = computed(() => shapeDataComputed.value.normals);
    const uvsComputed = computed(() => shapeDataComputed.value.uvs);
    const indicesComputed = computed(() => shapeDataComputed.value.indices);
    const colorsComputed = computed(() =>
    {
        const n = positionsComputed.value.length / 3;
        const d = new Float32Array(n * 4);
        d.fill(1);

        return d;
    });
    const tangentsComputed = computed(() => new Float32Array(positionsComputed.value.length));

    // attributes: data 由 computed getter 驱动
    const attrTable: VertexAttributes = {
        a_position: computedAttr(positionsComputed, 'float32x3'),
        a_color: computedAttr(colorsComputed, 'float32x4'),
        a_uv: computedAttr(uvsComputed, 'float32x2'),
        a_normal: computedAttr(normalsComputed, 'float32x3'),
        a_tangent: computedAttr(tangentsComputed, 'float32x3'),
    };
    const state = createGeometryLogicState(() => attrTable, () => indicesComputed.value, data);

    const logic: ShapeGeometryLogic = {
        get vertices() { return attrTable; },
        get vertexIndices() { return indicesComputed.value; },
        get indices() { return state.indices.value; },
        get draw() { return state.draw.value; },
        get bounding() { return geometryBounding(logic); },
        raycast(ray, shortestCollisionDistance, cullFace) { return geometryRaycast(logic, ray, shortestCollisionDistance, cullFace); },
        beforeRender(renderObject) { geometryBeforeRender(logic, renderObject); },
    };

    return logic;
}
registerLogic('ShapeGeometry', shapeGeometryLogic);
