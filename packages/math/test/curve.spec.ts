import { Vector3 } from '../src/geom/Vector3';
import { Curve } from '../src/shape/core/Curve';

import { describe, expect, it, vi } from 'vitest';

/**
 * `Curve`（`packages/math/src/shape/core/Curve.ts`，覆盖率口径 121 行，此前**行覆盖率 19.8%**）。
 *
 * 它是所有曲线的抽象基类：`getPoint` 是占位实现（告警 + 返回 `null`），子类必须覆写。
 * 所以这里用三个**取点规则完全可控**的测试子类，把基类算法（弧长、映射、切线、Frenet 框架）钉死：
 *
 * | 子类 | 取点 | 为什么用它 |
 * |---|---|---|
 * | `LineCurve` | `(t, 0, 0)` | 弧长与参数 t **线性** ⇒ 长度数组、等距点、u→t 映射都能精确算 |
 * | `ParabolaCurve` | `(t, t², 0)` | 二次曲线 ⇒ **中心差分恰好等于解析导数**，可精确钉 `getTangent` |
 * | `HelixCurve` | `(cos 2πt, sin 2πt, t)` | 真三维且弧长与 t 线性 ⇒ Frenet 框架可用解析切线验证 |
 */

/** 沿 x 轴从 0 到 1 的直线：弧长 = t */
class LineCurve extends Curve<Vector3>
{
    getPoint(t = 0, optionalTarget = new Vector3()): Vector3
    {
        return optionalTarget.set(t, 0, 0);
    }
}

/** 抛物线 (t, t², 0)：导数是 (1, 2t) */
class ParabolaCurve extends Curve<Vector3>
{
    getPoint(t = 0, optionalTarget = new Vector3()): Vector3
    {
        return optionalTarget.set(t, t * t, 0);
    }
}

/** 螺旋线 (cos 2πt, sin 2πt, t)：|dP/dt| 是常数 ⇒ 弧长与 t 线性 */
class HelixCurve extends Curve<Vector3>
{
    getPoint(t = 0, optionalTarget = new Vector3()): Vector3
    {
        const angle = Math.PI * 2 * t;

        return optionalTarget.set(Math.cos(angle), Math.sin(angle), t);
    }
}

/** 螺旋线在参数 t 处的解析切线（单位向量） */
function helixTangent(t: number)
{
    const angle = Math.PI * 2 * t;

    return new Vector3(-Math.sin(angle) * Math.PI * 2, Math.cos(angle) * Math.PI * 2, 1).normalize();
}

describe('Curve 基类（math/shape/core）', () =>
{
    describe('字段默认值', () =>
    {
        it('arcLengthDivisions = 200、needsUpdate = false、cacheArcLengths 未初始化', () =>
        {
            const curve = new Curve<Vector3>();

            expect(curve.arcLengthDivisions).toBe(200);
            expect(curve.needsUpdate).toBe(false);
            expect(curve.cacheArcLengths).toBeUndefined();
        });
    });

    describe('getResolution / getPoint 占位实现', () =>
    {
        it('getResolution 原样返回分段数（子类可覆写）', () =>
        {
            const curve = new Curve<Vector3>();

            expect(curve.getResolution(12)).toBe(12);
            expect(curve.getResolution(0)).toBe(0);
        });

        it('基类 getPoint 告警一次并返回 null（表示「未实现」）', () =>
        {
            const curve = new Curve<Vector3>();
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });

            expect(curve.getPoint(0.5)).toBeNull();
            expect(warn).toHaveBeenCalledTimes(1);

            warn.mockRestore();
        });
    });

    describe('getPoints / getSpacedPoints / getPointAt', () =>
    {
        it('getPoints(divisions) 返回 divisions + 1 个点，取 t = d / divisions', () =>
        {
            const points = new LineCurve().getPoints(4);

            expect(points.length).toBe(5);
            points.forEach((p, i) => expect(p.equals(new Vector3(i / 4, 0, 0), 1e-12)).toBe(true));

            // 端点
            expect(points[0].x).toBe(0);
            expect(points[4].x).toBe(1);
        });

        it('getPoints 的默认分段数是 5', () =>
        {
            expect(new LineCurve().getPoints().length).toBe(6);
        });

        it('getPointAt(u) 走弧长映射并返回传入的 optionalTarget 本身', () =>
        {
            const curve = new LineCurve();
            const target = new Vector3(-9, -9, -9);

            expect(curve.getPointAt(0.25, target)).toBe(target);
            expect(target.x).toBeCloseTo(0.25, 10);
            expect(target.y).toBe(0);
            expect(target.z).toBe(0);
        });

        it('直线曲线上 getSpacedPoints 与 getPoints 一致', () =>
        {
            const curve = new LineCurve();

            curve.getSpacedPoints(4).forEach((p, i) =>
            {
                expect(p.x).toBeCloseTo(i / 4, 10);
            });
        });

        it('getSpacedPoints 不传分段数时按 5 段处理', () =>
        {
            // 签名上是必填参数，但实现里对 undefined 有兜底分支；这里有意不传，覆盖该分支
            const points = (new LineCurve() as { getSpacedPoints(d?: number): Vector3[] }).getSpacedPoints();

            expect(points.length).toBe(6);
        });
    });

    describe('getLengths / getLength 与弧长缓存', () =>
    {
        it('直线曲线：指定分段数的累积长度是等差数列（精确）', () =>
        {
            const curve = new LineCurve();

            expect(curve.getLengths(4)).toEqual([0, 0.25, 0.5, 0.75, 1]);
        });

        it('getLength 等于累积长度的最后一项', () =>
        {
            const curve = new LineCurve();

            expect(curve.getLength()).toBeCloseTo(1, 10);
        });

        it('默认分段数是 arcLengthDivisions（200）⇒ 长度数组有 201 项', () =>
        {
            const curve = new LineCurve();

            expect(curve.getLengths().length).toBe(201);
            expect(curve.getLengths(10).length).toBe(11);
        });

        it('缓存命中时返回同一个数组；needsUpdate 之后重算', () =>
        {
            const curve = new LineCurve();

            const first = curve.getLengths(4);
            const cached = curve.getLengths(4);

            expect(cached).toBe(first);

            curve.needsUpdate = true;
            const recomputed = curve.getLengths(4);

            expect(recomputed).not.toBe(first);
            expect(recomputed).toEqual(first);
            expect(curve.needsUpdate).toBe(false);
        });

        it('updateArcLengths 刷新缓存并把 needsUpdate 复位', () =>
        {
            const curve = new LineCurve();

            curve.getLengths(4);
            curve.updateArcLengths();

            expect(curve.needsUpdate).toBe(false);
            expect(curve.cacheArcLengths.length).toBe(201);
            expect(curve.cacheArcLengths[200]).toBeCloseTo(1, 10);
        });
    });

    describe('getUtoTmapping', () =>
    {
        it('弧长与参数线性时 t === u', () =>
        {
            const curve = new LineCurve();

            for (const u of [0.1, 0.25, 0.5, 0.75, 0.9])
            {
                expect(curve.getUtoTmapping(u)).toBeCloseTo(u, 10);
            }
        });

        it('两端命中缓存里的精确值（走 arcLengths[i] === targetArcLength 分支）', () =>
        {
            const curve = new LineCurve();

            expect(curve.getUtoTmapping(0)).toBe(0);
            expect(curve.getUtoTmapping(1)).toBe(1);
        });

        it('传入 distance 时按距离映射（覆盖 u 的乘法）', () =>
        {
            const curve = new LineCurve();

            // 直线曲线：距离 0.25 ⇒ 参数 0.25
            expect(curve.getUtoTmapping(0.9, 0.25)).toBeCloseTo(0.25, 10);
            // distance = 0 是假值 ⇒ 仍然按 u 计算
            expect(curve.getUtoTmapping(0.5, 0)).toBeCloseTo(0.5, 10);
        });
    });

    describe('getTangent / getTangentAt', () =>
    {
        it('抛物线：中心差分恰好等于解析导数（1, 2t）', () =>
        {
            const curve = new ParabolaCurve();

            for (const t of [0.25, 0.5, 0.75])
            {
                const expected = new Vector3(1, 2 * t, 0).normalize();
                const tangent = curve.getTangent(t, new Vector3());

                expect(tangent.x).toBeCloseTo(expected.x, 6);
                expect(tangent.y).toBeCloseTo(expected.y, 6);
                expect(tangent.z).toBeCloseTo(0, 6);
            }
        });

        it('边界 t = 0 / t = 1 会把取样区间夹回 [0, 1]，方向仍然正确', () =>
        {
            const curve = new ParabolaCurve();

            // t = 0：解析切线 (1, 0, 0)
            const atStart = curve.getTangent(0, new Vector3());
            expect(atStart.x).toBeCloseTo(1, 6);
            expect(atStart.y).toBeCloseTo(0, 3);

            // t = 1：解析切线 (1, 2, 0) / √5。
            // 端点处 t + delta 被夹回 1，中心差分退化为单侧差分，误差是一阶的（~1e-4），故只要求 4 位
            const atEnd = curve.getTangent(1, new Vector3());
            expect(atEnd.x).toBeCloseTo(1 / Math.sqrt(5), 4);
            expect(atEnd.y).toBeCloseTo(2 / Math.sqrt(5), 4);
        });

        it('切线写入并返回传入的 optionalTarget（单位向量）', () =>
        {
            const curve = new LineCurve();
            const target = new Vector3();

            expect(curve.getTangent(0.5, target)).toBe(target);
            expect(target.x).toBeCloseTo(1, 10);
            expect(target.length).toBeCloseTo(1, 10);
        });

        it('getTangentAt(u) 等价于 getTangent(getUtoTmapping(u))', () =>
        {
            const curve = new ParabolaCurve();
            const byU = curve.getTangentAt(0.3, new Vector3());
            const byT = curve.getTangent(curve.getUtoTmapping(0.3), new Vector3());

            expect(byU.equals(byT, 1e-9)).toBe(true);
        });
    });

    describe('computeFrenetFrames', () =>
    {
        /**
         * 框架的三个向量在每个采样点上都必须是**单位向量且两两正交** ——
         * 这是 Frenet 框架的定义，与曲线的具体形状无关。
         */
        function expectOrthonormalFrames(frames: { tangents: Vector3[]; normals: Vector3[]; binormals: Vector3[] }, segments: number)
        {
            expect(frames.tangents.length).toBe(segments + 1);
            expect(frames.normals.length).toBe(segments + 1);
            expect(frames.binormals.length).toBe(segments + 1);

            for (let i = 0; i <= segments; i++)
            {
                const tangent = frames.tangents[i];
                const normal = frames.normals[i];
                const binormal = frames.binormals[i];

                expect(tangent.length, `tangents[${i}] 长度`).toBeCloseTo(1, 6);
                expect(normal.length, `normals[${i}] 长度`).toBeCloseTo(1, 6);
                expect(binormal.length, `binormals[${i}] 长度`).toBeCloseTo(1, 6);

                expect(Math.abs(tangent.dot(normal)), `t·n @${i}`).toBeLessThan(1e-6);
                expect(Math.abs(tangent.dot(binormal)), `t·b @${i}`).toBeLessThan(1e-6);
                expect(Math.abs(normal.dot(binormal)), `n·b @${i}`).toBeLessThan(1e-6);
            }
        }

        it('螺旋线：每个采样点都是正交单位框架，切线等于解析切线', () =>
        {
            const segments = 6;
            const frames = new HelixCurve().computeFrenetFrames(segments, false);

            expectOrthonormalFrames(frames, segments);

            // 螺旋线的弧长与 t 线性 ⇒ 第 i 个采样点就是 t = i / segments
            for (let i = 0; i <= segments; i++)
            {
                const expected = helixTangent(i / segments);
                // 端点（t = 0 / 1）的取样区间被夹回 [0, 1]，中心差分退化为单侧差分，精度约 1e-4
                const precision = (i === 0 || i === segments) ? 3 : 5;

                expect(frames.tangents[i].x, `t.x @${i}`).toBeCloseTo(expected.x, precision);
                expect(frames.tangents[i].y, `t.y @${i}`).toBeCloseTo(expected.y, precision);
                expect(frames.tangents[i].z, `t.z @${i}`).toBeCloseTo(expected.z, precision);
            }
        });

        it('直线曲线：相邻切线平行（走「不旋转」分支）仍是正交单位框架', () =>
        {
            expectOrthonormalFrames(new LineCurve().computeFrenetFrames(4, false), 4);
        });

        it('closed = true：同样是正交单位框架，且首尾法线经扭转后对齐', () =>
        {
            const segments = 8;
            const frames = new HelixCurve().computeFrenetFrames(segments, true);

            expectOrthonormalFrames(frames, segments);

            // 闭合后首尾法线被扭转对齐（内积接近 1）
            expect(frames.normals[0].dot(frames.normals[segments])).toBeGreaterThan(0.99);
        });
    });
});
