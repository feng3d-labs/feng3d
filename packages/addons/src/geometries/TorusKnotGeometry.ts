import { Vector3 } from '@feng3d/math';
import { Geometry, GeometryLogic } from 'feng3d';
import { registerLogic, reactive, computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        TorusKnotGeometry: TorusKnotGeometryLogic;
    }
}

declare module 'feng3d'
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
    /** 整体半径，默认 1（缺失时由工厂填充） */
    readonly radius?: number;
    /** 管半径，默认 0.4（缺失时由工厂填充） */
    readonly tube?: number;
    /** 沿曲线的分段数，默认 64（缺失时由工厂填充） */
    readonly tubularSegments?: number;
    /** 管截面的分段数，默认 8（缺失时由工厂填充） */
    readonly radialSegments?: number;
    /** 绕对称轴的缠绕数，默认 2（缺失时由工厂填充） */
    readonly p?: number;
    /** 绕圆的缠绕数，默认 3（缺失时由工厂填充） */
    readonly q?: number;
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
 * TorusKnotGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic}，每个顶点属性用 computed 独立懒计算，
 * 依赖 radius/tube/tubularSegments/radialSegments/p/q。
 */
export class TorusKnotGeometryLogic extends GeometryLogic
{
    readonly #geometry: TorusKnotGeometry;

    // 每个属性独立 computed，仅在实际被读取时计算
    readonly #_positions = computed(() => this.#buildPositions());
    readonly #_normals = computed(() => this.#buildNormals());
    readonly #_uvs = computed(() => this.#buildUVs());
    readonly #_indices = computed(() => this.#buildIndices());
    readonly #_colors = computed(() =>
    {
        const pos = this.#_positions.value;
        if (pos.length === 0) return new Float32Array(0);
        const count = pos.length / 3;

        return new Float32Array(count * 4).fill(1);
    });
    readonly #_tangents = computed(() => new Float32Array(this.#_positions.value.length / 3 * 3));

    // attributes: data 由 computed getter 驱动
    readonly #_attrTable: VertexAttributes = {
        a_position: this.computedAttr(this.#_positions, 'float32x3'),
        a_color: this.computedAttr(this.#_colors, 'float32x4'),
        a_uv: this.computedAttr(this.#_uvs, 'float32x2'),
        a_normal: this.computedAttr(this.#_normals, 'float32x3'),
        a_tangent: this.computedAttr(this.#_tangents, 'float32x3'),
    };

    protected constructor(data: TorusKnotGeometry)
    {
        const writable = data as UnReadonly<TorusKnotGeometry>;
        if (data.name === undefined) writable.name = 'TorusKnot';
        if (data.scaleU === undefined) writable.scaleU = 1;
        if (data.scaleV === undefined) writable.scaleV = 1;
        if (data.radius === undefined) writable.radius = 1;
        if (data.tube === undefined) writable.tube = 0.4;
        if (data.tubularSegments === undefined) writable.tubularSegments = 64;
        if (data.radialSegments === undefined) writable.radialSegments = 8;
        if (data.p === undefined) writable.p = 2;
        if (data.q === undefined) writable.q = 3;

        super(data);
        this.#geometry = data;
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: TorusKnotGeometry): TorusKnotGeometryLogic
    {
        return new TorusKnotGeometryLogic(data);
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

    #buildPositions(): Float32Array
    {
        const r_g = reactive(this.#geometry);
        const radius = r_g.radius;
        const tube = r_g.tube;
        const tubularSegmentsRaw = r_g.tubularSegments;
        const radialSegmentsRaw = r_g.radialSegments;
        const tubularSegments = Math.floor(tubularSegmentsRaw);
        const radialSegments = Math.floor(radialSegmentsRaw);
        const p = r_g.p;
        const q = r_g.q;

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

    #buildNormals(): Float32Array
    {
        const r_g = reactive(this.#geometry);
        const radius = r_g.radius;
        const tube = r_g.tube;
        const tubularSegmentsRaw = r_g.tubularSegments;
        const radialSegmentsRaw = r_g.radialSegments;
        const tubularSegments = Math.floor(tubularSegmentsRaw);
        const radialSegments = Math.floor(radialSegmentsRaw);
        const p = r_g.p;
        const q = r_g.q;

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

    #buildUVs(): Float32Array
    {
        const r_g = reactive(this.#geometry);
        const tubularSegmentsRaw = r_g.tubularSegments;
        const radialSegmentsRaw = r_g.radialSegments;
        const tubularSegments = Math.floor(tubularSegmentsRaw);
        const radialSegments = Math.floor(radialSegmentsRaw);

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

    #buildIndices(): number[]
    {
        const r_g = reactive(this.#geometry);
        const tubularSegmentsRaw = r_g.tubularSegments;
        const radialSegmentsRaw = r_g.radialSegments;
        const tubularSegments = Math.floor(tubularSegmentsRaw);
        const radialSegments = Math.floor(radialSegmentsRaw);

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
}

registerLogic('TorusKnotGeometry', TorusKnotGeometryLogic as unknown as new (data: TorusKnotGeometry) => TorusKnotGeometryLogic);
