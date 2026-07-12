import { Geometry, GeometryLogic, watchGeometryInvalid, registerCloneFactory, registerDefaultGeometryFactory } from '../geometry/Geometry';
import { registerLogic } from '@feng3d/reactivity';

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        CylinderGeometry: CylinderGeometry;
    }
}

/**
 * 圆柱体几何体（纯数据接口）。
 */
export interface CylinderGeometry extends Geometry
{
    readonly __type__: 'CylinderGeometry';
    /** 顶部半径 */
    readonly topRadius: number;
    /** 底部半径 */
    readonly bottomRadius: number;
    /** 高度 */
    readonly height: number;
    /** 横向分割数 */
    readonly segmentsW: number;
    /** 纵向分割数 */
    readonly segmentsH: number;
    /** 顶部是否封口 */
    readonly topClosed: boolean;
    /** 底部是否封口 */
    readonly bottomClosed: boolean;
    /** 侧面是否封口 */
    readonly surfaceClosed: boolean;
    /** 是否朝上 */
    readonly yUp: boolean;
}

/**
 * 创建 CylinderGeometry 实例。
 */
export function createCylinderGeometry(): CylinderGeometry
{
    return {
        __type__: 'CylinderGeometry',
        name: 'Cylinder',
        scaleU: 1,
        scaleV: 1,
        topRadius: 0.5,
        bottomRadius: 0.5,
        height: 2,
        segmentsW: 16,
        segmentsH: 1,
        topClosed: true,
        bottomClosed: true,
        surfaceClosed: true,
        yUp: true,
    };
}

// 注册默认值（缺失字段自动填充）
registerLogic('CylinderGeometry', undefined, {
    name: 'Cylinder',
    scaleU: 1,
    scaleV: 1,
    topRadius: 0.5,
    bottomRadius: 0.5,
    height: 2,
    segmentsW: 16,
    segmentsH: 1,
    topClosed: true,
    bottomClosed: true,
    surfaceClosed: true,
    yUp: true,
});

/**
 * 按现有数据克隆一份 CylinderGeometry（用于 clone）。
 */
export function createCylinderGeometryWithData(src: CylinderGeometry): CylinderGeometry
{
    return {
        __type__: 'CylinderGeometry',
        name: src.name,
        scaleU: src.scaleU,
        scaleV: src.scaleV,
        topRadius: src.topRadius,
        bottomRadius: src.bottomRadius,
        height: src.height,
        segmentsW: src.segmentsW,
        segmentsH: src.segmentsH,
        topClosed: src.topClosed,
        bottomClosed: src.bottomClosed,
        surfaceClosed: src.surfaceClosed,
        yUp: src.yUp,
    };
}

export class CylinderGeometryLogic extends GeometryLogic
{
    constructor(geometry: CylinderGeometry)
    {
        super(geometry, () => buildCylinder(geometry, this));
        watchGeometryInvalid(geometry, ['topRadius', 'bottomRadius', 'height', 'segmentsW', 'segmentsH', 'topClosed', 'bottomClosed', 'surfaceClosed', 'yUp'], this);
    }
}

function buildCylinder(g: CylinderGeometry, lg: GeometryLogic): void
{
    let i: number; let j: number; let index = 0;
    let x: number; let y: number; let z: number; let radius: number; let revolutionAngle = 0;
    let comp1: number; let comp2: number; let startIndex = 0; let t1: number; let t2: number;

    const vertexPositionData: number[] = [];
    const vertexNormalData: number[] = [];
    const vertexTangentData: number[] = [];

    const revolutionAngleDelta = 2 * Math.PI / g.segmentsW;

    const addVertex = (px: number, py: number, pz: number, nx: number, ny: number, nz: number, tx: number, ty: number, tz: number) =>
    {
        vertexPositionData[index] = px; vertexPositionData[index + 1] = py; vertexPositionData[index + 2] = pz;
        vertexNormalData[index] = nx; vertexNormalData[index + 1] = ny; vertexNormalData[index + 2] = nz;
        vertexTangentData[index] = tx; vertexTangentData[index + 1] = ty; vertexTangentData[index + 2] = tz;
        index += 3;
    };

    // 顶部
    if (g.topClosed && g.topRadius > 0)
    {
        z = -0.5 * g.height;
        for (i = 0; i <= g.segmentsW; ++i)
        {
            if (g.yUp) { t1 = 1; t2 = 0; comp1 = -z; comp2 = 0; }
            else { t1 = 0; t2 = -1; comp1 = 0; comp2 = z; }
            addVertex(0, comp1, comp2, 0, t1, t2, 1, 0, 0);
            revolutionAngle = i * revolutionAngleDelta;
            x = g.topRadius * Math.cos(revolutionAngle);
            y = g.topRadius * Math.sin(revolutionAngle);
            if (g.yUp) { comp1 = -z; comp2 = y; }
            else { comp1 = y; comp2 = z; }
            if (i === g.segmentsW)
            {
                addVertex(vertexPositionData[startIndex + 3], vertexPositionData[startIndex + 4], vertexPositionData[startIndex + 5], 0, t1, t2, 1, 0, 0);
            }
            else
            {
                addVertex(x, comp1, comp2, 0, t1, t2, 1, 0, 0);
            }
        }
    }

    // 底部
    if (g.bottomClosed && g.bottomRadius > 0)
    {
        z = 0.5 * g.height;
        startIndex = index;
        for (i = 0; i <= g.segmentsW; ++i)
        {
            if (g.yUp) { t1 = -1; t2 = 0; comp1 = -z; comp2 = 0; }
            else { t1 = 0; t2 = 1; comp1 = 0; comp2 = z; }
            addVertex(0, comp1, comp2, 0, t1, t2, 1, 0, 0);
            revolutionAngle = i * revolutionAngleDelta;
            x = g.bottomRadius * Math.cos(revolutionAngle);
            y = g.bottomRadius * Math.sin(revolutionAngle);
            if (g.yUp) { comp1 = -z; comp2 = y; }
            else { comp1 = y; comp2 = z; }
            if (i === g.segmentsW)
            {
                addVertex(x, vertexPositionData[startIndex + 1], vertexPositionData[startIndex + 2], 0, t1, t2, 1, 0, 0);
            }
            else
            {
                addVertex(x, comp1, comp2, 0, t1, t2, 1, 0, 0);
            }
        }
    }

    // 侧面
    const dr = g.bottomRadius - g.topRadius;
    const latNormElev = dr / g.height;
    const latNormBase = (latNormElev === 0) ? 1 : g.height / dr;

    if (g.surfaceClosed)
    {
        let na0: number; let na1: number; let naComp1: number; let naComp2: number;
        for (j = 0; j <= g.segmentsH; ++j)
        {
            radius = g.topRadius - ((j / g.segmentsH) * (g.topRadius - g.bottomRadius));
            z = -(g.height / 2) + (j / g.segmentsH * g.height);
            startIndex = index;
            for (i = 0; i <= g.segmentsW; ++i)
            {
                revolutionAngle = i * revolutionAngleDelta;
                x = radius * Math.cos(revolutionAngle);
                y = radius * Math.sin(revolutionAngle);
                na0 = latNormBase * Math.cos(revolutionAngle);
                na1 = latNormBase * Math.sin(revolutionAngle);
                if (g.yUp)
                {
                    t1 = 0; t2 = -na0; comp1 = -z; comp2 = y;
                    naComp1 = latNormElev; naComp2 = na1;
                }
                else
                {
                    t1 = -na0; t2 = 0; comp1 = y; comp2 = z;
                    naComp1 = na1; naComp2 = latNormElev;
                }
                if (i === g.segmentsW)
                {
                    addVertex(vertexPositionData[startIndex], vertexPositionData[startIndex + 1], vertexPositionData[startIndex + 2],
                        na0, latNormElev, na1, na1, t1, t2);
                }
                else
                {
                    addVertex(x, comp1, comp2, na0, naComp1, naComp2, -na1, t1, t2);
                }
            }
        }
    }

    lg.positions = vertexPositionData;
    lg.normals = vertexNormalData;
    lg.tangents = vertexTangentData;
    lg.uvs = buildCylinderUVs(g);
    lg.indices = buildCylinderIndices(g);
}

function buildCylinderIndices(g: CylinderGeometry): number[]
{
    let i: number; let j: number; let index = 0;
    const indices: number[] = [];
    let n = 0;
    const addTriangleClockWise = (cwVertexIndex0: number, cwVertexIndex1: number, cwVertexIndex2: number) =>
    {
        indices[n++] = cwVertexIndex0;
        indices[n++] = cwVertexIndex1;
        indices[n++] = cwVertexIndex2;
    };

    if (g.topClosed && g.topRadius > 0)
    {
        for (i = 0; i <= g.segmentsW; ++i)
        {
            index += 2;
            if (i > 0) addTriangleClockWise(index - 1, index - 3, index - 2);
        }
    }
    if (g.bottomClosed && g.bottomRadius > 0)
    {
        for (i = 0; i <= g.segmentsW; ++i)
        {
            index += 2;
            if (i > 0) addTriangleClockWise(index - 2, index - 3, index - 1);
        }
    }
    if (g.surfaceClosed)
    {
        let a: number; let b: number; let c: number; let d: number;
        for (j = 0; j <= g.segmentsH; ++j) for (i = 0; i <= g.segmentsW; ++i)
        {
            index++;
            if (i > 0 && j > 0)
            {
                a = index - 1; b = index - 2;
                c = b - g.segmentsW - 1; d = a - g.segmentsW - 1;
                addTriangleClockWise(a, b, c);
                addTriangleClockWise(a, c, d);
            }
        }
    }

    return indices;
}

function buildCylinderUVs(g: CylinderGeometry): number[]
{
    let i: number; let j: number; let x: number; let y: number; let revolutionAngle: number;
    const data: number[] = [];
    const revolutionAngleDelta = 2 * Math.PI / g.segmentsW;
    let index = 0;
    if (g.topClosed)
    {
        for (i = 0; i <= g.segmentsW; ++i)
        {
            revolutionAngle = i * revolutionAngleDelta;
            x = 0.5 + 0.5 * -Math.cos(revolutionAngle);
            y = 0.5 + 0.5 * Math.sin(revolutionAngle);
            data[index++] = 0.5; data[index++] = 0.5;
            data[index++] = x; data[index++] = y;
        }
    }
    if (g.bottomClosed)
    {
        for (i = 0; i <= g.segmentsW; ++i)
        {
            revolutionAngle = i * revolutionAngleDelta;
            x = 0.5 + 0.5 * Math.cos(revolutionAngle);
            y = 0.5 + 0.5 * Math.sin(revolutionAngle);
            data[index++] = 0.5; data[index++] = 0.5;
            data[index++] = x; data[index++] = y;
        }
    }
    if (g.surfaceClosed)
    {
        for (j = 0; j <= g.segmentsH; ++j) for (i = 0; i <= g.segmentsW; ++i)
        {
            data[index++] = (i / g.segmentsW);
            data[index++] = (j / g.segmentsH);
        }
    }

    return data;
}

registerLogic('CylinderGeometry', CylinderGeometryLogic);
registerCloneFactory('CylinderGeometry', (src: CylinderGeometry) => createCylinderGeometryWithData(src));
registerDefaultGeometryFactory('Cylinder', createCylinderGeometry);
