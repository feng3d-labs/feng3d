import { describe, expect, it } from 'vitest';
import { Vector3, Vector4 } from '@feng3d/math';

import { klein, mobius, mobius3d, plane } from '../src/geometries/ParametricFunctions';
import { NURBSCurve } from '../src/curves/NURBSCurve';

/**
 * `addons` 里最后两个没被碰过的"纯数学"文件。
 *
 * 它们不需要 GPU、不需要场景树，也不需要 `feng3d` 的注册机制 —— 是这一包里最适合单测的形态。
 *
 * - `ParametricFunctions.ts`（4 个纯函数，约定 `(u, v) => Vector3`）；
 * - `NURBSCurve.ts`（B 样条曲线，`getPoint(t)` / `getPoints(n)`）。
 */

describe('ParametricFunctions（addons）', () =>
{
    it('plane：精确公式 x = u, y = 0, z = v', () =>
    {
        const p = plane(0.25, 0.75);

        expect(p.x).toBeCloseTo(0.25, 10);
        expect(p.y).toBe(0);
        expect(p.z).toBeCloseTo(0.75, 10);
    });

    it('★ mobius：u = 0.5 时宽度项为 0，点落在半径 2 的圆上', () =>
    {
        // uu = u - 0.5 = 0 → x = cos(vv) * 2, y = sin(vv) * 2（a = 2）
        for (const v of [0, 0.125, 0.25, 0.5, 0.75, 1])
        {
            const p = mobius(0.5, v);
            const radius = Math.sqrt(p.x * p.x + p.y * p.y);

            expect(radius, `v=${v}`).toBeCloseTo(2, 6);
        }
    });

    it('mobius：宽度方向 u 偏离 0.5 会改变半径（宽度确实生效）', () =>
    {
        const center = mobius(0.5, 0.25);
        const edge = mobius(0.0, 0.25);

        const rc = Math.sqrt(center.x * center.x + center.y * center.y);
        const re = Math.sqrt(edge.x * edge.x + edge.y * edge.y);

        // u=0 → uu=-0.5，半径变成 |2 - 0.5*cos(vv/2)| 一类，总之与中心不同
        expect(re).not.toBeCloseTo(rc, 6);
    });

    it('mobius3d：所有参数下都是有限数（且与 mobius 的 x/y 一致或相关）', () =>
    {
        for (const u of [0, 0.25, 0.5, 0.75, 1])
        {
            for (const v of [0, 0.25, 0.5, 0.75, 1])
            {
                const p = mobius3d(u, v);
                expect(Number.isFinite(p.x), `u=${u} v=${v} x`).toBe(true);
                expect(Number.isFinite(p.y), `u=${u} v=${v} y`).toBe(true);
                expect(Number.isFinite(p.z), `u=${u} v=${v} z`).toBe(true);
            }
        }
    });

    it('★ klein：两段分支（uu2 < π 与 ≥ π）都能算出有限值', () =>
    {
        // uIn = v、uu = vIn * π、uu2 = 2*π*vIn → uu2 < π 当且仅当 vIn < 0.5。
        // 这里 uIn = v（第二个形参），所以用 v 扫过 0.5 两侧即可覆盖两个分支。
        const samples: [number, number][] = [];
        for (const u of [0, 0.25, 0.5, 0.75, 1])
        {
            for (const v of [0, 0.25, 0.49, 0.5, 0.51, 0.75, 1]) samples.push([u, v]);
        }

        for (const [u, v] of samples)
        {
            const p = klein(u, v);
            for (const [label, value] of [['x', p.x], ['y', p.y], ['z', p.z]] as const)
            {
                expect(Number.isFinite(value), `klein(${u}, ${v}).${label}`).toBe(true);
            }
        }
    });

    it('四个函数都返回新对象（不复用内部缓冲）', () =>
    {
        const a = plane(0.1, 0.2);
        const b = plane(0.1, 0.2);

        expect(a).not.toBe(b);
        expect(a).toEqual(b);   // Vector3 应实现值相等

        for (const f of [klein, mobius, mobius3d])
        {
            const p1 = f(0.3, 0.7);
            const p2 = f(0.3, 0.7);
            expect(p1).not.toBe(p2);
            expect(p1).toEqual(p2);
        }
    });
});

describe('NURBSCurve（addons）', () =>
{
    /** 一条沿 X 轴的直线：degree=1、clamped 结点、两个控制点 */
    function lineCurve(): NURBSCurve
    {
        return new NURBSCurve(1, [0, 0, 1, 1], [
            { x: 0, y: 0, z: 0 },
            { x: 10, y: 0, z: 0 },
        ]);
    }

    it('★ controlPoints 里的普通对象被转成 Vector4，w 默认为 1', () =>
    {
        const curve = new NURBSCurve(1, [0, 0, 1, 1], [{ x: 1, y: 2, z: 3 }]);

        expect(curve.controlPoints.length).toBe(1);
        expect(curve.controlPoints[0]).toBeInstanceOf(Vector4);
        expect(curve.controlPoints[0].x).toBe(1);
        expect(curve.controlPoints[0].y).toBe(2);
        expect(curve.controlPoints[0].z).toBe(3);
        expect(curve.controlPoints[0].w).toBe(1);
    });

    it('已经是 Vector4 的控制点被原样保留（不复制）', () =>
    {
        const v = new Vector4(1, 2, 3, 4);
        const curve = new NURBSCurve(1, [0, 0, 1, 1], [v]);

        expect(curve.controlPoints[0]).toBe(v);
    });

    it('getPoint(0) / getPoint(1) 落在曲线两端', () =>
    {
        const curve = lineCurve();

        const start = curve.getPoint(0);
        const end = curve.getPoint(1);

        expect(start.x).toBeCloseTo(0, 6);
        expect(end.x).toBeCloseTo(10, 6);
        expect(start.y).toBeCloseTo(0, 6);
        expect(end.y).toBeCloseTo(0, 6);
    });

    it('直线曲线：中点也在直线上（y、z 保持 0）', () =>
    {
        const curve = lineCurve();
        const mid = curve.getPoint(0.5);

        expect(Number.isFinite(mid.x)).toBe(true);
        expect(mid.y).toBeCloseTo(0, 6);
        expect(mid.z).toBeCloseTo(0, 6);
    });

    it('★ getPoints(n) 返回 n + 1 个点（实现是 i <= numSamples）', () =>
    {
        const curve = lineCurve();

        expect(curve.getPoints(0).length).toBe(1);
        expect(curve.getPoints(1).length).toBe(2);
        expect(curve.getPoints(4).length).toBe(5);
        expect(curve.getPoints(10).length).toBe(11);
    });

    it('getPoints 的首尾与 getPoint(0) / getPoint(1) 一致', () =>
    {
        const curve = lineCurve();
        const points = curve.getPoints(6);

        expect(points[0].x).toBeCloseTo(curve.getPoint(0).x, 6);
        expect(points[points.length - 1].x).toBeCloseTo(curve.getPoint(1).x, 6);
    });

    it('target 参数被复用（返回同一个对象）', () =>
    {
        const curve = lineCurve();
        const target = new Vector3();

        const returned = curve.getPoint(0.3, target);

        expect(returned).toBe(target);
    });

    it('startKnot / endKnot 默认取首末结点', () =>
    {
        const knots = [0, 0, 1, 1];
        const curve = new NURBSCurve(1, knots, [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }]);

        expect(curve.startKnot).toBe(0);
        expect(curve.endKnot).toBe(knots.length - 1);
        expect(curve.knots).toBe(knots);
    });

    it('不产生 NaN（沿 t 扫一遍）', () =>
    {
        const curve = lineCurve();

        for (let i = 0; i <= 20; i++)
        {
            const p = curve.getPoint(i / 20);
            for (const [label, value] of [['x', p.x], ['y', p.y], ['z', p.z]] as const)
            {
                expect(Number.isFinite(value), `t=${i / 20} ${label}`).toBe(true);
            }
        }
    });
});
