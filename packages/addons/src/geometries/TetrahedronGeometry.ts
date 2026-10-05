import { Geometry } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';
import { polyhedronGeometryLogic, type PolyhedronGeometry, type PolyhedronGeometryLogic } from './PolyhedronGeometry';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        TetrahedronGeometry: TetrahedronGeometryLogic;
    }
}

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
 * TetrahedronGeometryLogic 逻辑接口：注入四面体基底表后复用 {@link PolyhedronGeometryLogic} 引擎。
 */
export interface TetrahedronGeometryLogic extends PolyhedronGeometryLogic
{
}

/**
 * 工厂函数：TetrahedronGeometryLogic 的唯一创建入口（registerLogic 注册它）。
 *
 * @param data 几何数据（raw）
 */
export function tetrahedronGeometryLogic(data: TetrahedronGeometry): TetrahedronGeometryLogic
{
    const writable = data as UnReadonly<TetrahedronGeometry>;
    if (data.name === undefined) writable.name = 'Tetrahedron';
    if (data.scaleU === undefined) writable.scaleU = 1;
    if (data.scaleV === undefined) writable.scaleV = 1;
    if (data.radius === undefined) writable.radius = 1;
    if (data.detail === undefined) writable.detail = 0;

    // 4 顶点 4 面
    (writable as unknown as { __vertices: number[] }).__vertices = [
        1, 1, 1, -1, -1, 1, -1, 1, -1, 1, -1, -1,
    ];
    (writable as unknown as { __indices: number[] }).__indices = [
        2, 1, 0, 0, 3, 2, 1, 3, 0, 2, 3, 1,
    ];

    return polyhedronGeometryLogic(data as unknown as PolyhedronGeometry);
}

registerLogic('TetrahedronGeometry', tetrahedronGeometryLogic);
