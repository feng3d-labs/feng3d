import { Geometry } from '../geometry/Geometry';

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
