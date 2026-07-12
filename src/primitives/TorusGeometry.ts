import { Geometry, GeometryLogic, watchGeometryInvalid, registerCloneFactory, registerDefaultGeometryFactory } from '../geometry/Geometry';
import { registerLogic } from '@feng3d/reactivity';

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

// 注册默认值（缺失字段自动填充）
registerLogic('TorusGeometry', undefined, {
    name: 'Torus',
    scaleU: 1,
    scaleV: 1,
    radius: 0.5,
    tubeRadius: 0.1,
    segmentsR: 16,
    segmentsT: 8,
    yUp: true,
});

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

export class TorusGeometryLogic extends GeometryLogic
{
    constructor(geometry: TorusGeometry)
    {
        super(geometry, () => buildTorus(geometry, this));
        watchGeometryInvalid(geometry, ['radius', 'tubeRadius', 'segmentsR', 'segmentsT', 'yUp'], this);
    }
}

function buildTorus(g: TorusGeometry, lg: GeometryLogic): void
{
    let i: number; let j: number;
    let x: number; let y: number; let z: number; let nx: number; let ny: number; let nz: number; let revolutionAngleR: number; let revolutionAngleT: number;
    const vertexPositionStride = 3;
    const numVertices = (g.segmentsT + 1) * (g.segmentsR + 1);

    const vertexPositionData: number[] = new Array(numVertices * vertexPositionStride);
    const vertexNormalData: number[] = new Array(numVertices * vertexPositionStride);
    const vertexTangentData: number[] = new Array(numVertices * vertexPositionStride);
    const rawIndices: number[] = [];

    const addVertex = (vertexIndex: number, px: number, py: number, pz: number, nxv: number, nyv: number, nzv: number, tx: number, ty: number, tz: number) =>
    {
        vertexPositionData[vertexIndex * vertexPositionStride] = px;
        vertexPositionData[vertexIndex * vertexPositionStride + 1] = py;
        vertexPositionData[vertexIndex * vertexPositionStride + 2] = pz;
        vertexNormalData[vertexIndex * vertexPositionStride] = nxv;
        vertexNormalData[vertexIndex * vertexPositionStride + 1] = nyv;
        vertexNormalData[vertexIndex * vertexPositionStride + 2] = nzv;
        vertexTangentData[vertexIndex * vertexPositionStride] = tx;
        vertexTangentData[vertexIndex * vertexPositionStride + 1] = ty;
        vertexTangentData[vertexIndex * vertexPositionStride + 2] = tz;
    };

    const revolutionAngleDeltaR = 2 * Math.PI / g.segmentsR;
    const revolutionAngleDeltaT = 2 * Math.PI / g.segmentsT;

    let comp1: number; let comp2: number; let t1: number; let t2: number; let n1: number; let n2: number;
    let startPositionIndex: number; let a: number; let b: number; let c: number; let d: number; let length: number;
    let currentTriangleIndex = 0;

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
                n1 = -nz; n2 = ny; t1 = 0;
                t2 = (length ? nx / length : x / g.radius);
                comp1 = -z; comp2 = y;
            }
            else
            {
                n1 = ny; n2 = nz;
                t1 = (length ? nx / length : x / g.radius);
                t2 = 0; comp1 = y; comp2 = z;
            }
            if (i === g.segmentsR)
            {
                addVertex(vertexIndex, x, vertexPositionData[startPositionIndex + 1], vertexPositionData[startPositionIndex + 2], nx, n1, n2, -(length ? ny / length : y / g.radius), t1, t2);
            }
            else
            {
                addVertex(vertexIndex, x, comp1, comp2, nx, n1, n2, -(length ? ny / length : y / g.radius), t1, t2);
            }
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

    lg.positions = vertexPositionData;
    lg.normals = vertexNormalData;
    lg.tangents = vertexTangentData;
    lg.indices = rawIndices;
    lg.uvs = buildTorusUVs(g);
}

function buildTorusUVs(g: TorusGeometry): number[]
{
    let i: number; let j: number;
    const stride = 2;
    const data: number[] = [];
    let index = 0;
    for (j = 0; j <= g.segmentsT; ++j) for (i = 0; i <= g.segmentsR; ++i)
    {
        index = j * (g.segmentsR + 1) + i;
        data[index * stride] = i / g.segmentsR;
        data[index * stride + 1] = j / g.segmentsT;
    }

    return data;
}

registerLogic('TorusGeometry', TorusGeometryLogic);
registerCloneFactory('TorusGeometry', (src: TorusGeometry) => createTorusGeometryWithData(src));
registerDefaultGeometryFactory('Torus', createTorusGeometry);
