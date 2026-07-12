import { Geometry, GeometryLogic, createGeometryAttributes, registerCloneFactory, registerDefaultGeometryFactory } from '../geometry/Geometry';
import { registerLogic } from '@feng3d/reactivity';
import { geometryUtils } from '../geometry/GeometryUtils';
import { Index } from '../render/data/Index';

declare module '../geometry/Geometry'
{
    export interface GeometryMap
    {
        QuadGeometry: QuadGeometry;
    }
}

/**
 * 四边形面皮几何体（纯数据接口，无构造参数）。
 */
export interface QuadGeometry extends Geometry
{
    readonly __type__: 'QuadGeometry';
}

/**
 * 创建 QuadGeometry 实例。
 */
export function createQuadGeometry(): QuadGeometry
{
    return {
        __type__: 'QuadGeometry',
        name: 'Quad',
        scaleU: 1,
        scaleV: 1,
    };
}

export class QuadGeometryLogic extends GeometryLogic
{
    constructor(geometry: Geometry)
    {
        super(geometry);
        this.attributes = createGeometryAttributes();
        this.indexBuffer = new Index();
    }

    buildGeometry(): void
    {
        buildQuad(this);
    }
}

function buildQuad(lg: GeometryLogic): void
{
    const size = 0.5;
    lg.positions = [-size, size, 0, size, size, 0, size, -size, 0, -size, -size, 0];
    lg.uvs = [0, 0, 1, 0, 1, 1, 0, 1];
    lg.indices = [0, 1, 2, 0, 2, 3];
    lg.normals = geometryUtils.createVertexNormals(lg.indices, lg.positions, true);
    lg.tangents = geometryUtils.createVertexTangents(lg.indices, lg.positions, lg.uvs, true);
}

registerLogic('QuadGeometry', QuadGeometryLogic);
registerCloneFactory('QuadGeometry', () => createQuadGeometry());
registerDefaultGeometryFactory('Quad', createQuadGeometry);
