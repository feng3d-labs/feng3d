import { Geometry } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';
import { polyhedronGeometryLogic, type PolyhedronGeometry, type PolyhedronGeometryLogic } from './PolyhedronGeometry';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        OctahedronGeometry: OctahedronGeometryLogic;
    }
}

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
 * OctahedronGeometryLogic 逻辑接口：注入八面体基底表后复用 {@link PolyhedronGeometryLogic} 引擎。
 */
export interface OctahedronGeometryLogic extends PolyhedronGeometryLogic
{
}

/**
 * 工厂函数：OctahedronGeometryLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 几何数据（raw）
 */
export function octahedronGeometryLogic(data: OctahedronGeometry): OctahedronGeometryLogic
{
    const writable = data as UnReadonly<OctahedronGeometry>;
    if (data.name === undefined) writable.name = 'Octahedron';
    if (data.scaleU === undefined) writable.scaleU = 1;
    if (data.scaleV === undefined) writable.scaleV = 1;
    if (data.radius === undefined) writable.radius = 1;
    if (data.detail === undefined) writable.detail = 0;

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

    return polyhedronGeometryLogic(data as unknown as PolyhedronGeometry);
}

registerLogic('OctahedronGeometry', octahedronGeometryLogic);
