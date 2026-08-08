import { Geometry, GeometryLogic, registerDefaultGeometryFactory } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';
import { polyhedronGeometryLogic } from './PolyhedronGeometry';

declare module 'feng3d'
{
    export interface GeometryMap
    {
        OctahedronGeometry: OctahedronGeometry;
    }
}

/**
 * 八面体几何体（纯数据接口）。
 *
 * 6 顶点（±X/±Y/±Z 轴向）8 面的正八面体，移植自 three.js OctahedronGeometry。
 */
export interface OctahedronGeometry extends Geometry
{
    readonly __type__: 'OctahedronGeometry';
    /** 外接球半径，默认 1 */
    readonly radius: number;
    /** 细分等级（0 = 不细分），默认 0 */
    readonly detail: number;
}

/**
 * 创建 OctahedronGeometry logic：注入八面体基底表后委托 polyhedronGeometryLogic。
 */
export function octahedronGeometryLogic(geometry: OctahedronGeometry): GeometryLogic
{
    const writable = geometry as UnReadonly<OctahedronGeometry>;
    if (geometry.name === undefined) writable.name = 'Octahedron';
    if (geometry.scaleU === undefined) writable.scaleU = 1;
    if (geometry.scaleV === undefined) writable.scaleV = 1;
    if (geometry.radius === undefined) writable.radius = 1;
    if (geometry.detail === undefined) writable.detail = 0;

    // 6 轴向顶点（±X/±Y/±Z），8 面
    (writable as unknown as { __vertices: number[] }).__vertices = [
        1, 0, 0, -1, 0, 0, 0, 1, 0,
        0, -1, 0, 0, 0, 1, 0, 0, -1,
    ];
    (writable as unknown as { __indices: number[] }).__indices = [
        0, 2, 4, 0, 4, 3, 0, 3, 5,
        0, 5, 2, 1, 2, 5, 1, 5, 3,
        1, 3, 4, 1, 4, 2,
    ];

    return polyhedronGeometryLogic(geometry as unknown as import('./PolyhedronGeometry').PolyhedronGeometry);
}

registerLogic('OctahedronGeometry', octahedronGeometryLogic);
registerDefaultGeometryFactory('Octahedron', () => ({ __type__: 'OctahedronGeometry' } as OctahedronGeometry));
