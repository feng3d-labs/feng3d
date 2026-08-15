import type { Shape2 } from '@feng3d/math';
import { Geometry, GeometryLogic } from 'feng3d';
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
export class ShapeGeometryLogic extends GeometryLogic
{
    readonly #geometry: ShapeGeometry;

    // 三角化结果（单一 computed），各属性从中派生
    readonly #_data = computed(() => this.#buildShape());
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

    protected constructor(data: ShapeGeometry)
    {
        const writable = data as UnReadonly<ShapeGeometry>;
        if (data.name === undefined) writable.name = '';
        if (data.curveSegments === undefined) writable.curveSegments = 12;

        super(data);
        this.#geometry = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: ShapeGeometry): ShapeGeometryLogic
    {
        return new ShapeGeometryLogic(data);
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

    #buildShape(): { positions: Float32Array; normals: Float32Array; uvs: Float32Array; indices: number[] }
    {
        const r_g = reactive(this.#geometry);
        const shape = r_g.shape;
        if (!shape) return { positions: new Float32Array(0), normals: new Float32Array(0), uvs: new Float32Array(0), indices: [] };

        const divisions = r_g.curveSegments ?? 12;

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
}

registerLogic('ShapeGeometry', ShapeGeometryLogic as unknown as new (data: ShapeGeometry) => ShapeGeometryLogic);
