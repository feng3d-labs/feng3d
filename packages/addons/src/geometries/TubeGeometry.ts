import { Vector2, Vector3 } from '@feng3d/math';
import type { Curve } from '@feng3d/math';
import { Geometry, GeometryLogic } from 'feng3d';
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
 * TubeGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic}，沿 path 用 Frenet 坐标系挤出管道网格
 *（positions/normals/uvs/indices，computed 懒求值）。
 */
export class TubeGeometryLogic extends GeometryLogic
{
    readonly #geometry: TubeGeometry;

    // 挤出结果（单一 computed），各属性从中派生
    readonly #_data = computed(() => this.#buildTube());
    readonly #_positions = computed(() => this.#_data.value.positions);
    readonly #_normals = computed(() => this.#_data.value.normals);
    readonly #_uvs = computed(() => this.#_data.value.uvs);
    readonly #_indices = computed(() => this.#_data.value.indices);
    readonly #_colors = computed(() =>
    {
        const n = this.#_positions.value.length / 3;
        const d = new Float32Array(n * 4);
        d.fill(1);

        return d;
    });
    readonly #_tangents = computed(() => new Float32Array(this.#_positions.value.length));

    // attributes: data 由 computed getter 驱动
    readonly #_attrTable: VertexAttributes = {
        a_position: this.computedAttr(this.#_positions, 'float32x3'),
        a_color: this.computedAttr(this.#_colors, 'float32x4'),
        a_uv: this.computedAttr(this.#_uvs, 'float32x2'),
        a_normal: this.computedAttr(this.#_normals, 'float32x3'),
        a_tangent: this.computedAttr(this.#_tangents, 'float32x3'),
    };

    protected constructor(data: TubeGeometry)
    {
        const writable = data as UnReadonly<TubeGeometry>;
        if (data.name === undefined) writable.name = '';
        if (data.tubularSegments === undefined) writable.tubularSegments = 64;
        if (data.radius === undefined) writable.radius = 1;
        if (data.radialSegments === undefined) writable.radialSegments = 8;
        if (data.closed === undefined) writable.closed = false;

        super(data);
        this.#geometry = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: TubeGeometry): TubeGeometryLogic
    {
        return new TubeGeometryLogic(data);
    }

    override get vertices(): VertexAttributes
    {
        return this.#_attrTable;
    }

    /** indices 由 computed 驱动（覆写基类 getter） */
    override get vertexIndices(): number[]
    {
        return this.#_indices.value;
    }

    #buildTube(): { positions: Float32Array; normals: Float32Array; uvs: Float32Array; indices: number[] }
    {
        const r_g = reactive(this.#geometry);
        const path = r_g.path;
        const tubularSegments = r_g.tubularSegments;
        const radius = r_g.radius;
        const radialSegments = r_g.radialSegments;
        const closed = r_g.closed;

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
}

registerLogic('TubeGeometry', TubeGeometryLogic as unknown as new (data: TubeGeometry) => TubeGeometryLogic);
