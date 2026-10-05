import { describe, expect, it } from 'vitest';

import type { Gradient } from '../src/gradient/gradientOps';
import { gradientFromColors, gradientGetValue } from '../src/gradient/gradientOps';
import type { MinMaxGradient } from '../src/gradient/minMaxGradientOps';
import { minMaxGradientDefault, minMaxGradientGetValue } from '../src/gradient/minMaxGradientOps';
import { MinMaxGradientMode } from '../src/gradient/MinMaxGradientMode';

/**
 * `MinMaxGradient` 的纯函数层（issue #134 第二批「渐变族」）：原 class 已删除，
 * 形状 `MinMaxGradientLike` / `WritableMinMaxGradientLike` / `MinMaxGradient` 与纯函数都在
 * `packages/math/src/gradient/minMaxGradientOps.ts`。
 *
 * 按 `mode` 求色的"最小-最大渐变"容器。字段（都有默认值，且**默认 `Gradient` 是"纯白不透明"**）：
 *
 * ```ts
 * mode = MinMaxGradientMode.Color
 * color / colorMin / colorMax = { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }   // 默认白色不透明
 * gradient / gradientMin / gradientMax = { __type__: 'Gradient', ...gradientDefault() }
 * ```
 *
 * `minMaxGradientGetValue(g, time, randomBetween = Math.random())` 的**五个分支**（实测，全部明确）：
 *
 * | mode | 结果 |
 * |---|---|
 * | `Color` | `g.color` 的**副本**（忽略 `time`；copies 替代了原 class 的引用返回，见下） |
 * | `Gradient` | `gradientGetValue(g.gradient, time)` |
 * | `TwoColors` | `color4Mix(g.colorMin, g.colorMax, randomBetween)`（即原 `mixTo` 的语义） |
 * | `TwoGradients` | `gradientGetValue(g.gradientMin, time)` 与 `…Max…` 再按 `randomBetween` 混 |
 * | `RandomColor` | **`gradientGetValue(g.gradient, randomBetween)` —— `randomBetween` 被当作「时间」** |
 *
 * 未知 `mode` 时**兜底返回 `g.color` 的副本**。
 *
 * `TwoColors` / `TwoGradients` 的两端行为可以**精确断言**：`randomBetween = 0` 得 min、`= 1` 得 max
 * （因为 `color4Mix` 在 `rate=0` / `rate=1` 时分别等于起点 / 终点）。
 *
 * 删 class 带来的、**刻意的**差异：原 `getValue` 在 `Color` 分支与兜底分支返回 `this.color`
 * **本身**，现在一律复制进 `out`（纯函数不改入参、不把内部对象递出去）。
 */

describe('minMaxGradientOps（math/gradient）', () =>
{
    describe('★ 默认状态', () =>
    {
        it('★ mode 默认是 Color', () =>
        {
            expect(minMaxGradientDefault().mode).toBe(MinMaxGradientMode.Color);
        });

        it('★ 七个字段都有默认值，且判别字段正确', () =>
        {
            const g = minMaxGradientDefault();

            expect(g.color.__type__).toBe('Color4');
            expect(g.colorMin.__type__).toBe('Color4');
            expect(g.colorMax.__type__).toBe('Color4');
            expect(g.gradient.__type__).toBe('Gradient');
            expect(g.gradientMin.__type__).toBe('Gradient');
            expect(g.gradientMax.__type__).toBe('Gradient');
        });

        it('★★ 三个默认渐变是**各自独立**的对象（原 class 每个实例各 new 一个）', () =>
        {
            const g = minMaxGradientDefault();

            expect(g.gradient).not.toBe(g.gradientMin);
            expect(g.gradientMin).not.toBe(g.gradientMax);
            expect(g.gradient.colorKeys).not.toBe(g.gradientMin.colorKeys);
        });

        it('★ 默认 color 是白色不透明 (1,1,1,1)', () =>
        {
            const c = minMaxGradientDefault().color;

            expect(c.r).toBeCloseTo(1, 10);
            expect(c.g).toBeCloseTo(1, 10);
            expect(c.b).toBeCloseTo(1, 10);
            expect(c.a).toBeCloseTo(1, 10);
        });

        it('★★ 纯函数的缺省 out 不带判别字段；装配成 `MinMaxGradient` 要显式补', () =>
        {
            expect('__type__' in minMaxGradientDefault()).toBe(false);

            const g: MinMaxGradient = { __type__: 'MinMaxGradient', ...minMaxGradientDefault() };

            expect(g.__type__).toBe('MinMaxGradient');
            expect(minMaxGradientGetValue(g, 0).r).toBeCloseTo(1, 10);
        });
    });

    describe('★★ Color 模式：返回 color 的副本（忽略 time）', () =>
    {
        it('★★ 分量等于 color，但**不是同一个对象**（纯函数不把内部对象递出去）', () =>
        {
            const g = minMaxGradientDefault();

            g.mode = MinMaxGradientMode.Color;
            g.color = { __type__: 'Color4', r: 0.25, g: 0.5, b: 0.75, a: 1 };

            for (const time of [0, 0.5, 1])
            {
                const c = minMaxGradientGetValue(g, time);

                expect(c).not.toBe(g.color);
                expect(c.r).toBeCloseTo(0.25, 10);
                expect(c.g).toBeCloseTo(0.5, 10);
                expect(c.b).toBeCloseTo(0.75, 10);
                expect(c.a).toBeCloseTo(1, 10);
            }
        });

        it('★ 不同 time 给同一结果（该模式不使用 time）', () =>
        {
            const g = minMaxGradientDefault();

            g.mode = MinMaxGradientMode.Color;
            g.color = { __type__: 'Color4', r: 0.1, g: 0.2, b: 0.3, a: 0.4 };

            const a = minMaxGradientGetValue(g, 0);
            const b = minMaxGradientGetValue(g, 100);

            expect(a.r).toBeCloseTo(b.r, 10);
            expect(a.a).toBeCloseTo(b.a, 10);
            expect(a).not.toBe(b);
        });

        it('★ 传 out 就地写，且 out 与字段同一对象时也安全', () =>
        {
            const g = minMaxGradientDefault();

            g.color = { __type__: 'Color4', r: 0.1, g: 0.2, b: 0.3, a: 0.4 };
            const out = { r: 0, g: 0, b: 0, a: 0 };

            expect(minMaxGradientGetValue(g, 0, 0, out)).toBe(out);
            expect(out.r).toBeCloseTo(0.1, 10);

            // out === g.color：先读后写，结果不变
            minMaxGradientGetValue(g, 0, 0, g.color);
            expect(g.color.g).toBeCloseTo(0.2, 10);
        });
    });

    describe('★★ Gradient 模式：等于 gradientGetValue(g.gradient, time)', () =>
    {
        it('★★ 与直接调用纯函数的结果一致', () =>
        {
            const g = minMaxGradientDefault();

            g.mode = MinMaxGradientMode.Gradient;
            gradientFromColors([0xff0000, 0x0000ff], undefined, g.gradient);

            for (const time of [0, 0.25, 0.5, 0.75, 1])
            {
                const a = minMaxGradientGetValue(g, time);
                const b = gradientGetValue(g.gradient, time);

                expect(a.r, `time=${time} r`).toBeCloseTo(b.r, 10);
                expect(a.g, `time=${time} g`).toBeCloseTo(b.g, 10);
                expect(a.b, `time=${time} b`).toBeCloseTo(b.b, 10);
                expect(a.a, `time=${time} a`).toBeCloseTo(b.a, 10);
            }
        });
    });

    describe('★★ TwoColors 模式：在 colorMin / colorMax 之间插值', () =>
    {
        function twoColors()
        {
            const g = minMaxGradientDefault();

            g.mode = MinMaxGradientMode.TwoColors;
            g.colorMin = { __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 };
            g.colorMax = { __type__: 'Color4', r: 0, g: 0, b: 1, a: 1 };

            return g;
        }

        it('★★ randomBetween = 0 → 得到 colorMin', () =>
        {
            const c = minMaxGradientGetValue(twoColors(), 0.5, 0);

            expect(c.r).toBeCloseTo(1, 6);
            expect(c.g).toBeCloseTo(0, 6);
            expect(c.b).toBeCloseTo(0, 6);
        });

        it('★★ randomBetween = 1 → 得到 colorMax', () =>
        {
            const c = minMaxGradientGetValue(twoColors(), 0.5, 1);

            expect(c.r).toBeCloseTo(0, 6);
            expect(c.g).toBeCloseTo(0, 6);
            expect(c.b).toBeCloseTo(1, 6);
        });

        it('★ randomBetween = 0.5 → 分量平均（手算：0.5 / 0 / 0.5）', () =>
        {
            const c = minMaxGradientGetValue(twoColors(), 0.5, 0.5);

            expect(c.r).toBeCloseTo(0.5, 6);
            expect(c.g).toBeCloseTo(0, 6);
            expect(c.b).toBeCloseTo(0.5, 6);
            expect(c.a).toBeCloseTo(1, 6);
        });

        it('★ 该模式不使用 time（同一 randomBetween 下不同 time 结果相同）', () =>
        {
            const g = twoColors();
            const a = minMaxGradientGetValue(g, 0, 0.3);
            const b = minMaxGradientGetValue(g, 1, 0.3);

            expect(a.r).toBeCloseTo(b.r, 10);
            expect(a.b).toBeCloseTo(b.b, 10);
        });

        it('★★ 不改动 colorMin / colorMax', () =>
        {
            const g = twoColors();
            const before = JSON.stringify({ min: g.colorMin, max: g.colorMax });

            minMaxGradientGetValue(g, 0.5, 0.5);

            expect(JSON.stringify({ min: g.colorMin, max: g.colorMax })).toBe(before);
        });
    });

    describe('★★ TwoGradients 模式：两条渐变按 time 取色后再混合', () =>
    {
        function twoGradients()
        {
            const g = minMaxGradientDefault();

            g.mode = MinMaxGradientMode.TwoGradients;
            gradientFromColors([0xff0000, 0xff0000], undefined, g.gradientMin); // 恒定红
            gradientFromColors([0x0000ff, 0x0000ff], undefined, g.gradientMax); // 恒定蓝

            return g;
        }

        it('★★ randomBetween = 0 → 得到 gradientGetValue(gradientMin, time)', () =>
        {
            const g = twoGradients();
            const c = minMaxGradientGetValue(g, 0.5, 0);
            const expected = gradientGetValue(g.gradientMin, 0.5);

            expect(c.r).toBeCloseTo(expected.r, 6);
            expect(c.b).toBeCloseTo(expected.b, 6);
            expect(c.b).toBeCloseTo(0, 6);   // 红
        });

        it('★★ randomBetween = 1 → 得到 gradientGetValue(gradientMax, time)', () =>
        {
            const c = minMaxGradientGetValue(twoGradients(), 0.5, 1);

            expect(c.r).toBeCloseTo(0, 6);
            expect(c.b).toBeCloseTo(1, 6);   // 蓝
        });

        it('★ randomBetween = 0.5 → 两条渐变结果的平均', () =>
        {
            const g = twoGradients();
            const min = gradientGetValue(g.gradientMin, 0.5);
            const max = gradientGetValue(g.gradientMax, 0.5);
            const c = minMaxGradientGetValue(g, 0.5, 0.5);

            expect(c.r).toBeCloseTo((min.r + max.r) / 2, 6);
            expect(c.b).toBeCloseTo((min.b + max.b) / 2, 6);
        });
    });

    describe('★★ RandomColor 模式：randomBetween 被当作「时间」用', () =>
    {
        it('★★ 等于 gradientGetValue(g.gradient, randomBetween)', () =>
        {
            const g = minMaxGradientDefault();

            g.mode = MinMaxGradientMode.RandomColor;
            gradientFromColors([0xff0000, 0x0000ff], undefined, g.gradient);

            for (const randomBetween of [0, 0.25, 0.5, 0.75, 1])
            {
                const a = minMaxGradientGetValue(g, 0.5, randomBetween);
                const b = gradientGetValue(g.gradient, randomBetween);

                expect(a.r, `randomBetween=${randomBetween} r`).toBeCloseTo(b.r, 10);
                expect(a.b, `randomBetween=${randomBetween} b`).toBeCloseTo(b.b, 10);
            }
        });

        it('★★ 该模式不使用第一个参数 time（同一 randomBetween 下不同 time 结果相同）', () =>
        {
            const g = minMaxGradientDefault();

            g.mode = MinMaxGradientMode.RandomColor;
            gradientFromColors([0xff0000, 0x0000ff], undefined, g.gradient);

            const a = minMaxGradientGetValue(g, 0, 0.3);
            const b = minMaxGradientGetValue(g, 99, 0.3);

            expect(a.r).toBeCloseTo(b.r, 10);
            expect(a.b).toBeCloseTo(b.b, 10);
        });
    });

    describe('★ 兜底', () =>
    {
        it('★ 非法的 mode 会返回 color 的副本（switch 落空后的兜底）', () =>
        {
            const g = minMaxGradientDefault();

            g.color = { __type__: 'Color4', r: 0.2, g: 0.4, b: 0.6, a: 0.8 };
            g.mode = 999 as MinMaxGradientMode;

            const c = minMaxGradientGetValue(g, 0.5);

            expect(c).not.toBe(g.color);
            expect(c.r).toBeCloseTo(0.2, 10);
            expect(c.g).toBeCloseTo(0.4, 10);
            expect(c.b).toBeCloseTo(0.6, 10);
            expect(c.a).toBeCloseTo(0.8, 10);
        });
    });

    describe('★ 与 Gradient 的接线（两条链都用同一份纯函数实现）', () =>
    {
        it('★★ Gradient 模式下改渐变数据，minMaxGradientGetValue 跟着变', () =>
        {
            const g = minMaxGradientDefault();

            g.mode = MinMaxGradientMode.Gradient;
            gradientFromColors([0xff0000, 0xff0000], undefined, g.gradient);
            expect(minMaxGradientGetValue(g, 0.5).r).toBeCloseTo(1, 6);

            gradientFromColors([0x0000ff, 0x0000ff], undefined, g.gradient);
            expect(minMaxGradientGetValue(g, 0.5).b).toBeCloseTo(1, 6);
            expect(minMaxGradientGetValue(g, 0.5).r).toBeCloseTo(0, 6);
        });

        it('★ 类型接线：`gradientFromColors` 的产物可直接当 `Gradient` 字段用', () =>
        {
            const g = minMaxGradientDefault();
            const built: Gradient = { __type__: 'Gradient', ...gradientFromColors([0xff0000, 0x0000ff]) };

            g.gradient = built;
            g.mode = MinMaxGradientMode.Gradient;

            expect(minMaxGradientGetValue(g, 0).r).toBeCloseTo(1, 6);
        });
    });
});
