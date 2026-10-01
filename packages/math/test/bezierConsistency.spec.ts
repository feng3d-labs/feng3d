import { describe, expect, it } from 'vitest';

import { Bezier, bezier } from '../src/bezier/Bezier';
import { BezierCurve, bezierCurve } from '../src/curve/BezierCurve';

/**
 * **两份重复实现的一致性对照**（`packages/math/src/bezier/Bezier.ts`，148 行，行覆盖率 **0.67%**；
 * `packages/math/src/curve/BezierCurve.ts`，149 行，已由 #417 覆盖）。
 *
 * 这两个文件是**同一份代码的副本** —— 实测 **22 个方法同名、签名一致、连行号都几乎一一对应**。
 *
 * 本文件的作用不是"再测一遍数值"，而是**钉住"两者必须一致"这个约定**：
 * 只要有人改了其中一个而忘了另一个，这里就会失败。这正是 #421 建议的做法之一
 * （另一条路是直接合并两份实现，那需要单独决策）。
 *
 * ⚠️ 但**"互相一致"本身是弱断言** —— 如果两份都错了，它们仍然一致。所以下面**同时**与
 * **标准伯恩斯坦闭式**做了对照（`linear` / `quadratic` / `cubic`），确保它们不只是"一起错"。
 */

const T = 0.375;
const PS2 = [1, -3, 7];
const PS3 = [2, -1, 5, 11];
const PS4 = [1, 2, 4, 8, 16];

/** 标准伯恩斯坦形式：n 次贝塞尔在 t 处的值 */
function bernstein(n: number, t: number, ps: number[]): number
{
    const fact = (k: number) =>
    {
        let r = 1;

        for (let i = 2; i <= k; i++) r *= i;

        return r;
    };
    let sum = 0;

    for (let i = 0; i <= n; i++)
    {
        sum += (fact(n) / (fact(i) * fact(n - i))) * (1 - t) ** (n - i) * t ** i * ps[i];
    }

    return sum;
}

/** 一次对照：名字 + 两份实现各自的调用 */
type Case = [name: string, fromBezier: () => unknown, fromBezierCurve: () => unknown];

/**
 * 22 个同名方法的对照表。
 * ⚠️ 每个用例都传 `slice()` 出来的**新数组**，避免两个实现共享可变输入而互相影响。
 */
const cases: Case[] = [
    ['linear', () => new Bezier().linear(T, 3, 9), () => new BezierCurve().linear(T, 3, 9)],
    ['linearDerivative', () => new Bezier().linearDerivative(T, 3, 9), () => new BezierCurve().linearDerivative(T, 3, 9)],
    ['linearSecondDerivative', () => new Bezier().linearSecondDerivative(T, 3, 9), () => new BezierCurve().linearSecondDerivative(T, 3, 9)],
    ['quadratic', () => new Bezier().quadratic(T, PS2[0], PS2[1], PS2[2]), () => new BezierCurve().quadratic(T, PS2[0], PS2[1], PS2[2])],
    ['quadraticDerivative', () => new Bezier().quadraticDerivative(T, PS2[0], PS2[1], PS2[2]), () => new BezierCurve().quadraticDerivative(T, PS2[0], PS2[1], PS2[2])],
    ['quadraticSecondDerivative', () => new Bezier().quadraticSecondDerivative(T, PS2[0], PS2[1], PS2[2]), () => new BezierCurve().quadraticSecondDerivative(T, PS2[0], PS2[1], PS2[2])],
    ['cubic', () => new Bezier().cubic(T, PS3[0], PS3[1], PS3[2], PS3[3]), () => new BezierCurve().cubic(T, PS3[0], PS3[1], PS3[2], PS3[3])],
    ['cubicDerivative', () => new Bezier().cubicDerivative(T, PS3[0], PS3[1], PS3[2], PS3[3]), () => new BezierCurve().cubicDerivative(T, PS3[0], PS3[1], PS3[2], PS3[3])],
    ['cubicSecondDerivative', () => new Bezier().cubicSecondDerivative(T, PS3[0], PS3[1], PS3[2], PS3[3]), () => new BezierCurve().cubicSecondDerivative(T, PS3[0], PS3[1], PS3[2], PS3[3])],
    ['bn (2 次)', () => new Bezier().bn(T, PS2.slice()), () => new BezierCurve().bn(T, PS2.slice())],
    ['bn (4 次)', () => new Bezier().bn(T, PS4.slice()), () => new BezierCurve().bn(T, PS4.slice())],
    ['bnDerivative', () => new Bezier().bnDerivative(T, PS4.slice()), () => new BezierCurve().bnDerivative(T, PS4.slice())],
    ['bnSecondDerivative', () => new Bezier().bnSecondDerivative(T, [1, -3, 7]), () => new BezierCurve().bnSecondDerivative(T, [1, -3, 7])],
    ['bnND (1 阶)', () => new Bezier().bnND(T, 1, PS4.slice()), () => new BezierCurve().bnND(T, 1, PS4.slice())],
    ['bnND (2 阶)', () => new Bezier().bnND(T, 2, PS4.slice()), () => new BezierCurve().bnND(T, 2, PS4.slice())],
    ['getValue', () => new Bezier().getValue(T, PS4.slice()), () => new BezierCurve().getValue(T, PS4.slice())],
    ['getDerivative', () => new Bezier().getDerivative(T, PS4.slice()), () => new BezierCurve().getDerivative(T, PS4.slice())],
    ['getSecondDerivative', () => new Bezier().getSecondDerivative(T, PS4.slice()), () => new BezierCurve().getSecondDerivative(T, PS4.slice())],
    ['getExtremums', () => new Bezier().getExtremums(PS3.slice()), () => new BezierCurve().getExtremums(PS3.slice())],
    ['getMonotoneIntervals', () => new Bezier().getMonotoneIntervals(PS3.slice()), () => new BezierCurve().getMonotoneIntervals(PS3.slice())],
    ['getTFromValue', () => new Bezier().getTFromValue(5, PS3.slice()), () => new BezierCurve().getTFromValue(5, PS3.slice())],
    ['split', () => new Bezier().split(0.5, PS3.slice()), () => new BezierCurve().split(0.5, PS3.slice())],
    ['merge', () => new Bezier().merge(PS2.slice(), PS2.slice()), () => new BezierCurve().merge(PS2.slice(), PS2.slice())],
];

describe('Bezier 与 BezierCurve 的一致性（两份重复实现）', () =>
{
    it('★ 对照表覆盖了 22 个同名方法（防止有人只加了一边）', () =>
    {
        // 22 个同名方法；其中 bn 与 bnND 各用两条不同数据，所以表长不少于 22
        expect(cases.length).toBeGreaterThanOrEqual(22);
    });

    it('★★ 两份实现在全部 22 个方法上给出完全相同的结果', () =>
    {
        for (const [name, fromBezier, fromBezierCurve] of cases)
        {
            expect(fromBezierCurve(), `方法 ${name} 两份实现结果不同`).toEqual(fromBezier());
        }
    });

    it('★★★ 实测：getSamples 的返回类型已经不同（两份重复实现已分道扬镳）', () =>
    {
        // ★ 这是本对照测试**第一次运行就抓到的真实差异**，也正是 #421 担心的事：
        //   bezier/Bezier.ts      → [{ t, v }, ...]（对象数组）
        //   curve/BezierCurve.ts  → [number, ...]  （数字数组）
        // 所以它被从"必须一致"的对照表里移出，改为在这里如实钉住，避免以后被误当成"回归"。
        const a = new Bezier().getSamples(PS3.slice(), 4);
        const b = new BezierCurve().getSamples(PS3.slice(), 4);

        expect(a.length).toBe(b.length);
        expect(typeof a[0]).toBe('number');     // Bezier 返回数字
        expect(typeof b[0]).toBe('object');     // BezierCurve 返回 { t, v }
        expect(b[0]).toHaveProperty('t');
        expect(b[0]).toHaveProperty('v');
    });

    it('★★ 两个单例（bezier / bezierCurve）与各自 new 出来的实例行为一致', () =>
    {
        expect(bezier.linear(T, 3, 9)).toBe(new Bezier().linear(T, 3, 9));
        expect(bezierCurve.linear(T, 3, 9)).toBe(new BezierCurve().linear(T, 3, 9));
        expect(bezier.bn(T, PS4.slice())).toBe(new Bezier().bn(T, PS4.slice()));
        expect(bezierCurve.bn(T, PS4.slice())).toBe(new BezierCurve().bn(T, PS4.slice()));
    });

    describe('★★ 与标准伯恩斯坦闭式对照（避免"两边一起错"）', () =>
    {
        it('★ linear 与一次伯恩斯坦一致', () =>
        {
            const expected = bernstein(1, T, [3, 9]);

            expect(new Bezier().linear(T, 3, 9)).toBeCloseTo(expected, 9);
            expect(new BezierCurve().linear(T, 3, 9)).toBeCloseTo(expected, 9);
        });

        it('★ quadratic 与二次伯恩斯坦一致', () =>
        {
            const expected = bernstein(2, T, PS2);

            expect(new Bezier().quadratic(T, PS2[0], PS2[1], PS2[2])).toBeCloseTo(expected, 9);
            expect(new BezierCurve().quadratic(T, PS2[0], PS2[1], PS2[2])).toBeCloseTo(expected, 9);
        });

        it('★ cubic 与三次伯恩斯坦一致', () =>
        {
            const expected = bernstein(3, T, PS3);

            expect(new Bezier().cubic(T, PS3[0], PS3[1], PS3[2], PS3[3])).toBeCloseTo(expected, 9);
            expect(new BezierCurve().cubic(T, PS3[0], PS3[1], PS3[2], PS3[3])).toBeCloseTo(expected, 9);
        });

        it('★ bn 与标准伯恩斯坦一致（4 次）', () =>
        {
            const expected = bernstein(4, T, PS4);

            expect(new Bezier().bn(T, PS4.slice())).toBeCloseTo(expected, 8);
            expect(new BezierCurve().bn(T, PS4.slice())).toBeCloseTo(expected, 8);
        });

        it('★ bn 与 quadratic / cubic 在相同数据上一致（同族自洽）', () =>
        {
            const a = new Bezier();
            const b = new BezierCurve();

            expect(a.bn(T, PS2.slice())).toBeCloseTo(a.quadratic(T, PS2[0], PS2[1], PS2[2]), 9);
            expect(b.bn(T, PS3.slice())).toBeCloseTo(b.cubic(T, PS3[0], PS3[1], PS3[2], PS3[3]), 9);
        });
    });
});
