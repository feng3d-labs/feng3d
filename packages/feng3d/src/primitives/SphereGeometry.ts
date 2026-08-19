import { Geometry, GeometryLogic } from '../geometry/Geometry';
import { registerLogic, reactive, computed } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        SphereGeometry: SphereGeometryLogic;
    }
}

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        SphereGeometry: SphereGeometry;
    }
}

/**
 * 球体几何体（纯数据接口）。
 */
export interface SphereGeometry extends Geometry
{
    readonly __type__: 'SphereGeometry';
    /** 球体半径（缺失时由工厂填充默认值） */
    readonly radius?: number;
    /** 横向分割数（缺失时由工厂填充默认值） */
    readonly segmentsW?: number;
    /** 纵向分割数（缺失时由工厂填充默认值） */
    readonly segmentsH?: number;
    /** 是否朝上（缺失时由工厂填充默认值） */
    readonly yUp?: boolean;
}

// SphereGeometry 默认值由 SphereGeometryLogic 内参数访问器处理（见下）

/**
 * SphereGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic}，每个顶点属性用 computed 独立懒计算，
 * 依赖 radius/segmentsW/segmentsH/yUp。
 * 不使用 effect/invalidateGeometry — 参数变化时 computed 自动失效重算。
 */
export class SphereGeometryLogic extends GeometryLogic
{
    // 响应式参数（不修改原始数据，缺失字段通过 ?? 提供默认值）
    readonly #radius = (): number => reactive(this._data as SphereGeometry).radius ?? 0.5;
    readonly #segmentsW = (): number => reactive(this._data as SphereGeometry).segmentsW ?? 16;
    readonly #segmentsH = (): number => reactive(this._data as SphereGeometry).segmentsH ?? 12;
    readonly #yUp = (): boolean => reactive(this._data as SphereGeometry).yUp ?? true;

    // 每个属性独立 computed，仅在实际被读取时计算
    readonly #_positions = computed(() => this.#buildPositions());
    readonly #_normals = computed(() => this.#buildNormals());
    readonly #_tangents = computed(() => this.#buildTangents());
    readonly #_uvs = computed(() => this.#buildUVs());
    readonly #_colors = computed(() =>
    {
        const pos = this.#_positions.value;
        if (pos.length === 0) return new Float32Array(0);
        const count = pos.length / 3;

        return new Float32Array(count * 4).fill(1);
    });
    readonly #_indicesComputed = computed(() => this.#buildIndices());

    // attributes: data 由 computed getter 驱动
    readonly #_attrTable: VertexAttributes = {
        a_position: this.computedAttr(this.#_positions, 'float32x3'),
        a_color: this.computedAttr(this.#_colors, 'float32x4'),
        a_uv: this.computedAttr(this.#_uvs, 'float32x2'),
        a_normal: this.computedAttr(this.#_normals, 'float32x3'),
        a_tangent: this.computedAttr(this.#_tangents, 'float32x3'),
    };

    protected constructor(data: SphereGeometry)
    {
        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: SphereGeometry): SphereGeometryLogic
    {
        return new SphereGeometryLogic(data);
    }

    override get vertices(): VertexAttributes
    {
        return this.#_attrTable;
    }

    /** indices 由 computed 驱动（覆写基类 getter） */
    override get vertexIndices(): number[]
    {
        return this.#_indicesComputed.value;
    }

    // ---- 顶点构建（直接返回 Float32Array，内部 reactive 建立依赖） ----

    #buildPositions(): Float32Array
    {

        const data: number[] = [];

        let startIndex: number; let index = 0;
        let comp1: number; let comp2: number;
        for (let yi = 0; yi <= this.#segmentsH(); ++yi)
        {
            startIndex = index;
            const horangle = Math.PI * yi / this.#segmentsH();
            const z = -this.#radius() * Math.cos(horangle);
            const ringradius = this.#radius() * Math.sin(horangle);

            for (let xi = 0; xi <= this.#segmentsW(); ++xi)
            {
                const verangle = 2 * Math.PI * xi / this.#segmentsW();
                const x = ringradius * Math.cos(verangle);
                const y = ringradius * Math.sin(verangle);

                if (this.#yUp()) { comp1 = -z; comp2 = y; }
                else { comp1 = y; comp2 = z; }

                if (xi === this.#segmentsW())
                {
                    data[index] = data[startIndex];
                    data[index + 1] = data[startIndex + 1];
                    data[index + 2] = data[startIndex + 2];
                }
                else
                {
                    data[index] = x;
                    data[index + 1] = comp1;
                    data[index + 2] = comp2;
                }

                if (xi > 0 && yi > 0)
                {
                    if (yi === this.#segmentsH())
                    {
                        data[index] = data[startIndex];
                        data[index + 1] = data[startIndex + 1];
                        data[index + 2] = data[startIndex + 2];
                    }
                }

                index += 3;
            }
        }

        return new Float32Array(data);
    }

    #buildNormals(): Float32Array
    {

        const data: number[] = [];

        let startIndex: number; let index = 0;
        let comp1: number; let comp2: number;
        for (let yi = 0; yi <= this.#segmentsH(); ++yi)
        {
            startIndex = index;
            const horangle = Math.PI * yi / this.#segmentsH();
            const z = -this.#radius() * Math.cos(horangle);
            const ringradius = this.#radius() * Math.sin(horangle);

            for (let xi = 0; xi <= this.#segmentsW(); ++xi)
            {
                const verangle = 2 * Math.PI * xi / this.#segmentsW();
                const x = ringradius * Math.cos(verangle);
                const y = ringradius * Math.sin(verangle);
                const normLen = 1 / Math.sqrt(x * x + y * y + z * z);

                if (this.#yUp()) { comp1 = -z; comp2 = y; }
                else { comp1 = y; comp2 = z; }

                if (xi === this.#segmentsW())
                {
                    data[index] = data[startIndex] + x * normLen * 0.5;
                    data[index + 1] = data[startIndex + 1] + comp1 * normLen * 0.5;
                    data[index + 2] = data[startIndex + 2] + comp2 * normLen * 0.5;
                }
                else
                {
                    data[index] = x * normLen;
                    data[index + 1] = comp1 * normLen;
                    data[index + 2] = comp2 * normLen;
                }

                if (xi > 0 && yi > 0)
                {
                    if (yi === this.#segmentsH())
                    {
                        data[index] = data[startIndex];
                        data[index + 1] = data[startIndex + 1];
                        data[index + 2] = data[startIndex + 2];
                    }
                }

                index += 3;
            }
        }

        return new Float32Array(data);
    }

    #buildTangents(): Float32Array
    {

        const data: number[] = [];

        let startIndex: number; let index = 0;
        let t1: number; let t2: number;
        for (let yi = 0; yi <= this.#segmentsH(); ++yi)
        {
            startIndex = index;
            const horangle = Math.PI * yi / this.#segmentsH();
            const ringradius = this.#radius() * Math.sin(horangle);

            for (let xi = 0; xi <= this.#segmentsW(); ++xi)
            {
                const verangle = 2 * Math.PI * xi / this.#segmentsW();
                const x = ringradius * Math.cos(verangle);
                const y = ringradius * Math.sin(verangle);
                const tanLen = Math.sqrt(y * y + x * x);

                if (this.#yUp()) { t1 = 0; t2 = tanLen > 0.007 ? x / tanLen : 0; }
                else { t1 = tanLen > 0.007 ? x / tanLen : 0; t2 = 0; }

                if (xi === this.#segmentsW())
                {
                    data[index] = tanLen > 0.007 ? -y / tanLen : 1;
                    data[index + 1] = t1;
                    data[index + 2] = t2;
                }
                else
                {
                    data[index] = tanLen > 0.007 ? -y / tanLen : 1;
                    data[index + 1] = t1;
                    data[index + 2] = t2;
                }

                if (xi > 0 && yi > 0)
                {
                    if (yi === this.#segmentsH())
                    {
                        data[index] = data[startIndex];
                        data[index + 1] = data[startIndex + 1];
                        data[index + 2] = data[startIndex + 2];
                    }
                }

                index += 3;
            }
        }

        return new Float32Array(data);
    }

    #buildUVs(): Float32Array
    {

        const data: number[] = [];
        let index = 0;
        for (let yi = 0; yi <= this.#segmentsH(); ++yi) for (let xi = 0; xi <= this.#segmentsW(); ++xi)
        {
            data[index++] = xi / this.#segmentsW();
            data[index++] = yi / this.#segmentsH();
        }

        return new Float32Array(data);
    }

    #buildIndices(): number[]
    {

        const indices: number[] = [];
        let n = 0;
        for (let yi = 0; yi <= this.#segmentsH(); ++yi) for (let xi = 0; xi <= this.#segmentsW(); ++xi)
        {
            if (xi > 0 && yi > 0)
            {
                const a = (this.#segmentsW() + 1) * yi + xi;
                const b = (this.#segmentsW() + 1) * yi + xi - 1;
                const c = (this.#segmentsW() + 1) * (yi - 1) + xi - 1;
                const d = (this.#segmentsW() + 1) * (yi - 1) + xi;
                if (yi === this.#segmentsH()) { indices[n++] = a; indices[n++] = d; indices[n++] = c; }
                else if (yi === 1) { indices[n++] = a; indices[n++] = c; indices[n++] = b; }
                else
                {
                    indices[n++] = a; indices[n++] = c; indices[n++] = b;
                    indices[n++] = a; indices[n++] = d; indices[n++] = c;
                }
            }
        }

        return indices;
    }
}

registerLogic('SphereGeometry', SphereGeometryLogic as unknown as new (data: SphereGeometry) => SphereGeometryLogic);
