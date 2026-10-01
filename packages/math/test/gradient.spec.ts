import { describe, expect, it } from 'vitest';

import { Color3 } from '../src/Color3';
import { Color4 } from '../src/Color4';
import { Gradient } from '../src/gradient/Gradient';
import { GradientMode } from '../src/gradient/GradientMode';

/**
 * `Gradient`（`packages/math/src/gradient/Gradient.ts`，46 行源文件 / 113 行展开，此前**行覆盖率 10.86%**）。
 *
 * 关键帧式渐变色（Godot 风格），字段 `mode` / `alphaKeys` / `colorKeys`。实测语义：
 *
 * - **默认就是"纯白不透明"**：`alphaKeys = [{alpha:1,time:0},{alpha:1,time:1}]`、
 *   `colorKeys = [{color: Color3(1,1,1), time:0},{color: Color3(1,1,1), time:1}]`；
 * - **`getAlpha(time)` 会做时间钳制**：`time ≤ 首 key.time` → 首 key 的值；
 *   `time ≥ 末 key.time` → 末 key 的值；只有 `alphaKeys.length === 1` 时直接返回那一个；
 * - **区间内**：恰好命中某个 key 的时间就是它的值；否则看 `mode` ——
 *   **`GradientMode.Fixed` 取右端 key 的值（不插值）**，其余走 `mathUtil.mapLinear` 线性插值；
 * - **`fromColors(colors, times?)` 只改 `colorKeys`**（不碰 `alphaKeys`）；
 *   省略 `times` 时按 `i / (colors.length - 1)` **均匀分布**（首 0、末 1）。
 */

describe('Gradient（math/gradient）', () =>
{
    describe('★★ 默认状态是"纯白不透明"', () =>
    {
        it('★ 默认有两个 alpha key 与两个 color key（时间 0 与 1）', () =>
        {
            const g = new Gradient();

            expect(g.alphaKeys.length).toBe(2);
            expect(g.colorKeys.length).toBe(2);
            expect(g.alphaKeys[0].time).toBe(0);
            expect(g.alphaKeys[1].time).toBe(1);
            expect(g.colorKeys[0].time).toBe(0);
            expect(g.colorKeys[1].time).toBe(1);
        });

        it('★ 默认 mode 是 Blend', () =>
        {
            expect(new Gradient().mode).toBe(GradientMode.Blend);
        });

        it('★★ 默认渐变在整段上都是 (1,1,1,1)（白色不透明）', () =>
        {
            const g = new Gradient();

            for (const time of [0, 0.25, 0.5, 0.75, 1])
            {
                const c = g.getValue(time);

                expect(c.r, `time=${time} r`).toBeCloseTo(1, 10);
                expect(c.g, `time=${time} g`).toBeCloseTo(1, 10);
                expect(c.b, `time=${time} b`).toBeCloseTo(1, 10);
                expect(c.a, `time=${time} a`).toBeCloseTo(1, 10);
            }
        });

        it('★ getAlpha / getColor 默认分别返回 1 与白色', () =>
        {
            const g = new Gradient();

            expect(g.getAlpha(0.5)).toBeCloseTo(1, 10);
            expect(g.getColor(0.5).r).toBeCloseTo(1, 10);
            expect(g.getColor(0.5).g).toBeCloseTo(1, 10);
            expect(g.getColor(0.5).b).toBeCloseTo(1, 10);
        });
    });

    describe('★★ getAlpha 的时间钳制与模式', () =>
    {
        /** 造一个 alpha 从 0 变到 1 的两关键帧渐变 */
        function alphaRamp(mode = GradientMode.Blend)
        {
            const g = new Gradient();

            g.mode = mode;
            g.alphaKeys = [{ alpha: 0, time: 0 }, { alpha: 1, time: 1 }];

            return g;
        }

        it('★ 单 key 时整段恒定', () =>
        {
            const g = new Gradient();

            g.alphaKeys = [{ alpha: 0.25, time: 0.5 }];

            for (const time of [0, 0.5, 1, -10, 10])
            {
                expect(g.getAlpha(time), `time=${time}`).toBeCloseTo(0.25, 10);
            }
        });

        it('★★ time 小于首 key：钳到首 key 的值', () =>
        {
            const g = alphaRamp();

            expect(g.getAlpha(-1)).toBeCloseTo(0, 10);
            expect(g.getAlpha(0)).toBeCloseTo(0, 10);
        });

        it('★★ time 大于末 key：钳到末 key 的值', () =>
        {
            const g = alphaRamp();

            expect(g.getAlpha(1)).toBeCloseTo(1, 10);
            expect(g.getAlpha(2)).toBeCloseTo(1, 10);
        });

        it('★ Blend 模式下区间内线性插值', () =>
        {
            const g = alphaRamp(GradientMode.Blend);

            expect(g.getAlpha(0.25)).toBeCloseTo(0.25, 6);
            expect(g.getAlpha(0.5)).toBeCloseTo(0.5, 6);
            expect(g.getAlpha(0.75)).toBeCloseTo(0.75, 6);
        });

        it('★★ Fixed 模式下区间内取右端 key 的值（不插值）—— 与 Blend 的关键差别', () =>
        {
            const g = alphaRamp(GradientMode.Fixed);

            expect(g.getAlpha(0.25)).toBeCloseTo(1, 10);
            expect(g.getAlpha(0.5)).toBeCloseTo(1, 10);
            expect(g.getAlpha(0.99)).toBeCloseTo(1, 10);
        });

        it('★ 恰好落在 key 的时间上时返回该 key 的值（两种模式一致）', () =>
        {
            for (const mode of [GradientMode.Blend, GradientMode.Fixed])
            {
                const g = alphaRamp(mode);

                expect(g.getAlpha(0), `mode=${mode} time=0`).toBeCloseTo(0, 10);
                expect(g.getAlpha(1), `mode=${mode} time=1`).toBeCloseTo(1, 10);
            }
        });
    });

    describe('★ fromColors', () =>
    {
        it('★★ 省略 times 时按均匀分布（首 0、末 1）', () =>
        {
            const g = new Gradient();

            const ret = g.fromColors([0xff0000, 0x00ff00, 0x0000ff]);

            expect(ret).toBe(g);
            expect(g.colorKeys.length).toBe(3);
            expect(g.colorKeys[0].time).toBeCloseTo(0, 10);
            expect(g.colorKeys[1].time).toBeCloseTo(0.5, 10);
            expect(g.colorKeys[2].time).toBeCloseTo(1, 10);
        });

        it('★ 指定的 times 会被采用', () =>
        {
            const g = new Gradient();

            g.fromColors([0xff0000, 0x0000ff], [0.25, 0.75]);

            expect(g.colorKeys[0].time).toBeCloseTo(0.25, 10);
            expect(g.colorKeys[1].time).toBeCloseTo(0.75, 10);
        });

        it('★ 颜色按 0xRRGGBB 解析：0xff0000 是红色', () =>
        {
            const g = new Gradient();

            g.fromColors([0xff0000, 0x0000ff]);

            const first = g.colorKeys[0].color;

            expect(first).toBeInstanceOf(Color3);
            expect(first.r).toBeCloseTo(1, 10);
            expect(first.g).toBeCloseTo(0, 10);
            expect(first.b).toBeCloseTo(0, 10);
        });

        it('★★ 只改 colorKeys，不动 alphaKeys（实测语义）', () =>
        {
            const g = new Gradient();
            const before = g.alphaKeys.map((k) => ({ alpha: k.alpha, time: k.time }));

            g.fromColors([0xff0000, 0x0000ff]);

            expect(g.alphaKeys.length).toBe(before.length);
            for (let i = 0; i < before.length; i++)
            {
                expect(g.alphaKeys[i].alpha).toBeCloseTo(before[i].alpha, 10);
                expect(g.alphaKeys[i].time).toBeCloseTo(before[i].time, 10);
            }
        });

        it('★ 单色 fromColors 的时间计算（除以 length-1 = 0）不抛异常', () =>
        {
            const g = new Gradient();

            expect(() => g.fromColors([0xff0000])).not.toThrow();
            expect(g.colorKeys.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('getValue / getColor', () =>
    {
        it('★ getValue 返回 Color4 实例', () =>
        {
            expect(new Gradient().getValue(0.5)).toBeInstanceOf(Color4);
        });

        it('★ getValue 的 rgb 来自 getColor、alpha 来自 getAlpha', () =>
        {
            const g = new Gradient();

            g.fromColors([0xff0000, 0x0000ff]);
            g.alphaKeys = [{ alpha: 0.25, time: 0 }, { alpha: 0.25, time: 1 }];

            const c = g.getValue(0.5);

            expect(c.r).toBeCloseTo(g.getColor(0.5).r, 6);
            expect(c.g).toBeCloseTo(g.getColor(0.5).g, 6);
            expect(c.b).toBeCloseTo(g.getColor(0.5).b, 6);
            expect(c.a).toBeCloseTo(g.getAlpha(0.5), 6);
        });

        it('★ 整段上不产生 NaN', () =>
        {
            const g = new Gradient();

            g.fromColors([0xff0000, 0x00ff00, 0x0000ff]);
            g.alphaKeys = [{ alpha: 0, time: 0 }, { alpha: 1, time: 1 }];

            for (let i = 0; i <= 20; i++)
            {
                const c = g.getValue(i / 20);

                expect(Number.isFinite(c.r), `t=${i / 20} r`).toBe(true);
                expect(Number.isFinite(c.g), `t=${i / 20} g`).toBe(true);
                expect(Number.isFinite(c.b), `t=${i / 20} b`).toBe(true);
                expect(Number.isFinite(c.a), `t=${i / 20} a`).toBe(true);
            }
        });
    });
});
