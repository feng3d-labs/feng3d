import { Geometry, GeometryLogic, registerCloneFactory, registerDefaultGeometryFactory } from '../geometry/Geometry';
import { registerLogic, reactive, computed, Computed } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';

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
    /** 球体半径 */
    readonly radius: number;
    /** 横向分割数 */
    readonly segmentsW: number;
    /** 纵向分割数 */
    readonly segmentsH: number;
    /** 是否朝上 */
    readonly yUp: boolean;
}

/**
 * 创建 SphereGeometry 实例。
 */
export function createSphereGeometry(): SphereGeometry
{
    return {
        __type__: 'SphereGeometry',
        name: 'Sphere',
        scaleU: 1,
        scaleV: 1,
        radius: 0.5,
        segmentsW: 16,
        segmentsH: 12,
        yUp: true,
    };
}

// SphereGeometry 默认值由 SphereGeometryLogic 构造函数处理（见下）

/**
 * 按现有数据克隆一份 SphereGeometry（用于 clone）。
 */
export function createSphereGeometryWithData(src: SphereGeometry): SphereGeometry
{
    return {
        __type__: 'SphereGeometry',
        name: src.name,
        scaleU: src.scaleU,
        scaleV: src.scaleV,
        radius: src.radius,
        segmentsW: src.segmentsW,
        segmentsH: src.segmentsH,
        yUp: src.yUp,
    };
}

/**
 * 球体几何体逻辑。
 *
 * 每个顶点属性用 computed 独立懒计算，依赖 radius/segmentsW/segmentsH/yUp。
 * 不使用 effect/invalidateGeometry — 参数变化时 computed 自动失效重算。
 */
export class SphereGeometryLogic extends GeometryLogic
{
    private readonly _positions: Computed<Float32Array>;
    private readonly _normals: Computed<Float32Array>;
    private readonly _tangents: Computed<Float32Array>;
    private readonly _uvs: Computed<Float32Array>;
    private readonly _indicesComputed: Computed<number[]>;

    constructor(geometry: SphereGeometry)
    {
        super(geometry);

        // 默认值（缺失字段单独赋值）
        const writable = geometry as { [k: string]: any };
        if (geometry.name === undefined) writable.name = 'Sphere';
        if (geometry.scaleU === undefined) writable.scaleU = 1;
        if (geometry.scaleV === undefined) writable.scaleV = 1;
        if (geometry.radius === undefined) writable.radius = 0.5;
        if (geometry.segmentsW === undefined) writable.segmentsW = 16;
        if (geometry.segmentsH === undefined) writable.segmentsH = 12;
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
        const g = reactive(this._geometry as SphereGeometry);
        const data: number[] = [];

        let startIndex: number; let index = 0;
        let comp1: number; let comp2: number;
        for (let yi = 0; yi <= g.segmentsH; ++yi)
        {
            startIndex = index;
            const horangle = Math.PI * yi / g.segmentsH;
            const z = -g.radius * Math.cos(horangle);
            const ringradius = g.radius * Math.sin(horangle);

            for (let xi = 0; xi <= g.segmentsW; ++xi)
            {
                const verangle = 2 * Math.PI * xi / g.segmentsW;
                const x = ringradius * Math.cos(verangle);
                const y = ringradius * Math.sin(verangle);

                if (g.yUp) { comp1 = -z; comp2 = y; }
                else { comp1 = y; comp2 = z; }

                if (xi === g.segmentsW)
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
                    if (yi === g.segmentsH)
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

    private buildNormals(): Float32Array
    {
        const g = reactive(this._geometry as SphereGeometry);
        const data: number[] = [];

        let startIndex: number; let index = 0;
        let comp1: number; let comp2: number;
        for (let yi = 0; yi <= g.segmentsH; ++yi)
        {
            startIndex = index;
            const horangle = Math.PI * yi / g.segmentsH;
            const z = -g.radius * Math.cos(horangle);
            const ringradius = g.radius * Math.sin(horangle);

            for (let xi = 0; xi <= g.segmentsW; ++xi)
            {
                const verangle = 2 * Math.PI * xi / g.segmentsW;
                const x = ringradius * Math.cos(verangle);
                const y = ringradius * Math.sin(verangle);
                const normLen = 1 / Math.sqrt(x * x + y * y + z * z);

                if (g.yUp) { comp1 = -z; comp2 = y; }
                else { comp1 = y; comp2 = z; }

                if (xi === g.segmentsW)
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
                    if (yi === g.segmentsH)
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

    private buildTangents(): Float32Array
    {
        const g = reactive(this._geometry as SphereGeometry);
        const data: number[] = [];

        let startIndex: number; let index = 0;
        let t1: number; let t2: number;
        for (let yi = 0; yi <= g.segmentsH; ++yi)
        {
            startIndex = index;
            const horangle = Math.PI * yi / g.segmentsH;
            const z = -g.radius * Math.cos(horangle);
            const ringradius = g.radius * Math.sin(horangle);

            for (let xi = 0; xi <= g.segmentsW; ++xi)
            {
                const verangle = 2 * Math.PI * xi / g.segmentsW;
                const x = ringradius * Math.cos(verangle);
                const y = ringradius * Math.sin(verangle);
                const tanLen = Math.sqrt(y * y + x * x);

                if (g.yUp) { t1 = 0; t2 = tanLen > 0.007 ? x / tanLen : 0; }
                else { t1 = tanLen > 0.007 ? x / tanLen : 0; t2 = 0; }

                if (xi === g.segmentsW)
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
                    if (yi === g.segmentsH)
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

    private buildUVs(): Float32Array
    {
        const g = reactive(this._geometry as SphereGeometry);
        const data: number[] = [];
        let index = 0;
        for (let yi = 0; yi <= g.segmentsH; ++yi) for (let xi = 0; xi <= g.segmentsW; ++xi)
        {
            data[index++] = xi / g.segmentsW;
            data[index++] = yi / g.segmentsH;
        }

        return new Float32Array(data);
    }

    private buildIndices(): number[]
    {
        const g = reactive(this._geometry as SphereGeometry);
        const indices: number[] = [];
        let n = 0;
        for (let yi = 0; yi <= g.segmentsH; ++yi) for (let xi = 0; xi <= g.segmentsW; ++xi)
        {
            if (xi > 0 && yi > 0)
            {
                const a = (g.segmentsW + 1) * yi + xi;
                const b = (g.segmentsW + 1) * yi + xi - 1;
                const c = (g.segmentsW + 1) * (yi - 1) + xi - 1;
                const d = (g.segmentsW + 1) * (yi - 1) + xi;
                if (yi === g.segmentsH) { indices[n++] = a; indices[n++] = c; indices[n++] = d; }
                else if (yi === 1) { indices[n++] = a; indices[n++] = b; indices[n++] = c; }
                else
                {
                    indices[n++] = a; indices[n++] = b; indices[n++] = c;
                    indices[n++] = a; indices[n++] = c; indices[n++] = d;
                }
            }
        }

        return indices;
    }
}

registerLogic('SphereGeometry', SphereGeometryLogic);
registerCloneFactory('SphereGeometry', (src: SphereGeometry) => createSphereGeometryWithData(src));
registerDefaultGeometryFactory('Sphere', createSphereGeometry);
