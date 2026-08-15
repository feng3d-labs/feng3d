import { Geometry } from 'feng3d';
import { registerLogic, UnReadonly } from '@feng3d/reactivity';
import { PolyhedronGeometryLogic } from './PolyhedronGeometry';
import type { PolyhedronGeometry } from './PolyhedronGeometry';

declare module '@feng3d/reactivity'
{
    interface LogicMap
    {
        DodecahedronGeometry: DodecahedronGeometryLogic;
    }
}

declare module 'feng3d'
{
    export interface GeometryMap
    {
        DodecahedronGeometry: DodecahedronGeometry;
    }
}

/**
 * 正十二面体几何体（纯数据接口）。
 *
 * 20 顶点 12 面的正十二面体，通过 `detail` 控制细分。
 * 移植自 three.js DodecahedronGeometry，复用 PolyhedronGeometry 引擎。
 */
export interface DodecahedronGeometry extends Geometry
{
    readonly __type__: 'DodecahedronGeometry';
    readonly radius?: number;
    readonly detail?: number;
}

/**
 * DodecahedronGeometryLogic 逻辑类：注入十二面体基底表后复用 {@link PolyhedronGeometryLogic} 引擎。
 */
export class DodecahedronGeometryLogic extends PolyhedronGeometryLogic
{
    protected constructor(data: DodecahedronGeometry)
    {
        const writable = data as UnReadonly<DodecahedronGeometry>;
        if (data.name === undefined) writable.name = 'Dodecahedron';
        if (data.scaleU === undefined) writable.scaleU = 1;
        if (data.scaleV === undefined) writable.scaleV = 1;
        if (data.radius === undefined) writable.radius = 1;
        if (data.detail === undefined) writable.detail = 0;

        const t = (1 + Math.sqrt(5)) / 2;
        const r = 1 / t;

        (writable as unknown as { __vertices: number[] }).__vertices = [
            // (±1, ±1, ±1)
            -1, -1, -1, -1, -1, 1,
            -1, 1, -1, -1, 1, 1,
            1, -1, -1, 1, -1, 1,
            1, 1, -1, 1, 1, 1,
            // (0, ±1/φ, ±φ)
            0, -r, -t, 0, -r, t,
            0, r, -t, 0, r, t,
            // (±1/φ, ±φ, 0)
            -r, -t, 0, -r, t, 0,
            r, -t, 0, r, t, 0,
            // (±φ, 0, ±1/φ)
            -t, 0, -r, t, 0, -r,
            -t, 0, r, t, 0, r,
        ];
        (writable as unknown as { __indices: number[] }).__indices = [
            3, 11, 7, 3, 7, 15, 3, 15, 13,
            7, 19, 17, 7, 17, 6, 7, 6, 15,
            17, 4, 8, 17, 8, 10, 17, 10, 6,
            8, 0, 16, 8, 16, 2, 8, 2, 10,
            0, 12, 1, 0, 1, 18, 0, 18, 16,
            6, 10, 2, 6, 2, 13, 6, 13, 15,
            2, 16, 18, 2, 18, 3, 2, 3, 13,
            18, 1, 9, 18, 9, 11, 18, 11, 3,
            4, 14, 12, 4, 12, 0, 4, 0, 8,
            11, 9, 5, 11, 5, 19, 11, 19, 7,
            19, 5, 14, 19, 14, 4, 19, 4, 17,
            1, 12, 14, 1, 14, 5, 1, 5, 9,
        ];

        super(data as unknown as PolyhedronGeometry);
    }

    /**
     * 内部创建入口（protected constructor 的唯一出口）。
     *
     * 参数保持基类 create 的 PolyhedronGeometry 类型（两个 __type__ 字面量互斥，
     * 窄化为 DodecahedronGeometry 会违反静态侧兼容），内部断言回子类型构造。
     */
    static create(data: PolyhedronGeometry): DodecahedronGeometryLogic
    {
        return new DodecahedronGeometryLogic(data as unknown as DodecahedronGeometry);
    }
}

registerLogic('DodecahedronGeometry', DodecahedronGeometryLogic as unknown as new (data: DodecahedronGeometry) => DodecahedronGeometryLogic);
