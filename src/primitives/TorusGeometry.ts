import { Geometry, GeometryLogic, registerCloneFactory, registerDefaultGeometryFactory } from '../geometry/Geometry';
import { registerLogic, reactive, computed, Computed, UnReadonly } from '@feng3d/reactivity';
import { VertexAttribute } from '@feng3d/webgpu';

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        TorusGeometry: TorusGeometry;
    }
}

/**
 * 圆环几何体（纯数据接口）。
 */
export interface TorusGeometry extends Geometry
{
    readonly __type__: 'TorusGeometry';
    /** 半径 */
    readonly radius: number;
    /** 管道半径 */
    readonly tubeRadius: number;
    /** 半径方向分割数 */
    readonly segmentsR: number;
    /** 管道方向分割数 */
    readonly segmentsT: number;
    /** 是否朝上 */
    readonly yUp: boolean;
}

/**
 * 创建 TorusGeometry 实例。
 */
export function createTorusGeometry(): TorusGeometry
{
    return {
        __type__: 'TorusGeometry',
        name: 'Torus',
        scaleU: 1,
        scaleV: 1,
        radius: 0.5,
        tubeRadius: 0.1,
        segmentsR: 16,
        segmentsT: 8,
        yUp: true,
    };
}

// TorusGeometry 默认值由 TorusGeometryLogic 构造函数处理（见下）

/**
 * 按现有数据克隆一份 TorusGeometry（用于 clone）。
 */
export function createTorusGeometryWithData(src: TorusGeometry): TorusGeometry
{
    return {
        __type__: 'TorusGeometry',
        name: src.name,
        scaleU: src.scaleU,
        scaleV: src.scaleV,
        radius: src.radius,
        tubeRadius: src.tubeRadius,
        segmentsR: src.segmentsR,
        segmentsT: src.segmentsT,
        yUp: src.yUp,
    };
}

/**
 * 圆环几何体逻辑。
 *
 * 每个顶点属性用 computed 独立懒计算，依赖 radius/tubeRadius/segmentsR/segmentsT/yUp。
 * 不使用 effect/invalidateGeometry — 参数变化时 computed 自动失效重算。
 */
export class TorusGeometryLogic extends GeometryLogic
{
    private readonly _positions: Computed<Float32Array>;
    private readonly _normals: Computed<Float32Array>;
    private readonly _tangents: Computed<Float32Array>;
    private readonly _uvs: Computed<Float32Array>;
    private readonly _indicesComputed: Computed<number[]>;

    constructor(geometry: TorusGeometry)
    {
        super(geometry);

        // 默认值（缺失字段单独赋值）
        const writable = geometry as UnReadonly<TorusGeometry>;
        if (geometry.name === undefined) writable.name = 'Torus';
        if (geometry.scaleU === undefined) writable.scaleU = 1;
        if (geometry.scaleV === undefined) writable.scaleV = 1;
        if (geometry.radius === undefined) writable.radius = 0.5;
        if (geometry.tubeRadius === undefined) writable.tubeRadius = 0.1;
        if (geometry.segmentsR === undefined) writable.segmentsR = 16;
        if (geometry.segmentsT === undefined) writable.segmentsT = 8;
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
            a_color: { data: new Float32Array(), format: 'float32x4' },
            a_uv: computedAttr(this._uvs, 'float32x2'),
            a_normal: computedAttr(this._normals, 'float32x3'),
            a_tangent: computedAttr(this._tangents, 'float32x3'),
            a_skinIndices: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights: { data: new Float32Array(), format: 'float32x4' },
            a_skinIndices1: { data: new Float32Array(), format: 'float32x4' },
            a_skinWeights1: { data: new Float32Array(), format: 'float32x4' },
        };
    }

    // ---- 顶点构建（直接返回 Float32Array/number[]，内部 reactive 建立依赖） ----

    private buildPositions(): Float32Array
    {
        const g = reactive(this._geometry as TorusGeometry);
        let i: number; let j: number;
        let x: number; let y: number; let z: number;
        let nx: number; let ny: number; let nz: number;
        let revolutionAngleR: number; let revolutionAngleT: number;
        const vertexPositionStride = 3;
        const numVertices = (g.segmentsT + 1) * (g.segmentsR + 1);
        const vertexPositionData: number[] = new Array(numVertices * vertexPositionStride);

        const revolutionAngleDeltaR = 2 * Math.PI / g.segmentsR;
        const revolutionAngleDeltaT = 2 * Math.PI / g.segmentsT;

        let startPositionIndex: number; let length: number;
        let comp1: number; let comp2: number;

        for (j = 0; j <= g.segmentsT; ++j)
        {
            startPositionIndex = j * (g.segmentsR + 1) * vertexPositionStride;
            for (i = 0; i <= g.segmentsR; ++i)
            {
                const vertexIndex = j * (g.segmentsR + 1) + i;
                revolutionAngleR = i * revolutionAngleDeltaR;
                revolutionAngleT = j * revolutionAngleDeltaT;
                length = Math.cos(revolutionAngleT);
                nx = length * Math.cos(revolutionAngleR);
                ny = length * Math.sin(revolutionAngleR);
                nz = Math.sin(revolutionAngleT);
                x = g.radius * Math.cos(revolutionAngleR) + g.tubeRadius * nx;
                y = g.radius * Math.sin(revolutionAngleR) + g.tubeRadius * ny;
                z = (j === g.segmentsT) ? 0 : g.tubeRadius * nz;
                if (g.yUp)
                {
                    comp1 = -z; comp2 = y;
                }
                else
                {
                    comp1 = y; comp2 = z;
                }
                if (i === g.segmentsR)
                {
                    vertexPositionData[vertexIndex * vertexPositionStride] = x;
                    vertexPositionData[vertexIndex * vertexPositionStride + 1] = vertexPositionData[startPositionIndex + 1];
                    vertexPositionData[vertexIndex * vertexPositionStride + 2] = vertexPositionData[startPositionIndex + 2];
                }
                else
                {
                    vertexPositionData[vertexIndex * vertexPositionStride] = x;
                    vertexPositionData[vertexIndex * vertexPositionStride + 1] = comp1;
                    vertexPositionData[vertexIndex * vertexPositionStride + 2] = comp2;
                }
            }
        }

        return new Float32Array(vertexPositionData);
    }

    private buildNormals(): Float32Array
    {
        const g = reactive(this._geometry as TorusGeometry);
        let i: number; let j: number;
        let nx: number; let ny: number; let nz: number;
        let revolutionAngleR: number; let revolutionAngleT: number;
        const vertexPositionStride = 3;
        const numVertices = (g.segmentsT + 1) * (g.segmentsR + 1);
        const vertexNormalData: number[] = new Array(numVertices * vertexPositionStride);

        const revolutionAngleDeltaR = 2 * Math.PI / g.segmentsR;
        const revolutionAngleDeltaT = 2 * Math.PI / g.segmentsT;

        let length: number; let n1: number; let n2: number;

        for (j = 0; j <= g.segmentsT; ++j)
        {
            for (i = 0; i <= g.segmentsR; ++i)
            {
                const vertexIndex = j * (g.segmentsR + 1) + i;
                revolutionAngleR = i * revolutionAngleDeltaR;
                revolutionAngleT = j * revolutionAngleDeltaT;
                length = Math.cos(revolutionAngleT);
                nx = length * Math.cos(revolutionAngleR);
                ny = length * Math.sin(revolutionAngleR);
                nz = Math.sin(revolutionAngleT);
                if (g.yUp)
                {
                    n1 = -nz; n2 = ny;
                }
                else
                {
                    n1 = ny; n2 = nz;
                }
                vertexNormalData[vertexIndex * vertexPositionStride] = nx;
                vertexNormalData[vertexIndex * vertexPositionStride + 1] = n1;
                vertexNormalData[vertexIndex * vertexPositionStride + 2] = n2;
            }
        }

        return new Float32Array(vertexNormalData);
    }

    private buildTangents(): Float32Array
    {
        const g = reactive(this._geometry as TorusGeometry);
        let i: number; let j: number;
        let nx: number; let ny: number;
        let x: number; let y: number;
        let revolutionAngleR: number; let revolutionAngleT: number;
        const vertexPositionStride = 3;
        const numVertices = (g.segmentsT + 1) * (g.segmentsR + 1);
        const vertexTangentData: number[] = new Array(numVertices * vertexPositionStride);

        const revolutionAngleDeltaR = 2 * Math.PI / g.segmentsR;
        const revolutionAngleDeltaT = 2 * Math.PI / g.segmentsT;

        let length: number; let t1: number; let t2: number;

        for (j = 0; j <= g.segmentsT; ++j)
        {
            for (i = 0; i <= g.segmentsR; ++i)
            {
                const vertexIndex = j * (g.segmentsR + 1) + i;
                revolutionAngleR = i * revolutionAngleDeltaR;
                revolutionAngleT = j * revolutionAngleDeltaT;
                length = Math.cos(revolutionAngleT);
                nx = length * Math.cos(revolutionAngleR);
                ny = length * Math.sin(revolutionAngleR);
                x = g.radius * Math.cos(revolutionAngleR) + g.tubeRadius * nx;
                y = g.radius * Math.sin(revolutionAngleR) + g.tubeRadius * ny;
                if (g.yUp)
                {
                    t1 = 0;
                    t2 = (length ? nx / length : x / g.radius);
                }
                else
                {
                    t1 = (length ? nx / length : x / g.radius);
                    t2 = 0;
                }
                vertexTangentData[vertexIndex * vertexPositionStride] = -(length ? ny / length : y / g.radius);
                vertexTangentData[vertexIndex * vertexPositionStride + 1] = t1;
                vertexTangentData[vertexIndex * vertexPositionStride + 2] = t2;
            }
        }

        return new Float32Array(vertexTangentData);
    }

    private buildUVs(): Float32Array
    {
        const g = reactive(this._geometry as TorusGeometry);
        let i: number; let j: number;
        const stride = 2;
        const numVertices = (g.segmentsT + 1) * (g.segmentsR + 1);
        const data: number[] = new Array(numVertices * stride);
        let index = 0;
        for (j = 0; j <= g.segmentsT; ++j) for (i = 0; i <= g.segmentsR; ++i)
        {
            index = j * (g.segmentsR + 1) + i;
            data[index * stride] = i / g.segmentsR;
            data[index * stride + 1] = j / g.segmentsT;
        }

        return new Float32Array(data);
    }

    private buildIndices(): number[]
    {
        const g = reactive(this._geometry as TorusGeometry);
        let i: number; let j: number;
        const rawIndices: number[] = [];
        let currentTriangleIndex = 0;
        let a: number; let b: number; let c: number; let d: number;

        for (j = 0; j <= g.segmentsT; ++j)
        {
            for (i = 0; i <= g.segmentsR; ++i)
            {
                const vertexIndex = j * (g.segmentsR + 1) + i;
                if (i > 0 && j > 0)
                {
                    a = vertexIndex; b = vertexIndex - 1;
                    c = b - g.segmentsR - 1; d = a - g.segmentsR - 1;
                    rawIndices[currentTriangleIndex * 3] = a;
                    rawIndices[currentTriangleIndex * 3 + 1] = b;
                    rawIndices[currentTriangleIndex * 3 + 2] = c;
                    currentTriangleIndex++;
                    rawIndices[currentTriangleIndex * 3] = a;
                    rawIndices[currentTriangleIndex * 3 + 1] = c;
                    rawIndices[currentTriangleIndex * 3 + 2] = d;
                    currentTriangleIndex++;
                }
            }
        }

        return rawIndices;
    }
}

registerLogic('TorusGeometry', TorusGeometryLogic);
registerCloneFactory('TorusGeometry', (src: TorusGeometry) => createTorusGeometryWithData(src));
registerDefaultGeometryFactory('Torus', createTorusGeometry);
