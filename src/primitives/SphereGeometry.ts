import { Geometry, GeometryLogic, createGeometryAttributes, watchGeometryInvalid, registerCloneFactory, registerDefaultGeometryFactory } from '../geometry/Geometry';
import { registerLogic } from '@feng3d/reactivity';
import { Index } from '../render/data/Index';

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

// 注册默认值（缺失字段自动填充）
registerLogic('SphereGeometry', undefined, {
    name: 'Sphere',
    scaleU: 1,
    scaleV: 1,
    radius: 0.5,
    segmentsW: 16,
    segmentsH: 12,
    yUp: true,
});

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

export class SphereGeometryLogic extends GeometryLogic
{
    constructor(geometry: SphereGeometry)
    {
        super(geometry);
        this.attributes = createGeometryAttributes();
        this.indexBuffer = new Index();
        watchGeometryInvalid(geometry, ['radius', 'segmentsW', 'segmentsH', 'yUp'], this);
    }

    buildGeometry(): void
    {
        buildSphere(this._geometry as SphereGeometry, this);
    }
}

function buildSphere(g: SphereGeometry, lg: GeometryLogic): void
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

            if (g.yUp) { t1 = 0; t2 = tanLen > 0.007 ? x / tanLen : 0; comp1 = -z; comp2 = y; }
            else { t1 = tanLen > 0.007 ? x / tanLen : 0; t2 = 0; comp1 = y; comp2 = z; }

            if (xi === g.segmentsW)
            {
                vertexPositionData[index] = vertexPositionData[startIndex];
                vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];

                vertexNormalData[index] = vertexNormalData[startIndex] + x * normLen * 0.5;
                vertexNormalData[index + 1] = vertexNormalData[startIndex + 1] + comp1 * normLen * 0.5;
                vertexNormalData[index + 2] = vertexNormalData[startIndex + 2] + comp2 * normLen * 0.5;

                vertexTangentData[index] = tanLen > 0.007 ? -y / tanLen : 1;
                vertexTangentData[index + 1] = t1;
                vertexTangentData[index + 2] = t2;
            }
            else
            {
                vertexPositionData[index] = x;
                vertexPositionData[index + 1] = comp1;
                vertexPositionData[index + 2] = comp2;

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
    lg.uvs = buildSphereUVs(g);
    lg.indices = buildSphereIndices(g);
}

function buildSphereIndices(g: SphereGeometry): number[]
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

function buildSphereUVs(g: SphereGeometry): number[]
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

registerLogic('SphereGeometry', SphereGeometryLogic);
registerCloneFactory('SphereGeometry', (src: SphereGeometry) => createSphereGeometryWithData(src));
registerDefaultGeometryFactory('Sphere', createSphereGeometry);
