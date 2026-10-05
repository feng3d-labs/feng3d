import { vec3Copy, vec3NormalizeThickness, Vector3Like } from '@feng3d/math';
import type { Curve } from '@feng3d/math';
import { Geometry, GeometryLogic, computedAttr, createGeometryLogicState, geometryBeforeRender, geometryBounding, geometryRaycast } from 'feng3d';
import { registerLogic, reactive, computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        TubeGeometry: TubeGeometryLogic;
    }
}

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
    readonly path: Curve<Vector3Like>;
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
 * TubeGeometryLogic 逻辑接口。
 *
 * 继承 {@link GeometryLogic}，沿 path 用 Frenet 坐标系挤出管道网格
 *（positions/normals/uvs/indices，computed 懒求值）。
 */
export interface TubeGeometryLogic extends GeometryLogic
{
}

/**
 * 工厂函数：TubeGeometryLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 几何数据（raw）
 */
export function tubeGeometryLogic(data: TubeGeometry): TubeGeometryLogic
{
    const writable = data as UnReadonly<TubeGeometry>;
    if (data.name === undefined) writable.name = '';
    if (data.tubularSegments === undefined) writable.tubularSegments = 64;
    if (data.radius === undefined) writable.radius = 1;
    if (data.radialSegments === undefined) writable.radialSegments = 8;
    if (data.closed === undefined) writable.closed = false;

    const geometry = data;

    function buildTube(): { positions: Float32Array; normals: Float32Array; uvs: Float32Array; indices: number[] }
    {
        const r_g = reactive(geometry);
        const path = r_g.path;
        const tubularSegments = r_g.tubularSegments;
        const radius = r_g.radius;
        const radialSegments = r_g.radialSegments;
        const closed = r_g.closed;

        if (!path) return { positions: new Float32Array(0), normals: new Float32Array(0), uvs: new Float32Array(0), indices: [] };

        const frames = path.computeFrenetFrames(tubularSegments, closed);
        const normals = frames.normals;
        const binormals = frames.binormals;

        const positions: number[] = [];
        const normalsArr: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];

        const vertex = { x: 0, y: 0, z: 0 };
        const normal = { x: 0, y: 0, z: 0 };
        const uv = { x: 0, y: 0 };
        const P = { x: 0, y: 0, z: 0 };

        for (let i = 0; i <= tubularSegments; i++)
        {
            const u = i / tubularSegments;
            vec3Copy(path.getPointAt(u, { x: 0, y: 0, z: 0 }), P);

            for (let j = 0; j <= radialSegments; j++)
            {
                const v = j / radialSegments * Math.PI * 2;
                const sin = Math.sin(v);
                const cos = -Math.cos(v);

                normal.x = cos * normals[i].x + sin * binormals[i].x;
                normal.y = cos * normals[i].y + sin * binormals[i].y;
                normal.z = cos * normals[i].z + sin * binormals[i].z;
                vec3NormalizeThickness(normal, 1, normal);

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

    // 挤出结果（单一 computed），各属性从中派生
    const tubeData = computed(() => buildTube());
    const positionsComputed = computed(() => tubeData.value.positions);
    const normalsComputed = computed(() => tubeData.value.normals);
    const uvsComputed = computed(() => tubeData.value.uvs);
    const indicesComputed = computed(() => tubeData.value.indices);
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

    const logic: TubeGeometryLogic = {
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

registerLogic('TubeGeometry', tubeGeometryLogic);
