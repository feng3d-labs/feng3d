import { Geometry, GeometryLogic, createGeometryAttributes, watchGeometryInvalid, registerCloneFactory, registerDefaultGeometryFactory } from '../geometry/Geometry';
import { registerLogic } from '@feng3d/reactivity';
import { Index } from '../render/data/Index';

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        PlaneGeometry: PlaneGeometry;
    }
}

/**
 * 平面几何体（纯数据接口）。
 */
export interface PlaneGeometry extends Geometry
{
    readonly __type__: 'PlaneGeometry';
    /** 宽度 */
    readonly width: number;
    /** 高度 */
    readonly height: number;
    /** 横向分割数 */
    readonly segmentsW: number;
    /** 纵向分割数 */
    readonly segmentsH: number;
    /** 是否朝上 */
    readonly yUp: boolean;
}

/**
 * 创建 PlaneGeometry 实例。
 */
export function createPlaneGeometry(): PlaneGeometry
{
    return {
        __type__: 'PlaneGeometry',
        name: 'Plane',
        scaleU: 1,
        scaleV: 1,
        width: 1,
        height: 1,
        segmentsW: 1,
        segmentsH: 1,
        yUp: true,
    };
}

// 注册默认值（缺失字段自动填充）
registerLogic('PlaneGeometry', undefined, {
    name: 'Plane',
    scaleU: 1,
    scaleV: 1,
    width: 1,
    height: 1,
    segmentsW: 1,
    segmentsH: 1,
    yUp: true,
});

/**
 * 按现有数据克隆一份 PlaneGeometry（用于 clone）。
 */
export function createPlaneGeometryWithData(src: PlaneGeometry): PlaneGeometry
{
    return {
        __type__: 'PlaneGeometry',
        name: src.name,
        scaleU: src.scaleU,
        scaleV: src.scaleV,
        width: src.width,
        height: src.height,
        segmentsW: src.segmentsW,
        segmentsH: src.segmentsH,
        yUp: src.yUp,
    };
}

export class PlaneGeometryLogic extends GeometryLogic
{
    constructor(geometry: PlaneGeometry)
    {
        super(geometry);
        this.attributes = createGeometryAttributes();
        this.indexBuffer = new Index();
        watchGeometryInvalid(geometry, ['width', 'height', 'segmentsW', 'segmentsH', 'yUp'], this);
    }

    buildGeometry(): void
    {
        buildPlane(this._geometry as PlaneGeometry, this);
    }
}

function buildPlane(g: PlaneGeometry, lg: GeometryLogic): void
{
    const positions: number[] = [];
    const normals: number[] = [];
    const tangents: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const tw = g.segmentsW + 1;
    let pi = 0; let ni = 0; let ti = 0; let ui = 0; let ii = 0;

    for (let yi = 0; yi <= g.segmentsH; ++yi)
    {
        for (let xi = 0; xi <= g.segmentsW; ++xi)
        {
            const x = (xi / g.segmentsW - 0.5) * g.width;
            const y = (yi / g.segmentsH - 0.5) * g.height;
            positions[pi++] = x;
            if (g.yUp) { positions[pi++] = 0; positions[pi++] = y; }
            else { positions[pi++] = y; positions[pi++] = 0; }

            normals[ni++] = 0;
            if (g.yUp) { normals[ni++] = 1; normals[ni++] = 0; }
            else { normals[ni++] = 0; normals[ni++] = 1; }

            if (g.yUp) { tangents[ti++] = 1; tangents[ti++] = 0; tangents[ti++] = 0; }
            else { tangents[ti++] = -1; tangents[ti++] = 0; tangents[ti++] = 0; }

            if (g.yUp) { uvs[ui++] = xi / g.segmentsW; uvs[ui++] = 1 - yi / g.segmentsH; }
            else { uvs[ui++] = 1 - xi / g.segmentsW; uvs[ui++] = 1 - yi / g.segmentsH; }

            if (xi !== g.segmentsW && yi !== g.segmentsH)
            {
                const b = xi + yi * tw;
                if (g.yUp)
                {
                    indices[ii++] = b; indices[ii++] = b + tw; indices[ii++] = b + tw + 1;
                    indices[ii++] = b; indices[ii++] = b + tw + 1; indices[ii++] = b + 1;
                }
                else
                {
                    indices[ii++] = b; indices[ii++] = b + tw + 1; indices[ii++] = b + tw;
                    indices[ii++] = b; indices[ii++] = b + 1; indices[ii++] = b + tw + 1;
                }
            }
        }
    }

    lg.positions = positions;
    lg.normals = normals;
    lg.tangents = tangents;
    lg.uvs = uvs;
    lg.indices = indices;
}

registerLogic('PlaneGeometry', PlaneGeometryLogic);
registerCloneFactory('PlaneGeometry', (src: PlaneGeometry) => createPlaneGeometryWithData(src));
registerDefaultGeometryFactory('Plane', createPlaneGeometry);
