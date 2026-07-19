import { Geometry, GeometryLogic, registerCloneFactory, registerDefaultGeometryFactory } from '../geometry/Geometry';
import { registerLogic, reactive, computed, Computed } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';

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
    /** 宽度 */
    readonly width: number;
    /** 高度 */
    readonly height: number;
    /** 横向分割数 */
    readonly segmentsW: number;
    /** 纵向分割数 */
    readonly segmentsH: number;
    /** 是否朝上 */
    readonly yUp: boolean;
}

/**
 * 创建 PlaneGeometry 实例。
 */
export function createPlaneGeometry(): PlaneGeometry
{
    return {
        __type__: 'PlaneGeometry',
        name: 'Plane',
        scaleU: 1,
        scaleV: 1,
        width: 1,
        height: 1,
        segmentsW: 1,
        segmentsH: 1,
        yUp: true,
    };
}

// PlaneGeometry 默认值由 PlaneGeometryLogic 构造函数处理（见下）

/**
 * 按现有数据克隆一份 PlaneGeometry（用于 clone）。
 */
export function createPlaneGeometryWithData(src: PlaneGeometry): PlaneGeometry
{
    return {
        __type__: 'PlaneGeometry',
        name: src.name,
        scaleU: src.scaleU,
        scaleV: src.scaleV,
        width: src.width,
        height: src.height,
        segmentsW: src.segmentsW,
        segmentsH: src.segmentsH,
        yUp: src.yUp,
    };
}

/**
 * 平面几何体逻辑。
 *
 * 每个顶点属性用 computed 独立懒计算，依赖 width/height/segmentsW/segmentsH/yUp。
 * 不使用 effect/invalidateGeometry — 参数变化时 computed 自动失效重算。
 */
export class PlaneGeometryLogic extends GeometryLogic
{
    private readonly _positions: Computed<Float32Array>;
    private readonly _normals: Computed<Float32Array>;
    private readonly _tangents: Computed<Float32Array>;
    private readonly _uvs: Computed<Float32Array>;
    private readonly _indicesComputed: Computed<number[]>;

    constructor(geometry: PlaneGeometry)
    {
        super(geometry);

        // 默认值（缺失字段单独赋值）
        const writable = geometry as { [k: string]: any };
        if (geometry.name === undefined) writable.name = 'Plane';
        if (geometry.scaleU === undefined) writable.scaleU = 1;
        if (geometry.scaleV === undefined) writable.scaleV = 1;
        if (geometry.width === undefined) writable.width = 1;
        if (geometry.height === undefined) writable.height = 1;
        if (geometry.segmentsW === undefined) writable.segmentsW = 1;
        if (geometry.segmentsH === undefined) writable.segmentsH = 1;
        if (geometry.yUp === undefined) writable.yUp = true;

        // 每个属性独立 computed，仅在实际被读取时计算
        this._positions = computed(() => this.buildPositions());
        this._normals = computed(() => this.buildNormals());
        this._tangents = computed(() => this.buildTangents());
        this._uvs = computed(() => this.buildUVs());
        this._indicesComputed = computed(() => this.buildIndices());

        // attributes: data 由 computed getter 驱动
        this.attributes = this.createAttributes();
    }

    /** indices 由 computed 驱动（override 基类 getter） */
    get indices(): number[] { return this._indicesComputed.value; }

    private createAttributes(): Record<string, VertexAttribute>
    {
        const computedAttr = (ref: Computed<Float32Array>, format: VertexAttribute['format']): VertexAttribute =>
        {
            const obj: VertexAttribute = { data: new Float32Array(), format };
            Object.defineProperty(obj, 'data', { get() { return ref.value; }, enumerable: true });

            return obj;
        };

        return {
            a_position: computedAttr(this._positions, 'float32x3'),
            a_uv: computedAttr(this._uvs, 'float32x2'),
            a_normal: computedAttr(this._normals, 'float32x3'),
            a_tangent: computedAttr(this._tangents, 'float32x3'),
            a_skinIndices: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights: { data: new Float32Array(), format: 'float32x4' },
            a_skinIndices1: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights1: { data: new Float32Array(), format: 'float32x4' },
        };
    }

    // ---- 顶点构建（直接返回 Float32Array，内部 reactive 建立依赖） ----

    private buildPositions(): Float32Array
    {
        const g = reactive(this._geometry as PlaneGeometry);
        const data: number[] = [];
        let pi = 0;

        for (let yi = 0; yi <= g.segmentsH; ++yi)
        {
            for (let xi = 0; xi <= g.segmentsW; ++xi)
            {
                const x = (xi / g.segmentsW - 0.5) * g.width;
                const y = (yi / g.segmentsH - 0.5) * g.height;
                data[pi++] = x;
                if (g.yUp) { data[pi++] = 0; data[pi++] = y; }
                else { data[pi++] = y; data[pi++] = 0; }
            }
        }

        return new Float32Array(data);
    }

    private buildNormals(): Float32Array
    {
        const g = reactive(this._geometry as PlaneGeometry);
        const data: number[] = [];
        let ni = 0;

        for (let yi = 0; yi <= g.segmentsH; ++yi)
        {
            for (let xi = 0; xi <= g.segmentsW; ++xi)
            {
                data[ni++] = 0;
                if (g.yUp) { data[ni++] = 1; data[ni++] = 0; }
                else { data[ni++] = 0; data[ni++] = 1; }
            }
        }

        return new Float32Array(data);
    }

    private buildTangents(): Float32Array
    {
        const g = reactive(this._geometry as PlaneGeometry);
        const data: number[] = [];
        let ti = 0;

        for (let yi = 0; yi <= g.segmentsH; ++yi)
        {
            for (let xi = 0; xi <= g.segmentsW; ++xi)
            {
                if (g.yUp) { data[ti++] = 1; data[ti++] = 0; data[ti++] = 0; }
                else { data[ti++] = -1; data[ti++] = 0; data[ti++] = 0; }
            }
        }

        return new Float32Array(data);
    }

    private buildUVs(): Float32Array
    {
        const g = reactive(this._geometry as PlaneGeometry);
        const data: number[] = [];
        let ui = 0;

        for (let yi = 0; yi <= g.segmentsH; ++yi)
        {
            for (let xi = 0; xi <= g.segmentsW; ++xi)
            {
                if (g.yUp) { data[ui++] = xi / g.segmentsW; data[ui++] = 1 - yi / g.segmentsH; }
                else { data[ui++] = 1 - xi / g.segmentsW; data[ui++] = 1 - yi / g.segmentsH; }
            }
        }

        return new Float32Array(data);
    }

    private buildIndices(): number[]
    {
        const g = reactive(this._geometry as PlaneGeometry);
        const indices: number[] = [];
        const tw = g.segmentsW + 1;
        let ii = 0;

        for (let yi = 0; yi <= g.segmentsH; ++yi)
        {
            for (let xi = 0; xi <= g.segmentsW; ++xi)
            {
                if (xi !== g.segmentsW && yi !== g.segmentsH)
                {
                    const b = xi + yi * tw;
                    if (g.yUp)
                    {
                        indices[ii++] = b; indices[ii++] = b + tw; indices[ii++] = b + tw + 1;
                        indices[ii++] = b; indices[ii++] = b + tw + 1; indices[ii++] = b + 1;
                    }
                    else
                    {
                        indices[ii++] = b; indices[ii++] = b + tw + 1; indices[ii++] = b + tw;
                        indices[ii++] = b; indices[ii++] = b + 1; indices[ii++] = b + tw + 1;
                    }
                }
            }
        }

        return indices;
    }
}

registerLogic('PlaneGeometry', PlaneGeometryLogic);
registerCloneFactory('PlaneGeometry', (src: PlaneGeometry) => createPlaneGeometryWithData(src));
registerDefaultGeometryFactory('Plane', createPlaneGeometry);
