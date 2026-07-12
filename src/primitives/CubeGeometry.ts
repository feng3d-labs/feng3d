import { Geometry, GeometryLogic, watchGeometryInvalid, registerCloneFactory, registerDefaultGeometryFactory } from '../geometry/Geometry';
import { registerLogic } from '@feng3d/reactivity';

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

// 注册默认值（缺失字段自动填充）
registerLogic('CubeGeometry', undefined, {
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
});

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

function buildDefaultColors(numVertex: number): number[]
{
    const colors: number[] = [];
    for (let i = 0; i < numVertex; i++)
    {
        colors.push(1, 1, 1, 1);
    }

    return colors;
}

export class CubeGeometryLogic extends GeometryLogic
{
    constructor(geometry: CubeGeometry)
    {
        super(geometry, () => buildCube(geometry, this));
        watchGeometryInvalid(geometry, ['width', 'height', 'depth', 'segmentsW', 'segmentsH', 'segmentsD', 'tile6'], this);
    }
}

function buildCube(g: CubeGeometry, lg: GeometryLogic): void
{
    lg.positions = buildCubePosition(g);
    lg.normals = buildCubeNormal(g);
    lg.tangents = buildCubeTangent(g);
    lg.uvs = buildCubeUVs(g);
    lg.indices = buildCubeIndices(g);
    lg.colors = buildDefaultColors(lg.positions.length / 3);
}

function buildCubePosition(g: CubeGeometry): number[]
{
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

    return data;
}

function buildCubeNormal(g: CubeGeometry): number[]
{
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

    return data;
}

function buildCubeTangent(g: CubeGeometry): number[]
{
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

    return data;
}

function buildCubeIndices(g: CubeGeometry): number[]
{
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

function buildCubeUVs(g: CubeGeometry): number[]
{
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

    return data;
}

registerLogic('CubeGeometry', CubeGeometryLogic);
registerCloneFactory('CubeGeometry', (src: CubeGeometry) => createCubeGeometryWithData(src));
registerDefaultGeometryFactory('Cube', createCubeGeometry);
