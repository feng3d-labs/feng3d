import { Geometry, GeometryLogic, registerCloneFactory, registerDefaultGeometryFactory } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';
import { polyhedronGeometryLogic } from './PolyhedronGeometry';

declare module 'feng3d'
{
    export interface GeometryMap
    {
        TetrahedronGeometry: TetrahedronGeometry;
    }
}

/**
 * 四面体几何体（纯数据接口）。
 *
 * 4 顶点 4 面的正四面体，移植自 three.js TetrahedronGeometry。
 */
export interface TetrahedronGeometry extends Geometry
{
    readonly __type__: 'TetrahedronGeometry';
    /** 外接球半径，默认 1 */
    readonly radius: number;
    /** 细分等级（0 = 不细分），默认 0 */
    readonly detail: number;
}

/**
 * 创建 TetrahedronGeometry logic：注入四面体基底表后委托 polyhedronGeometryLogic。
 */
export function tetrahedronGeometryLogic(geometry: TetrahedronGeometry): GeometryLogic
{
    const writable = geometry as UnReadonly<TetrahedronGeometry>;
    if (geometry.name === undefined) writable.name = 'Tetrahedron';
    if (geometry.scaleU === undefined) writable.scaleU = 1;
    if (geometry.scaleV === undefined) writable.scaleV = 1;
    if (geometry.radius === undefined) writable.radius = 1;
    if (geometry.detail === undefined) writable.detail = 0;

    // 4 顶点 4 面
    (writable as unknown as { __vertices: number[] }).__vertices = [
        1, 1, 1, -1, -1, 1, -1, 1, -1, 1, -1, -1,
    ];
    (writable as unknown as { __indices: number[] }).__indices = [
        2, 1, 0, 0, 3, 2, 1, 3, 0, 2, 3, 1,
    ];

    return polyhedronGeometryLogic(geometry as unknown as import('./PolyhedronGeometry').PolyhedronGeometry);
}

registerLogic('TetrahedronGeometry', tetrahedronGeometryLogic);
registerCloneFactory('TetrahedronGeometry', (src: TetrahedronGeometry) => ({ ...src }) as TetrahedronGeometry);
registerDefaultGeometryFactory('Tetrahedron', () => ({ __type__: 'TetrahedronGeometry' } as TetrahedronGeometry));
