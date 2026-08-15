import { Geometry } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';
import { PolyhedronGeometryLogic } from './PolyhedronGeometry';
import type { PolyhedronGeometry } from './PolyhedronGeometry';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        IcosahedronGeometry: IcosahedronGeometryLogic;
    }
}

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
 * IcosahedronGeometryLogic 逻辑类：注入二十面体基底表后复用 {@link PolyhedronGeometryLogic} 引擎。
 */
export class IcosahedronGeometryLogic extends PolyhedronGeometryLogic
{
    protected constructor(data: IcosahedronGeometry)
    {
        const writable = data as UnReadonly<IcosahedronGeometry>;
        if (data.name === undefined) writable.name = 'Icosahedron';
        if (data.scaleU === undefined) writable.scaleU = 1;
        if (data.scaleV === undefined) writable.scaleV = 1;
        if (data.radius === undefined) writable.radius = 1;
        if (data.detail === undefined) writable.detail = 0;

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

        super(data as unknown as PolyhedronGeometry);
    }

    /**
     * 内部创建入口（protected constructor 的唯一出口）。
     *
     * 参数保持基类 create 的 PolyhedronGeometry 类型（两个 __type__ 字面量互斥，
     * 窄化为 IcosahedronGeometry 会违反静态侧兼容），内部断言回子类型构造。
     */
    static create(data: PolyhedronGeometry): IcosahedronGeometryLogic
    {
        return new IcosahedronGeometryLogic(data as unknown as IcosahedronGeometry);
    }
}

registerLogic('IcosahedronGeometry', IcosahedronGeometryLogic as unknown as new (data: IcosahedronGeometry) => IcosahedronGeometryLogic);
