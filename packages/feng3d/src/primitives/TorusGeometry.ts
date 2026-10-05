import { computedAttr, Geometry, geometryLogicProto, setupGeometryLogicState, GeometryLogic, type GeometryLogicState } from '../geometry/Geometry';
import { registerLogic, reactive, computed, type Computed, createLogicProto } from '@feng3d/reactivity';
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
export interface TorusGeometryLogic extends GeometryLogic
{
}

/** TorusGeometryLogic 实例的内部状态（不进公开接口，工厂装配时写入） */
interface TorusGeometryLogicState extends GeometryLogicState
{
    _attrTable: VertexAttributes;
    _indicesComputed: Computed<number[]>;
}

/** TorusGeometryLogic 的共享原型：继承 Geometry 基类实现，覆写 vertices / vertexIndices */
const torusGeometryLogicProto = createLogicProto<TorusGeometryLogic>(geometryLogicProto, {
    vertices: {
        get: function (this: TorusGeometryLogic & TorusGeometryLogicState): VertexAttributes { return this._attrTable; },
    },
    /** indices 由 computed 驱动（覆写基类 getter） */
    vertexIndices: {
        get: function (this: TorusGeometryLogic & TorusGeometryLogicState): number[] { return this._indicesComputed.value; },
    },
});

/**
 * 工厂函数：TorusGeometryLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 几何数据（raw）
 */
export function torusGeometryLogic(data: TorusGeometry): TorusGeometryLogic
{
    // 响应式参数（不修改原始数据，缺失字段通过 ?? 提供默认值）
    const radius = (): number => reactive(data).radius ?? 0.5;
    const tubeRadius = (): number => reactive(data).tubeRadius ?? 0.1;
    const segmentsR = (): number => reactive(data).segmentsR ?? 16;
    const segmentsT = (): number => reactive(data).segmentsT ?? 8;
    const yUp = (): boolean => reactive(data).yUp ?? true;

    // 每个属性独立 computed，仅在实际被读取时计算
    const positions = computed(() => buildPositions());
    const normals = computed(() => buildNormals());
    const tangents = computed(() => buildTangents());
    const uvs = computed(() => buildUVs());
    const colors = computed(() =>
    {
        const pos = positions.value;
        if (pos.length === 0) return new Float32Array(0);
        const count = pos.length / 3;

        return new Float32Array(count * 4).fill(1);
    });
    const indicesComputed = computed(() => buildIndices());

    // attributes: data 由 computed getter 驱动
    const logic = setupGeometryLogicState(Object.create(torusGeometryLogicProto) as TorusGeometryLogic & TorusGeometryLogicState, data);
    logic._attrTable = {
        a_position: computedAttr(positions, 'float32x3'),
        a_color: computedAttr(colors, 'float32x4'),
        a_uv: computedAttr(uvs, 'float32x2'),
        a_normal: computedAttr(normals, 'float32x3'),
        a_tangent: computedAttr(tangents, 'float32x3'),
    };

    // ---- 顶点构建（直接返回 Float32Array/number[]，内部 reactive 建立依赖） ----

    function buildPositions(): Float32Array
    {

        let i: number; let j: number;
        let x: number; let y: number; let z: number;
        let nx: number; let ny: number; let nz: number;
        let revolutionAngleR: number; let revolutionAngleT: number;
        const vertexPositionStride = 3;
        const numVertices = (segmentsT() + 1) * (segmentsR() + 1);
        const vertexPositionData: number[] = new Array(numVertices * vertexPositionStride);

        const revolutionAngleDeltaR = 2 * Math.PI / segmentsR();
        const revolutionAngleDeltaT = 2 * Math.PI / segmentsT();

        let startPositionIndex: number; let length: number;
        let comp1: number; let comp2: number;

        for (j = 0; j <= segmentsT(); ++j)
        {
            startPositionIndex = j * (segmentsR() + 1) * vertexPositionStride;
            for (i = 0; i <= segmentsR(); ++i)
            {
                const vertexIndex = j * (segmentsR() + 1) + i;
                revolutionAngleR = i * revolutionAngleDeltaR;
                revolutionAngleT = j * revolutionAngleDeltaT;
                length = Math.cos(revolutionAngleT);
                nx = length * Math.cos(revolutionAngleR);
                ny = length * Math.sin(revolutionAngleR);
                nz = Math.sin(revolutionAngleT);
                x = radius() * Math.cos(revolutionAngleR) + tubeRadius() * nx;
                y = radius() * Math.sin(revolutionAngleR) + tubeRadius() * ny;
                z = (j === segmentsT()) ? 0 : tubeRadius() * nz;
                if (yUp())
                {
                    comp1 = -z; comp2 = y;
                }
                else
                {
                    comp1 = y; comp2 = z;
                }
                if (i === segmentsR())
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

    function buildNormals(): Float32Array
    {

        let i: number; let j: number;
        let nx: number; let ny: number; let nz: number;
        let revolutionAngleR: number; let revolutionAngleT: number;
        const vertexPositionStride = 3;
        const numVertices = (segmentsT() + 1) * (segmentsR() + 1);
        const vertexNormalData: number[] = new Array(numVertices * vertexPositionStride);

        const revolutionAngleDeltaR = 2 * Math.PI / segmentsR();
        const revolutionAngleDeltaT = 2 * Math.PI / segmentsT();

        let length: number; let n1: number; let n2: number;

        for (j = 0; j <= segmentsT(); ++j)
        {
            for (i = 0; i <= segmentsR(); ++i)
            {
                const vertexIndex = j * (segmentsR() + 1) + i;
                revolutionAngleR = i * revolutionAngleDeltaR;
                revolutionAngleT = j * revolutionAngleDeltaT;
                length = Math.cos(revolutionAngleT);
                nx = length * Math.cos(revolutionAngleR);
                ny = length * Math.sin(revolutionAngleR);
                nz = Math.sin(revolutionAngleT);
                if (yUp())
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

    function buildTangents(): Float32Array
    {

        let i: number; let j: number;
        let nx: number; let ny: number;
        let x: number; let y: number;
        let revolutionAngleR: number; let revolutionAngleT: number;
        const vertexPositionStride = 3;
        const numVertices = (segmentsT() + 1) * (segmentsR() + 1);
        const vertexTangentData: number[] = new Array(numVertices * vertexPositionStride);

        const revolutionAngleDeltaR = 2 * Math.PI / segmentsR();
        const revolutionAngleDeltaT = 2 * Math.PI / segmentsT();

        let length: number; let t1: number; let t2: number;

        for (j = 0; j <= segmentsT(); ++j)
        {
            for (i = 0; i <= segmentsR(); ++i)
            {
                const vertexIndex = j * (segmentsR() + 1) + i;
                revolutionAngleR = i * revolutionAngleDeltaR;
                revolutionAngleT = j * revolutionAngleDeltaT;
                length = Math.cos(revolutionAngleT);
                nx = length * Math.cos(revolutionAngleR);
                ny = length * Math.sin(revolutionAngleR);
                x = radius() * Math.cos(revolutionAngleR) + tubeRadius() * nx;
                y = radius() * Math.sin(revolutionAngleR) + tubeRadius() * ny;
                if (yUp())
                {
                    t1 = 0;
                    t2 = (length ? nx / length : x / radius());
                }
                else
                {
                    t1 = (length ? nx / length : x / radius());
                    t2 = 0;
                }
                vertexTangentData[vertexIndex * vertexPositionStride] = -(length ? ny / length : y / radius());
                vertexTangentData[vertexIndex * vertexPositionStride + 1] = t1;
                vertexTangentData[vertexIndex * vertexPositionStride + 2] = t2;
            }
        }

        return new Float32Array(vertexTangentData);
    }

    function buildUVs(): Float32Array
    {

        let i: number; let j: number;
        const stride = 2;
        const numVertices = (segmentsT() + 1) * (segmentsR() + 1);
        const data: number[] = new Array(numVertices * stride);
        let index = 0;
        for (j = 0; j <= segmentsT(); ++j) for (i = 0; i <= segmentsR(); ++i)
        {
            index = j * (segmentsR() + 1) + i;
            data[index * stride] = i / segmentsR();
            data[index * stride + 1] = j / segmentsT();
        }

        return new Float32Array(data);
    }

    function buildIndices(): number[]
    {

        let i: number; let j: number;
        const rawIndices: number[] = [];
        let currentTriangleIndex = 0;
        let a: number; let b: number; let c: number; let d: number;

        for (j = 0; j <= segmentsT(); ++j)
        {
            for (i = 0; i <= segmentsR(); ++i)
            {
                const vertexIndex = j * (segmentsR() + 1) + i;
                if (i > 0 && j > 0)
                {
                    a = vertexIndex; b = vertexIndex - 1;
                    c = b - segmentsR() - 1; d = a - segmentsR() - 1;
                    // 绕序须与顶点法线一致（正面朝外）。原写法 a,c,b 与 a,d,c 与
                    // SphereGeometry 修复前完全相同，绕序反向会让环面正面被
                    // cullFace:'back' 剔除。
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

    logic._indicesComputed = indicesComputed;

    return logic;
}
registerLogic('TorusGeometry', torusGeometryLogic);
