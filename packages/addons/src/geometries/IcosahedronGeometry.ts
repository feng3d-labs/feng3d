import { Geometry, GeometryLogic, registerCloneFactory, registerDefaultGeometryFactory } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';
import { polyhedronGeometryLogic } from './PolyhedronGeometry';

declare module 'feng3d'
{
    export interface GeometryMap
    {
        IcosahedronGeometry: IcosahedronGeometry;
    }
}

/**
 * 二十面体几何体（纯数据接口）。
 *
 * 12 顶点 20 面的正二十面体，通过 `detail` 控制细分（细分后投影到 `radius` 球面）。
 * 移植自 three.js IcosahedronGeometry，复用 PolyhedronGeometry 引擎。
 */
export interface IcosahedronGeometry extends Geometry
{
    readonly __type__: 'IcosahedronGeometry';
    /** 外接球半径，默认 1 */
    readonly radius: number;
    /** 细分等级（0 = 不细分），默认 0 */
    readonly detail: number;
}

/**
 * 创建 IcosahedronGeometry logic：注入二十面体基底表后委托 polyhedronGeometryLogic。
 */
export function icosahedronGeometryLogic(geometry: IcosahedronGeometry): GeometryLogic
{
    const writable = geometry as UnReadonly<IcosahedronGeometry>;
    if (geometry.name === undefined) writable.name = 'Icosahedron';
    if (geometry.scaleU === undefined) writable.scaleU = 1;
    if (geometry.scaleV === undefined) writable.scaleV = 1;
    if (geometry.radius === undefined) writable.radius = 1;
    if (geometry.detail === undefined) writable.detail = 0;

    // 注入基底表（运行时隐藏字段）：golden ratio t=(1+√5)/2 的 12 顶点正二十面体
    const t = (1 + Math.sqrt(5)) / 2;
    (writable as unknown as { __vertices: number[] }).__vertices = [
        -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0,
        0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t,
        t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1,
    ];
    (writable as unknown as { __indices: number[] }).__indices = [
        0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11,
        1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
        3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9,
        4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1,
    ];

    return polyhedronGeometryLogic(geometry as unknown as import('./PolyhedronGeometry').PolyhedronGeometry);
}

registerLogic('IcosahedronGeometry', icosahedronGeometryLogic);
registerCloneFactory('IcosahedronGeometry', (src: IcosahedronGeometry) => ({ ...src }) as IcosahedronGeometry);
registerDefaultGeometryFactory('Icosahedron', () => ({ __type__: 'IcosahedronGeometry' } as IcosahedronGeometry));
