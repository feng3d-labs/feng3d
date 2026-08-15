import { Geometry, GeometryLogic } from '../geometry/Geometry';
import { registerLogic, reactive, computed } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        PlaneGeometry: PlaneGeometryLogic;
    }
}

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        PlaneGeometry: PlaneGeometry;
    }
}

/**
 * 平面几何体（纯数据接口）。
 */
export interface PlaneGeometry extends Geometry
{
    readonly __type__: 'PlaneGeometry';
    /** 宽度（缺失时由工厂填充默认值） */
    readonly width?: number;
    /** 高度（缺失时由工厂填充默认值） */
    readonly height?: number;
    /** 横向分割数（缺失时由工厂填充默认值） */
    readonly segmentsW?: number;
    /** 纵向分割数（缺失时由工厂填充默认值） */
    readonly segmentsH?: number;
    /** 是否朝上（缺失时由工厂填充默认值） */
    readonly yUp?: boolean;
}

// PlaneGeometry 默认值由访问器字段 ?? 处理（见下）

/**
 * PlaneGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic}，每个顶点属性用 computed 独立懒计算，
 * 依赖 width/height/segmentsW/segmentsH/yUp。
 * 不使用 effect/invalidateGeometry — 参数变化时 computed 自动失效重算。
 */
export class PlaneGeometryLogic extends GeometryLogic
{
    // 响应式参数（不修改原始数据，缺失字段通过 ?? 提供默认值）
    readonly #width = (): number => reactive(this._data as PlaneGeometry).width ?? 1;
    readonly #height = (): number => reactive(this._data as PlaneGeometry).height ?? 1;
    readonly #segmentsW = (): number => reactive(this._data as PlaneGeometry).segmentsW ?? 1;
    readonly #segmentsH = (): number => reactive(this._data as PlaneGeometry).segmentsH ?? 1;
    readonly #yUp = (): boolean => reactive(this._data as PlaneGeometry).yUp ?? true;


    // 每个属性独立 computed，仅在实际被读取时计算
    readonly #_positions = computed(() => this.#buildPositions());
    readonly #_normals = computed(() => this.#buildNormals());
    readonly #_tangents = computed(() => this.#buildTangents());
    readonly #_uvs = computed(() => this.#buildUVs());
    readonly #_indicesComputed = computed(() => this.#buildIndices());

    // 默认白色 color（基于 position 顶点数，StandardMaterial/ColorMaterial 反射需要 a_color）
    readonly #_colors = computed(() =>
    {
        const pos = this.#_positions.value;
        if (pos.length === 0) return new Float32Array(0);
        const count = pos.length / 3;

        return new Float32Array(count * 4).fill(1); // 全白 (1,1,1,1)
    });

    // attributes: data 由 computed getter 驱动
    readonly #_attrTable: VertexAttributes = {
        a_position: this.computedAttr(this.#_positions, 'float32x3'),
        a_color: this.computedAttr(this.#_colors, 'float32x4'),
        a_uv: this.computedAttr(this.#_uvs, 'float32x2'),
        a_normal: this.computedAttr(this.#_normals, 'float32x3'),
        a_tangent: this.computedAttr(this.#_tangents, 'float32x3'),
    };

    protected constructor(data: PlaneGeometry)
    {
        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: PlaneGeometry): PlaneGeometryLogic
    {
        return new PlaneGeometryLogic(data);
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
        let pi = 0;

        for (let yi = 0; yi <= this.#segmentsH(); ++yi)
        {
            for (let xi = 0; xi <= this.#segmentsW(); ++xi)
            {
                const x = (xi / this.#segmentsW() - 0.5) * this.#width();
                const y = (yi / this.#segmentsH() - 0.5) * this.#height();
                data[pi++] = x;
                if (this.#yUp()) { data[pi++] = 0; data[pi++] = y; }
                else { data[pi++] = y; data[pi++] = 0; }
            }
        }

        return new Float32Array(data);
    }

    #buildNormals(): Float32Array
    {

        const data: number[] = [];
        let ni = 0;

        for (let yi = 0; yi <= this.#segmentsH(); ++yi)
        {
            for (let xi = 0; xi <= this.#segmentsW(); ++xi)
            {
                // yUp:true  → 法线 +Y（水平地板，朝上）
                // yUp:false → 法线 -Z（竖直平面，朝 -Z；右手系下配合 lookAt 的 -Z forward 朝向相机）
                if (this.#yUp()) { data[ni++] = 0; data[ni++] = 1; data[ni++] = 0; }
                else { data[ni++] = 0; data[ni++] = 0; data[ni++] = -1; }
            }
        }

        return new Float32Array(data);
    }

    #buildTangents(): Float32Array
    {

        const data: number[] = [];
        let ti = 0;

        for (let yi = 0; yi <= this.#segmentsH(); ++yi)
        {
            for (let xi = 0; xi <= this.#segmentsW(); ++xi)
            {
                // 切线沿 UV 的 U 增长方向：yUp:true 时 u=xi/W（+X），yUp:false 时 u=1-xi/W（-X）
                if (this.#yUp()) { data[ti++] = 1; data[ti++] = 0; data[ti++] = 0; }
                else { data[ti++] = -1; data[ti++] = 0; data[ti++] = 0; }
            }
        }

        return new Float32Array(data);
    }

    #buildUVs(): Float32Array
    {

        // scaleU/scaleV（Geometry 基类纹理缩放）：UV × scale 后配合 sampler addressMode repeat
        // 即可让纹理在平面内重复平铺（对应 three.js texture.repeat）。
        const su = reactive(this._data as PlaneGeometry).scaleU ?? 1;
        const sv = reactive(this._data as PlaneGeometry).scaleV ?? 1;
        const data: number[] = [];
        let ui = 0;

        for (let yi = 0; yi <= this.#segmentsH(); ++yi)
        {
            for (let xi = 0; xi <= this.#segmentsW(); ++xi)
            {
                if (this.#yUp()) { data[ui++] = (xi / this.#segmentsW()) * su; data[ui++] = (1 - yi / this.#segmentsH()) * sv; }
                else { data[ui++] = (1 - xi / this.#segmentsW()) * su; data[ui++] = (1 - yi / this.#segmentsH()) * sv; }
            }
        }

        return new Float32Array(data);
    }

    #buildIndices(): number[]
    {

        const indices: number[] = [];
        const tw = this.#segmentsW() + 1;
        let ii = 0;

        for (let yi = 0; yi <= this.#segmentsH(); ++yi)
        {
            for (let xi = 0; xi <= this.#segmentsW(); ++xi)
            {
                if (xi !== this.#segmentsW() && yi !== this.#segmentsH())
                {
                    const b = xi + yi * tw;
                    // 绕序配合法线方向，使从法线一侧观察时为 CCW（逆时针，frontFace:'ccw' 的正面）。
                    // yUp:true  从 +Y 俯视；yUp:false 从 -Z 正面观察 —— 两者法线侧观察均为 CCW。
                    indices[ii++] = b; indices[ii++] = b + tw + 1; indices[ii++] = b + tw;
                    indices[ii++] = b; indices[ii++] = b + 1; indices[ii++] = b + tw + 1;
                }
            }
        }

        return indices;
    }
}

registerLogic('PlaneGeometry', PlaneGeometryLogic as unknown as new (data: PlaneGeometry) => PlaneGeometryLogic);
