import { Geometry, GeometryLogic, watchGeometryInvalid, registerCloneFactory, registerDefaultGeometryFactory } from '../geometry/Geometry';
import { registerLogic } from '@feng3d/reactivity';

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        CapsuleGeometry: CapsuleGeometry;
    }
}

/**
 * 胶囊体几何体（纯数据接口）。
 */
export interface CapsuleGeometry extends Geometry
{
    readonly __type__: 'CapsuleGeometry';
    /** 胶囊体半径 */
    readonly radius: number;
    /** 胶囊体高度 */
    readonly height: number;
    /** 横向分割数 */
    readonly segmentsW: number;
    /** 纵向分割数 */
    readonly segmentsH: number;
    /** 是否朝上 */
    readonly yUp: boolean;
}

/**
 * 创建 CapsuleGeometry 实例。
 */
export function createCapsuleGeometry(): CapsuleGeometry
{
    return {
        __type__: 'CapsuleGeometry',
        name: 'Capsule',
        scaleU: 1,
        scaleV: 1,
        radius: 0.5,
        height: 1,
        segmentsW: 16,
        segmentsH: 15,
        yUp: true,
    };
}

// 注册默认值（缺失字段自动填充）
registerLogic('CapsuleGeometry', undefined, {
    name: 'Capsule',
    scaleU: 1,
    scaleV: 1,
    radius: 0.5,
    height: 1,
    segmentsW: 16,
    segmentsH: 15,
    yUp: true,
});

/**
 * 按现有数据克隆一份 CapsuleGeometry（用于 clone）。
 */
export function createCapsuleGeometryWithData(src: CapsuleGeometry): CapsuleGeometry
{
    return {
        __type__: 'CapsuleGeometry',
        name: src.name,
        scaleU: src.scaleU,
        scaleV: src.scaleV,
        radius: src.radius,
        height: src.height,
        segmentsW: src.segmentsW,
        segmentsH: src.segmentsH,
        yUp: src.yUp,
    };
}

export class CapsuleGeometryLogic extends GeometryLogic
{
    constructor(geometry: CapsuleGeometry)
    {
        super(geometry, () => buildCapsule(geometry, this));
        watchGeometryInvalid(geometry, ['radius', 'height', 'segmentsW', 'segmentsH', 'yUp'], this);
    }
}

function buildCapsule(g: CapsuleGeometry, lg: GeometryLogic): void
{
    const vertexPositionData: number[] = [];
    const vertexNormalData: number[] = [];
    const vertexTangentData: number[] = [];

    let startIndex: number; let index = 0;
    let comp1: number; let comp2: number; let t1: number; let t2: number;
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
            const tanLen = Math.sqrt(y * y + x * x);
            const offset = yi > g.segmentsH / 2 ? g.height / 2 : -g.height / 2;

            if (g.yUp) { t1 = 0; t2 = tanLen > 0.007 ? x / tanLen : 0; comp1 = -z; comp2 = y; }
            else { t1 = tanLen > 0.007 ? x / tanLen : 0; t2 = 0; comp1 = y; comp2 = z; }

            if (xi === g.segmentsW)
            {
                vertexPositionData[index] = vertexPositionData[startIndex];
                vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];

                vertexNormalData[index] = (vertexNormalData[startIndex] + x * normLen) * 0.5;
                vertexNormalData[index + 1] = (vertexNormalData[startIndex + 1] + comp1 * normLen) * 0.5;
                vertexNormalData[index + 2] = (vertexNormalData[startIndex + 2] + comp2 * normLen) * 0.5;

                vertexTangentData[index] = (vertexTangentData[startIndex] + tanLen > 0.007 ? -y / tanLen : 1) * 0.5;
                vertexTangentData[index + 1] = (vertexTangentData[startIndex + 1] + t1) * 0.5;
                vertexTangentData[index + 2] = (vertexTangentData[startIndex + 2] + t2) * 0.5;
            }
            else
            {
                vertexPositionData[index] = x;
                vertexPositionData[index + 1] = g.yUp ? comp1 - offset : comp1;
                vertexPositionData[index + 2] = g.yUp ? comp2 : comp2 + offset;

                vertexNormalData[index] = x * normLen;
                vertexNormalData[index + 1] = comp1 * normLen;
                vertexNormalData[index + 2] = comp2 * normLen;

                vertexTangentData[index] = tanLen > 0.007 ? -y / tanLen : 1;
                vertexTangentData[index + 1] = t1;
                vertexTangentData[index + 2] = t2;
            }

            if (xi > 0 && yi > 0)
            {
                if (yi === g.segmentsH)
                {
                    vertexPositionData[index] = vertexPositionData[startIndex];
                    vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                    vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];
                }
            }

            index += 3;
        }
    }

    lg.positions = vertexPositionData;
    lg.normals = vertexNormalData;
    lg.tangents = vertexTangentData;
    lg.uvs = buildCapsuleUVs(g);
    lg.indices = buildCapsuleIndices(g);
}

function buildCapsuleIndices(g: CapsuleGeometry): number[]
{
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

function buildCapsuleUVs(g: CapsuleGeometry): number[]
{
    const data: number[] = [];
    let index = 0;
    for (let yi = 0; yi <= g.segmentsH; ++yi) for (let xi = 0; xi <= g.segmentsW; ++xi)
    {
        data[index++] = xi / g.segmentsW;
        data[index++] = yi / g.segmentsH;
    }

    return data;
}

registerLogic('CapsuleGeometry', CapsuleGeometryLogic);
registerCloneFactory('CapsuleGeometry', (src: CapsuleGeometry) => createCapsuleGeometryWithData(src));
registerDefaultGeometryFactory('Capsule', createCapsuleGeometry);
