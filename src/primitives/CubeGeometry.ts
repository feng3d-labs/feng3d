import { Geometry, GeometryLogic, registerCloneFactory, registerDefaultGeometryFactory } from '../geometry/Geometry';
import { registerLogic, reactive, computed, Computed } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        CubeGeometry: CubeGeometry;
    }
}

/**
 * 立（长）方体几何体（纯数据接口）。
 */
export interface CubeGeometry extends Geometry
{
    readonly __type__: 'CubeGeometry';
    /** 宽度 */
    readonly width: number;
    /** 高度 */
    readonly height: number;
    /** 深度 */
    readonly depth: number;
    /** 宽度方向分割数 */
    readonly segmentsW: number;
    /** 高度方向分割数 */
    readonly segmentsH: number;
    /** 深度方向分割数 */
    readonly segmentsD: number;
    /** 是否为6块贴图 */
    readonly tile6: boolean;
}

/**
 * 创建 CubeGeometry 实例。
 */
export function createCubeGeometry(): CubeGeometry
{
    return {
        __type__: 'CubeGeometry',
        name: 'Cube',
        scaleU: 1,
        scaleV: 1,
        width: 1,
        height: 1,
        depth: 1,
        segmentsW: 1,
        segmentsH: 1,
        segmentsD: 1,
        tile6: false,
    };
}

// CubeGeometry 默认值由 CubeGeometryLogic 构造函数处理（见下）

/**
 * 按现有数据克隆一份 CubeGeometry（用于 clone）。
 */
export function createCubeGeometryWithData(src: CubeGeometry): CubeGeometry
{
    return {
        __type__: 'CubeGeometry',
        name: src.name,
        scaleU: src.scaleU,
        scaleV: src.scaleV,
        width: src.width,
        height: src.height,
        depth: src.depth,
        segmentsW: src.segmentsW,
        segmentsH: src.segmentsH,
        segmentsD: src.segmentsD,
        tile6: src.tile6,
    };
}

/**
 * 立方体几何体逻辑。
 *
 * 每个顶点属性用 computed 独立懒计算，依赖 width/height/depth/segmentsW/segmentsH/segmentsD/tile6。
 * 不使用 effect/invalidateGeometry — 参数变化时 computed 自动失效重算。
 */
export class CubeGeometryLogic extends GeometryLogic
{
    private readonly _positions: Computed<Float32Array>;
    private readonly _normals: Computed<Float32Array>;
    private readonly _tangents: Computed<Float32Array>;
    private readonly _uvs: Computed<Float32Array>;
    private readonly _colors: Computed<Float32Array>;
    private readonly _indicesComputed: Computed<number[]>;

    constructor(geometry: CubeGeometry)
    {
        super(geometry);

        // 默认值（缺失字段单独赋值）
        const writable = geometry as { [k: string]: any };
        if (geometry.name === undefined) writable.name = 'Cube';
        if (geometry.scaleU === undefined) writable.scaleU = 1;
        if (geometry.scaleV === undefined) writable.scaleV = 1;
        if (geometry.width === undefined) writable.width = 1;
        if (geometry.height === undefined) writable.height = 1;
        if (geometry.depth === undefined) writable.depth = 1;
        if (geometry.segmentsW === undefined) writable.segmentsW = 1;
        if (geometry.segmentsH === undefined) writable.segmentsH = 1;
        if (geometry.segmentsD === undefined) writable.segmentsD = 1;
        if (geometry.tile6 === undefined) writable.tile6 = false;

        // 每个属性独立 computed，仅在实际被读取时计算
        this._positions = computed(() => this.buildPositions());
        this._normals = computed(() => this.buildNormals());
        this._tangents = computed(() => this.buildTangents());
        this._uvs = computed(() => this.buildUVs());
        this._colors = computed(() =>
        {
            const pos = this._positions.value;
            if (pos.length === 0) return new Float32Array(0);
            const count = pos.length / 3;

            return new Float32Array(count * 4).fill(1); // 全白 (1,1,1,1)
        });
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
            a_color: computedAttr(this._colors, 'float32x4'),
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
        const g = reactive(this._geometry as CubeGeometry);
        const data: number[] = [];
        let i: number; let j: number; let outerPos: number; let positionIndex = 0;
        const hw = g.width / 2; const hh = g.height / 2; const hd = g.depth / 2;
        const dw = g.width / g.segmentsW; const dh = g.height / g.segmentsH; const dd = g.depth / g.segmentsD;
        for (i = 0; i <= g.segmentsW; i++)
        {
            outerPos = -hw + i * dw;
            for (j = 0; j <= g.segmentsH; j++)
            {
                data[positionIndex++] = outerPos;
                data[positionIndex++] = -hh + j * dh;
                data[positionIndex++] = -hd;
                data[positionIndex++] = outerPos;
                data[positionIndex++] = -hh + j * dh;
                data[positionIndex++] = hd;
            }
        }
        for (i = 0; i <= g.segmentsW; i++)
        {
            outerPos = -hw + i * dw;
            for (j = 0; j <= g.segmentsD; j++)
            {
                data[positionIndex++] = outerPos;
                data[positionIndex++] = hh;
                data[positionIndex++] = -hd + j * dd;
                data[positionIndex++] = outerPos;
                data[positionIndex++] = -hh;
                data[positionIndex++] = -hd + j * dd;
            }
        }
        for (i = 0; i <= g.segmentsD; i++)
        {
            outerPos = hd - i * dd;
            for (j = 0; j <= g.segmentsH; j++)
            {
                data[positionIndex++] = -hw;
                data[positionIndex++] = -hh + j * dh;
                data[positionIndex++] = outerPos;
                data[positionIndex++] = hw;
                data[positionIndex++] = -hh + j * dh;
                data[positionIndex++] = outerPos;
            }
        }

        return new Float32Array(data);
    }

    private buildNormals(): Float32Array
    {
        const g = reactive(this._geometry as CubeGeometry);
        const data: number[] = [];
        let i: number; let j: number; let idx = 0;
        for (i = 0; i <= g.segmentsW; i++) for (j = 0; j <= g.segmentsH; j++)
        {
            data[idx++] = 0; data[idx++] = 0; data[idx++] = -1;
            data[idx++] = 0; data[idx++] = 0; data[idx++] = 1;
        }
        for (i = 0; i <= g.segmentsW; i++) for (j = 0; j <= g.segmentsD; j++)
        {
            data[idx++] = 0; data[idx++] = 1; data[idx++] = 0;
            data[idx++] = 0; data[idx++] = -1; data[idx++] = 0;
        }
        for (i = 0; i <= g.segmentsD; i++) for (j = 0; j <= g.segmentsH; j++)
        {
            data[idx++] = -1; data[idx++] = 0; data[idx++] = 0;
            data[idx++] = 1; data[idx++] = 0; data[idx++] = 0;
        }

        return new Float32Array(data);
    }

    private buildTangents(): Float32Array
    {
        const g = reactive(this._geometry as CubeGeometry);
        const data: number[] = [];
        let i: number; let j: number; let idx = 0;
        for (i = 0; i <= g.segmentsW; i++) for (j = 0; j <= g.segmentsH; j++)
        {
            data[idx++] = 1; data[idx++] = 0; data[idx++] = 0;
            data[idx++] = -1; data[idx++] = 0; data[idx++] = 0;
        }
        for (i = 0; i <= g.segmentsW; i++) for (j = 0; j <= g.segmentsD; j++)
        {
            data[idx++] = 1; data[idx++] = 0; data[idx++] = 0;
            data[idx++] = 1; data[idx++] = 0; data[idx++] = 0;
        }
        for (i = 0; i <= g.segmentsD; i++) for (j = 0; j <= g.segmentsH; j++)
        {
            data[idx++] = 0; data[idx++] = 0; data[idx++] = -1;
            data[idx++] = 0; data[idx++] = 0; data[idx++] = 1;
        }

        return new Float32Array(data);
    }

    private buildUVs(): Float32Array
    {
        const g = reactive(this._geometry as CubeGeometry);
        let i: number; let j: number; let uidx = 0;
        const data: number[] = [];
        let uTileDim: number; let vTileDim: number; let uTileStep: number; let vTileStep: number;
        let tl0u: number; let tl0v: number; let tl1u: number; let tl1v: number; let du: number; let dv: number;

        if (g.tile6)
        {
            uTileDim = uTileStep = 1 / 3;
            vTileDim = vTileStep = 1 / 2;
        }
        else
        {
            uTileDim = vTileDim = 1;
            uTileStep = vTileStep = 0;
        }

        tl0u = Number(uTileStep); tl0v = Number(vTileStep);
        tl1u = 2 * uTileStep; tl1v = 0 * vTileStep;
        du = uTileDim / g.segmentsW; dv = vTileDim / g.segmentsH;
        for (i = 0; i <= g.segmentsW; i++) for (j = 0; j <= g.segmentsH; j++)
        {
            data[uidx++] = tl0u + i * du;
            data[uidx++] = tl0v + (vTileDim - j * dv);
            data[uidx++] = tl1u + (uTileDim - i * du);
            data[uidx++] = tl1v + (vTileDim - j * dv);
        }

        tl0u = Number(uTileStep); tl0v = 0 * vTileStep;
        tl1u = 0 * uTileStep; tl1v = 0 * vTileStep;
        du = uTileDim / g.segmentsW; dv = vTileDim / g.segmentsD;
        for (i = 0; i <= g.segmentsW; i++) for (j = 0; j <= g.segmentsD; j++)
        {
            data[uidx++] = tl0u + i * du;
            data[uidx++] = tl0v + (vTileDim - j * dv);
            data[uidx++] = tl1u + i * du;
            data[uidx++] = tl1v + j * dv;
        }

        tl0u = 0 * uTileStep; tl0v = Number(vTileStep);
        tl1u = 2 * uTileStep; tl1v = Number(vTileStep);
        du = uTileDim / g.segmentsD; dv = vTileDim / g.segmentsH;
        for (i = 0; i <= g.segmentsD; i++) for (j = 0; j <= g.segmentsH; j++)
        {
            data[uidx++] = tl0u + i * du;
            data[uidx++] = tl0v + (vTileDim - j * dv);
            data[uidx++] = tl1u + (uTileDim - i * du);
            data[uidx++] = tl1v + (vTileDim - j * dv);
        }

        return new Float32Array(data);
    }

    private buildIndices(): number[]
    {
        const g = reactive(this._geometry as CubeGeometry);
        const indices: number[] = [];
        let tl: number; let tr: number; let bl: number; let br: number;
        let i: number; let j: number; let inc = 0; let fidx = 0;

        for (i = 0; i <= g.segmentsW; i++) for (j = 0; j <= g.segmentsH; j++)
        {
            if (i && j)
            {
                tl = 2 * ((i - 1) * (g.segmentsH + 1) + (j - 1));
                tr = 2 * (i * (g.segmentsH + 1) + (j - 1));
                bl = tl + 2; br = tr + 2;
                indices[fidx++] = tl; indices[fidx++] = bl; indices[fidx++] = br;
                indices[fidx++] = tl; indices[fidx++] = br; indices[fidx++] = tr;
                indices[fidx++] = tr + 1; indices[fidx++] = br + 1; indices[fidx++] = bl + 1;
                indices[fidx++] = tr + 1; indices[fidx++] = bl + 1; indices[fidx++] = tl + 1;
            }
        }
        inc += 2 * (g.segmentsW + 1) * (g.segmentsH + 1);

        for (i = 0; i <= g.segmentsW; i++) for (j = 0; j <= g.segmentsD; j++)
        {
            if (i && j)
            {
                tl = inc + 2 * ((i - 1) * (g.segmentsD + 1) + (j - 1));
                tr = inc + 2 * (i * (g.segmentsD + 1) + (j - 1));
                bl = tl + 2; br = tr + 2;
                indices[fidx++] = tl; indices[fidx++] = bl; indices[fidx++] = br;
                indices[fidx++] = tl; indices[fidx++] = br; indices[fidx++] = tr;
                indices[fidx++] = tr + 1; indices[fidx++] = br + 1; indices[fidx++] = bl + 1;
                indices[fidx++] = tr + 1; indices[fidx++] = bl + 1; indices[fidx++] = tl + 1;
            }
        }
        inc += 2 * (g.segmentsW + 1) * (g.segmentsD + 1);

        for (i = 0; i <= g.segmentsD; i++) for (j = 0; j <= g.segmentsH; j++)
        {
            if (i && j)
            {
                tl = inc + 2 * ((i - 1) * (g.segmentsH + 1) + (j - 1));
                tr = inc + 2 * (i * (g.segmentsH + 1) + (j - 1));
                bl = tl + 2; br = tr + 2;
                indices[fidx++] = tl; indices[fidx++] = bl; indices[fidx++] = br;
                indices[fidx++] = tl; indices[fidx++] = br; indices[fidx++] = tr;
                indices[fidx++] = tr + 1; indices[fidx++] = br + 1; indices[fidx++] = bl + 1;
                indices[fidx++] = tr + 1; indices[fidx++] = bl + 1; indices[fidx++] = tl + 1;
            }
        }

        return indices;
    }
}

registerLogic('CubeGeometry', CubeGeometryLogic);
registerCloneFactory('CubeGeometry', (src: CubeGeometry) => createCubeGeometryWithData(src));
registerDefaultGeometryFactory('Cube', createCubeGeometry);
