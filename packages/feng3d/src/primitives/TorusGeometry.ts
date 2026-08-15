import { Geometry, GeometryLogic } from '../geometry/Geometry';
import { registerLogic, reactive, computed } from '@feng3d/reactivity';
import { VertexAttributes } from '@feng3d/webgpu';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        TorusGeometry: TorusGeometryLogic;
    }
}

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
    /** 半径（缺失时由工厂填充默认值） */
    readonly radius?: number;
    /** 管道半径（缺失时由工厂填充默认值） */
    readonly tubeRadius?: number;
    /** 半径方向分割数（缺失时由工厂填充默认值） */
    readonly segmentsR?: number;
    /** 管道方向分割数（缺失时由工厂填充默认值） */
    readonly segmentsT?: number;
    /** 是否朝上（缺失时由工厂填充默认值） */
    readonly yUp?: boolean;
}

// TorusGeometry 默认值由 TorusGeometryLogic 内参数访问器处理（见下）

/**
 * TorusGeometryLogic 逻辑类。
 *
 * 继承 {@link GeometryLogic}，每个顶点属性用 computed 独立懒计算，
 * 依赖 radius/tubeRadius/segmentsR/segmentsT/yUp。
 * 不使用 effect/invalidateGeometry — 参数变化时 computed 自动失效重算。
 */
export class TorusGeometryLogic extends GeometryLogic
{
    // 响应式参数（不修改原始数据，缺失字段通过 ?? 提供默认值）
    readonly #radius = (): number => reactive(this._data as TorusGeometry).radius ?? 0.5;
    readonly #tubeRadius = (): number => reactive(this._data as TorusGeometry).tubeRadius ?? 0.1;
    readonly #segmentsR = (): number => reactive(this._data as TorusGeometry).segmentsR ?? 16;
    readonly #segmentsT = (): number => reactive(this._data as TorusGeometry).segmentsT ?? 8;
    readonly #yUp = (): boolean => reactive(this._data as TorusGeometry).yUp ?? true;

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

    protected constructor(data: TorusGeometry)
    {
        super(data);
    }

    /** 内部创建入口（protected constructor 的唯一出口） */
    static create(data: TorusGeometry): TorusGeometryLogic
    {
        return new TorusGeometryLogic(data);
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

    // ---- 顶点构建（直接返回 Float32Array/number[]，内部 reactive 建立依赖） ----

    #buildPositions(): Float32Array
    {

        let i: number; let j: number;
        let x: number; let y: number; let z: number;
        let nx: number; let ny: number; let nz: number;
        let revolutionAngleR: number; let revolutionAngleT: number;
        const vertexPositionStride = 3;
        const numVertices = (this.#segmentsT() + 1) * (this.#segmentsR() + 1);
        const vertexPositionData: number[] = new Array(numVertices * vertexPositionStride);

        const revolutionAngleDeltaR = 2 * Math.PI / this.#segmentsR();
        const revolutionAngleDeltaT = 2 * Math.PI / this.#segmentsT();

        let startPositionIndex: number; let length: number;
        let comp1: number; let comp2: number;

        for (j = 0; j <= this.#segmentsT(); ++j)
        {
            startPositionIndex = j * (this.#segmentsR() + 1) * vertexPositionStride;
            for (i = 0; i <= this.#segmentsR(); ++i)
            {
                const vertexIndex = j * (this.#segmentsR() + 1) + i;
                revolutionAngleR = i * revolutionAngleDeltaR;
                revolutionAngleT = j * revolutionAngleDeltaT;
                length = Math.cos(revolutionAngleT);
                nx = length * Math.cos(revolutionAngleR);
                ny = length * Math.sin(revolutionAngleR);
                nz = Math.sin(revolutionAngleT);
                x = this.#radius() * Math.cos(revolutionAngleR) + this.#tubeRadius() * nx;
                y = this.#radius() * Math.sin(revolutionAngleR) + this.#tubeRadius() * ny;
                z = (j === this.#segmentsT()) ? 0 : this.#tubeRadius() * nz;
                if (this.#yUp())
                {
                    comp1 = -z; comp2 = y;
                }
                else
                {
                    comp1 = y; comp2 = z;
                }
                if (i === this.#segmentsR())
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

    #buildNormals(): Float32Array
    {

        let i: number; let j: number;
        let nx: number; let ny: number; let nz: number;
        let revolutionAngleR: number; let revolutionAngleT: number;
        const vertexPositionStride = 3;
        const numVertices = (this.#segmentsT() + 1) * (this.#segmentsR() + 1);
        const vertexNormalData: number[] = new Array(numVertices * vertexPositionStride);

        const revolutionAngleDeltaR = 2 * Math.PI / this.#segmentsR();
        const revolutionAngleDeltaT = 2 * Math.PI / this.#segmentsT();

        let length: number; let n1: number; let n2: number;

        for (j = 0; j <= this.#segmentsT(); ++j)
        {
            for (i = 0; i <= this.#segmentsR(); ++i)
            {
                const vertexIndex = j * (this.#segmentsR() + 1) + i;
                revolutionAngleR = i * revolutionAngleDeltaR;
                revolutionAngleT = j * revolutionAngleDeltaT;
                length = Math.cos(revolutionAngleT);
                nx = length * Math.cos(revolutionAngleR);
                ny = length * Math.sin(revolutionAngleR);
                nz = Math.sin(revolutionAngleT);
                if (this.#yUp())
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

    #buildTangents(): Float32Array
    {

        let i: number; let j: number;
        let nx: number; let ny: number;
        let x: number; let y: number;
        let revolutionAngleR: number; let revolutionAngleT: number;
        const vertexPositionStride = 3;
        const numVertices = (this.#segmentsT() + 1) * (this.#segmentsR() + 1);
        const vertexTangentData: number[] = new Array(numVertices * vertexPositionStride);

        const revolutionAngleDeltaR = 2 * Math.PI / this.#segmentsR();
        const revolutionAngleDeltaT = 2 * Math.PI / this.#segmentsT();

        let length: number; let t1: number; let t2: number;

        for (j = 0; j <= this.#segmentsT(); ++j)
        {
            for (i = 0; i <= this.#segmentsR(); ++i)
            {
                const vertexIndex = j * (this.#segmentsR() + 1) + i;
                revolutionAngleR = i * revolutionAngleDeltaR;
                revolutionAngleT = j * revolutionAngleDeltaT;
                length = Math.cos(revolutionAngleT);
                nx = length * Math.cos(revolutionAngleR);
                ny = length * Math.sin(revolutionAngleR);
                x = this.#radius() * Math.cos(revolutionAngleR) + this.#tubeRadius() * nx;
                y = this.#radius() * Math.sin(revolutionAngleR) + this.#tubeRadius() * ny;
                if (this.#yUp())
                {
                    t1 = 0;
                    t2 = (length ? nx / length : x / this.#radius());
                }
                else
                {
                    t1 = (length ? nx / length : x / this.#radius());
                    t2 = 0;
                }
                vertexTangentData[vertexIndex * vertexPositionStride] = -(length ? ny / length : y / this.#radius());
                vertexTangentData[vertexIndex * vertexPositionStride + 1] = t1;
                vertexTangentData[vertexIndex * vertexPositionStride + 2] = t2;
            }
        }

        return new Float32Array(vertexTangentData);
    }

    #buildUVs(): Float32Array
    {

        let i: number; let j: number;
        const stride = 2;
        const numVertices = (this.#segmentsT() + 1) * (this.#segmentsR() + 1);
        const data: number[] = new Array(numVertices * stride);
        let index = 0;
        for (j = 0; j <= this.#segmentsT(); ++j) for (i = 0; i <= this.#segmentsR(); ++i)
        {
            index = j * (this.#segmentsR() + 1) + i;
            data[index * stride] = i / this.#segmentsR();
            data[index * stride + 1] = j / this.#segmentsT();
        }

        return new Float32Array(data);
    }

    #buildIndices(): number[]
    {

        let i: number; let j: number;
        const rawIndices: number[] = [];
        let currentTriangleIndex = 0;
        let a: number; let b: number; let c: number; let d: number;

        for (j = 0; j <= this.#segmentsT(); ++j)
        {
            for (i = 0; i <= this.#segmentsR(); ++i)
            {
                const vertexIndex = j * (this.#segmentsR() + 1) + i;
                if (i > 0 && j > 0)
                {
                    a = vertexIndex; b = vertexIndex - 1;
                    c = b - this.#segmentsR() - 1; d = a - this.#segmentsR() - 1;
                    rawIndices[currentTriangleIndex * 3] = a;
                    rawIndices[currentTriangleIndex * 3 + 1] = c;
                    rawIndices[currentTriangleIndex * 3 + 2] = b;
                    currentTriangleIndex++;
                    rawIndices[currentTriangleIndex * 3] = a;
                    rawIndices[currentTriangleIndex * 3 + 1] = d;
                    rawIndices[currentTriangleIndex * 3 + 2] = c;
                    currentTriangleIndex++;
                }
            }
        }

        return rawIndices;
    }
}

registerLogic('TorusGeometry', TorusGeometryLogic as unknown as new (data: TorusGeometry) => TorusGeometryLogic);
