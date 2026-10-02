import { describe, expect, it } from 'vitest';

import { Gradient } from '../src/gradient/Gradient';
import { MinMaxGradient } from '../src/gradient/MinMaxGradient';
import { MinMaxGradientMode } from '../src/gradient/MinMaxGradientMode';

/**
 * `MinMaxGradient`（`packages/math/src/gradient/MinMaxGradient.ts`，81 行源文件，此前**行覆盖率 55%**）。
 *
 * 按 `mode` 求色的"最小-最大渐变"容器。字段（都有默认值，且**默认 `Gradient` 是"纯白不透明"**）：
 *
 * ```ts
 * mode = MinMaxGradientMode.Color
 * color / colorMin / colorMax = { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 }   // 默认白色不透明
 * gradient / gradientMin / gradientMax = new Gradient()
 * ```
 *
 * `getValue(time, randomBetween = Math.random())` 的**五个分支**（实测，全部明确）：
 *
 * | mode | 返回 |
 * |---|---|
 * | `Color` | **直接返回 `this.color`（同一个对象，忽略 `time`）** |
 * | `Gradient` | `this.gradient.getValue(time)` |
 * | `TwoColors` | `color4Mix(this.colorMin, this.colorMax, randomBetween)`（即原 `mixTo` 的语义） |
 * | `TwoGradients` | `gradientMin.getValue(time)` 与 `gradientMax.getValue(time)` 再按 `randomBetween` 混 |
 * | `RandomColor` | **`this.gradient.getValue(randomBetween)` —— `randomBetween` 被当作「时间」** |
 *
 * 未知 `mode` 时**兜底返回 `this.color`**。
 *
 * `TwoColors` / `TwoGradients` 的两端行为可以**精确断言**：`randomBetween = 0` 得 min、`= 1` 得 max
 * （因为 `color4Mix` 在 `rate=0` / `rate=1` 时分别等于起点 / 终点）。
 *
 * **阶段 C-b 起** math 的 `Color3` / `Color4` class 已删除，颜色字段改在装配点写
 * `{ __type__: 'Color4', … }` 字面量，原来的 `toBeInstanceOf(Color4)` 断言改为 `__type__` 判别断言。
 */

describe('MinMaxGradient（math/gradient）', () =>
{
    describe('★ 默认状态', () =>
    {
        it('★ mode 默认是 Color', () =>
        {
            expect(new MinMaxGradient().mode).toBe(MinMaxGradientMode.Color);
        });

        it('★ 六个字段都有默认值，且类型正确', () =>
        {
            const g = new MinMaxGradient();

            expect(g.color.__type__).toBe('Color4');
            expect(g.colorMin.__type__).toBe('Color4');
            expect(g.colorMax.__type__).toBe('Color4');
            expect(g.gradient).toBeInstanceOf(Gradient);
            expect(g.gradientMin).toBeInstanceOf(Gradient);
            expect(g.gradientMax).toBeInstanceOf(Gradient);
        });

        it('★ 默认 color 是白色不透明 (1,1,1,1)', () =>
        {
            const c = new MinMaxGradient().color;

            expect(c.r).toBeCloseTo(1, 10);
            expect(c.g).toBeCloseTo(1, 10);
            expect(c.b).toBeCloseTo(1, 10);
            expect(c.a).toBeCloseTo(1, 10);
        });
    });

    describe('★★ Color 模式：直接返回 this.color（忽略 time）', () =>
    {
        it('★★ 返回的就是 this.color 那个对象', () =>
        {
            const g = new MinMaxGradient();

            g.mode = MinMaxGradientMode.Color;
            g.color = { __type__: 'Color4', r: 0.25, g: 0.5, b: 0.75, a: 1 };

            expect(g.getValue(0)).toBe(g.color);
            expect(g.getValue(0.5)).toBe(g.color);
            expect(g.getValue(1)).toBe(g.color);
        });

        it('★ 不同 time 给同一结果（该模式不使用 time）', () =>
        {
            const g = new MinMaxGradient();

            g.mode = MinMaxGradientMode.Color;
            g.color = { __type__: 'Color4', r: 0.1, g: 0.2, b: 0.3, a: 0.4 };

            const a = g.getValue(0);
            const b = g.getValue(100);

            expect(a).toBe(b);
        });
    });

    describe('★★ Gradient 模式：等于 gradient.getValue(time)', () =>
    {
        it('★★ 与直接调用 gradient.getValue(time) 结果一致', () =>
        {
            const g = new MinMaxGradient();

            g.mode = MinMaxGradientMode.Gradient;
            g.gradient.fromColors([0xff0000, 0x0000ff]);

            for (const time of [0, 0.25, 0.5, 0.75, 1])
            {
                const a = g.getValue(time);
                const b = g.gradient.getValue(time);

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
            const g = new MinMaxGradient();

            g.mode = MinMaxGradientMode.TwoColors;
            g.colorMin = { __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 };
            g.colorMax = { __type__: 'Color4', r: 0, g: 0, b: 1, a: 1 };

            return g;
        }

        it('★★ randomBetween = 0 → 得到 colorMin', () =>
        {
            const c = twoColors().getValue(0.5, 0);

            expect(c.r).toBeCloseTo(1, 6);
            expect(c.g).toBeCloseTo(0, 6);
            expect(c.b).toBeCloseTo(0, 6);
        });

        it('★★ randomBetween = 1 → 得到 colorMax', () =>
        {
            const c = twoColors().getValue(0.5, 1);

            expect(c.r).toBeCloseTo(0, 6);
            expect(c.g).toBeCloseTo(0, 6);
            expect(c.b).toBeCloseTo(1, 6);
        });

        it('★ randomBetween = 0.5 → 分量平均', () =>
        {
            const c = twoColors().getValue(0.5, 0.5);

            expect(c.r).toBeCloseTo(0.5, 6);
            expect(c.b).toBeCloseTo(0.5, 6);
        });

        it('★ 该模式不使用 time（同一 randomBetween 下不同 time 结果相同）', () =>
        {
            const g = twoColors();
            const a = g.getValue(0, 0.3);
            const b = g.getValue(1, 0.3);

            expect(a.r).toBeCloseTo(b.r, 10);
            expect(a.b).toBeCloseTo(b.b, 10);
        });
    });

    describe('★★ TwoGradients 模式：两条渐变按 time 取色后再混合', () =>
    {
        function twoGradients()
        {
            const g = new MinMaxGradient();

            g.mode = MinMaxGradientMode.TwoGradients;
            g.gradientMin.fromColors([0xff0000, 0xff0000]);   // 恒定红
            g.gradientMax.fromColors([0x0000ff, 0x0000ff]);   // 恒定蓝

            return g;
        }

        it('★★ randomBetween = 0 → 得到 gradientMin.getValue(time)', () =>
        {
            const g = twoGradients();
            const c = g.getValue(0.5, 0);
            const expected = g.gradientMin.getValue(0.5);

            expect(c.r).toBeCloseTo(expected.r, 6);
            expect(c.b).toBeCloseTo(expected.b, 6);
            expect(c.b).toBeCloseTo(0, 6);   // 红
        });

        it('★★ randomBetween = 1 → 得到 gradientMax.getValue(time)', () =>
        {
            const g = twoGradients();
            const c = g.getValue(0.5, 1);

            expect(c.r).toBeCloseTo(0, 6);
            expect(c.b).toBeCloseTo(1, 6);   // 蓝
        });

        it('★ randomBetween = 0.5 → 两条渐变结果的平均', () =>
        {
            const g = twoGradients();
            const min = g.gradientMin.getValue(0.5);
            const max = g.gradientMax.getValue(0.5);
            const c = g.getValue(0.5, 0.5);

            expect(c.r).toBeCloseTo((min.r + max.r) / 2, 6);
            expect(c.b).toBeCloseTo((min.b + max.b) / 2, 6);
        });
    });

    describe('★★ RandomColor 模式：randomBetween 被当作「时间」用', () =>
    {
        it('★★ 等于 gradient.getValue(randomBetween)', () =>
        {
            const g = new MinMaxGradient();

            g.mode = MinMaxGradientMode.RandomColor;
            g.gradient.fromColors([0xff0000, 0x0000ff]);

            for (const randomBetween of [0, 0.25, 0.5, 0.75, 1])
            {
                const a = g.getValue(0.5, randomBetween);
                const b = g.gradient.getValue(randomBetween);

                expect(a.r, `randomBetween=${randomBetween} r`).toBeCloseTo(b.r, 10);
                expect(a.b, `randomBetween=${randomBetween} b`).toBeCloseTo(b.b, 10);
            }
        });

        it('★★ 该模式不使用第一个参数 time（同一 randomBetween 下不同 time 结果相同）', () =>
        {
            const g = new MinMaxGradient();

            g.mode = MinMaxGradientMode.RandomColor;
            g.gradient.fromColors([0xff0000, 0x0000ff]);

            const a = g.getValue(0, 0.3);
            const b = g.getValue(99, 0.3);

            expect(a.r).toBeCloseTo(b.r, 10);
            expect(a.b).toBeCloseTo(b.b, 10);
        });
    });

    describe('★ 兜底', () =>
    {
        it('★ 非法的 mode 会返回 this.color（switch 落空后的兜底）', () =>
        {
            const g = new MinMaxGradient();

            g.color = { __type__: 'Color4', r: 0.2, g: 0.4, b: 0.6, a: 0.8 };
            g.mode = 999 as MinMaxGradientMode;

            expect(g.getValue(0.5)).toBe(g.color);
        });
    });
});
