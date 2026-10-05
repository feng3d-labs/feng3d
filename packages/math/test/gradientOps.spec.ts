import { describe, expect, it } from 'vitest';

import type { Gradient } from '../src/gradient/gradient';
import { gradientDefault, gradientFromColors, gradientGetAlpha, gradientGetColor, gradientGetValue } from '../src/gradient/gradient';
import { GradientMode } from '../src/gradient/GradientMode';

/**
 * `Gradient` 的纯函数层（issue #134 第二批「渐变族」）：原 class 已删除，
 * 形状 `GradientLike` / `WritableGradientLike` / `Gradient` 与纯函数都在
 * `packages/math/src/gradient/gradient.ts`。
 *
 * 关键帧式渐变色（Godot 风格），字段 `mode` / `alphaKeys` / `colorKeys`。实测语义：
 *
 * - **默认就是"纯白不透明"**：`alphaKeys = [{alpha:1,time:0},{alpha:1,time:1}]`、
 *   `colorKeys = [{color: {__type__:'Color3',r:1,g:1,b:1}, time:0}, …]`；
 * - **`gradientGetAlpha` 会做时间钳制**：`time ≤ 首 key.time` → 首 key 的值；
 *   `time ≥ 末 key.time` → 末 key 的值；只有 `alphaKeys.length === 1` 时直接返回那一个；
 * - **区间内**：恰好命中某个 key 的时间就是它的值；否则看 `mode` ——
 *   **`GradientMode.Fixed` 取右端 key 的值（不插值）**，其余走 `mathUtil.mapLinear` 线性插值；
 * - **`gradientFromColors(colors, times?)` 只改 `colorKeys`**（不碰 `alphaKeys`）；
 *   省略 `times` 时按 `i / (colors.length - 1)` **均匀分布**（首 0、末 1）。
 *
 * 本文件锁住三类契约（P8 / 方案 §7 C 第 1 条）：
 * ① **行为**（期望值手算硬编码，不拿实现当基准）；
 * ② **不改入参**（纯函数只写 `out`；`out` 缺省新建、传了就地写）；
 * ③ **判别字段的装配点**（纯函数不产 `__type__`，装配成 `Gradient` 接口要显式写）。
 *
 * 与旧 `gradient.spec.ts` 的差异（删 class 带来的、**刻意的**）：
 * - `getColor` / `getValue` 不再返回关键点数组里的颜色对象本身，而是复制进 `out`；
 * - `getValue()` 不再自带 `__type__: 'Color4'`（纯函数层不产判别字段）。
 */

describe('gradient（math/gradient）', () =>
{
    describe('★★ 默认状态是"纯白不透明"', () =>
    {
        it('★ 默认有两个 alpha key 与两个 color key（时间 0 与 1）', () =>
        {
            const g = gradientDefault();

            expect(g.alphaKeys.length).toBe(2);
            expect(g.colorKeys.length).toBe(2);
            expect(g.alphaKeys[0].time).toBe(0);
            expect(g.alphaKeys[1].time).toBe(1);
            expect(g.colorKeys[0].time).toBe(0);
            expect(g.colorKeys[1].time).toBe(1);
        });

        it('★ 默认 mode 是 Blend', () =>
        {
            expect(gradientDefault().mode).toBe(GradientMode.Blend);
        });

        it('★ 默认 key 里的颜色自带 `__type__: \'Color3\'`（装配点标记，序列化 / 面板要靠它）', () =>
        {
            const g = gradientDefault();

            expect(g.colorKeys[0].color.__type__).toBe('Color3');
            expect(g.colorKeys[1].color.__type__).toBe('Color3');
        });

        it('★★ 每次调用都给出**新的**键数组（不共享冻结常量）', () =>
        {
            const a = gradientDefault();
            const b = gradientDefault();

            expect(a.alphaKeys).not.toBe(b.alphaKeys);
            expect(a.colorKeys).not.toBe(b.colorKeys);
            expect(a.colorKeys[0].color).not.toBe(b.colorKeys[0].color);

            a.alphaKeys.push({ alpha: 0.5, time: 0.5 });
            expect(b.alphaKeys.length).toBe(2);
        });

        it('★★ 默认渐变在整段上都是 (1,1,1,1)（白色不透明）', () =>
        {
            const g = gradientDefault();

            for (const time of [0, 0.25, 0.5, 0.75, 1])
            {
                const c = gradientGetValue(g, time);

                expect(c.r, `time=${time} r`).toBeCloseTo(1, 10);
                expect(c.g, `time=${time} g`).toBeCloseTo(1, 10);
                expect(c.b, `time=${time} b`).toBeCloseTo(1, 10);
                expect(c.a, `time=${time} a`).toBeCloseTo(1, 10);
            }
        });

        it('★ getAlpha / getColor 默认分别返回 1 与白色', () =>
        {
            const g = gradientDefault();

            expect(gradientGetAlpha(g, 0.5)).toBeCloseTo(1, 10);
            expect(gradientGetColor(g, 0.5).r).toBeCloseTo(1, 10);
            expect(gradientGetColor(g, 0.5).g).toBeCloseTo(1, 10);
            expect(gradientGetColor(g, 0.5).b).toBeCloseTo(1, 10);
        });
    });

    describe('★★ 判别字段：纯函数不产、装配点显式写', () =>
    {
        it('★★ 纯函数的缺省 out **不带** `__type__`（返回的是值，不是被声明的数据）', () =>
        {
            const g = gradientDefault();

            expect('__type__' in g).toBe(false);
            expect('__type__' in gradientGetValue(g, 0.5)).toBe(false);
            expect('__type__' in gradientGetColor(g, 0.5)).toBe(false);
        });

        it('★★ 装配成 `Gradient` 接口要显式补判别字段', () =>
        {
            const g: Gradient = { __type__: 'Gradient', ...gradientDefault() };

            expect(g.__type__).toBe('Gradient');
            expect(g.alphaKeys.length).toBe(2);
            expect(gradientGetAlpha(g, 0)).toBeCloseTo(1, 10);
        });
    });

    describe('★★ getAlpha 的时间钳制与模式', () =>
    {
        /** 造一个 alpha 从 0 变到 1 的两关键帧渐变 */
        function alphaRamp(mode = GradientMode.Blend)
        {
            const g = gradientDefault();

            g.mode = mode;
            g.alphaKeys = [{ alpha: 0, time: 0 }, { alpha: 1, time: 1 }];

            return g;
        }

        it('★ 单 key 时整段恒定', () =>
        {
            const g = gradientDefault();

            g.alphaKeys = [{ alpha: 0.25, time: 0.5 }];

            for (const time of [0, 0.5, 1, -10, 10])
            {
                expect(gradientGetAlpha(g, time), `time=${time}`).toBeCloseTo(0.25, 10);
            }
        });

        it('★★ time 小于首 key：钳到首 key 的值', () =>
        {
            const g = alphaRamp();

            expect(gradientGetAlpha(g, -1)).toBeCloseTo(0, 10);
            expect(gradientGetAlpha(g, 0)).toBeCloseTo(0, 10);
        });

        it('★★ time 大于末 key：钳到末 key 的值', () =>
        {
            const g = alphaRamp();

            expect(gradientGetAlpha(g, 1)).toBeCloseTo(1, 10);
            expect(gradientGetAlpha(g, 2)).toBeCloseTo(1, 10);
        });

        it('★ Blend 模式下区间内线性插值', () =>
        {
            const g = alphaRamp(GradientMode.Blend);

            expect(gradientGetAlpha(g, 0.25)).toBeCloseTo(0.25, 6);
            expect(gradientGetAlpha(g, 0.5)).toBeCloseTo(0.5, 6);
            expect(gradientGetAlpha(g, 0.75)).toBeCloseTo(0.75, 6);
        });

        it('★★ Fixed 模式下区间内取右端 key 的值（不插值）—— 与 Blend 的关键差别', () =>
        {
            const g = alphaRamp(GradientMode.Fixed);

            expect(gradientGetAlpha(g, 0.25)).toBeCloseTo(1, 10);
            expect(gradientGetAlpha(g, 0.5)).toBeCloseTo(1, 10);
            expect(gradientGetAlpha(g, 0.99)).toBeCloseTo(1, 10);
        });

        it('★ 恰好落在 key 的时间上时返回该 key 的值（两种模式一致）', () =>
        {
            for (const mode of [GradientMode.Blend, GradientMode.Fixed])
            {
                const g = alphaRamp(mode);

                expect(gradientGetAlpha(g, 0), `mode=${mode} time=0`).toBeCloseTo(0, 10);
                expect(gradientGetAlpha(g, 1), `mode=${mode} time=1`).toBeCloseTo(1, 10);
            }
        });
    });

    describe('★ gradientFromColors', () =>
    {
        it('★★ 省略 times 时按均匀分布（首 0、末 1）', () =>
        {
            const g = gradientFromColors([0xff0000, 0x00ff00, 0x0000ff]);

            expect(g.colorKeys.length).toBe(3);
            expect(g.colorKeys[0].time).toBeCloseTo(0, 10);
            expect(g.colorKeys[1].time).toBeCloseTo(0.5, 10);
            expect(g.colorKeys[2].time).toBeCloseTo(1, 10);
        });

        it('★ 指定的 times 会被采用', () =>
        {
            const g = gradientFromColors([0xff0000, 0x0000ff], [0.25, 0.75]);

            expect(g.colorKeys[0].time).toBeCloseTo(0.25, 10);
            expect(g.colorKeys[1].time).toBeCloseTo(0.75, 10);
        });

        it('★ 颜色按 0xRRGGBB 解析：0xff0000 是红色（手算期望值）', () =>
        {
            const first = gradientFromColors([0xff0000, 0x0000ff]).colorKeys[0].color;

            expect(first.__type__).toBe('Color3');
            expect(first.r).toBeCloseTo(1, 10);
            expect(first.g).toBeCloseTo(0, 10);
            expect(first.b).toBeCloseTo(0, 10);
        });

        it('★★ 只改 colorKeys，不动 alphaKeys 与 mode（实测语义）', () =>
        {
            const g = gradientDefault();

            g.mode = GradientMode.Fixed;
            const alphaBefore = g.alphaKeys;

            gradientFromColors([0xff0000, 0x0000ff], undefined, g);

            expect(g.alphaKeys).toBe(alphaBefore);
            expect(g.mode).toBe(GradientMode.Fixed);
            expect(g.colorKeys.length).toBe(2);
        });

        it('★ 单色 gradientFromColors 的时间计算（除以 length-1 = 0）不抛异常', () =>
        {
            expect(() => gradientFromColors([0xff0000])).not.toThrow();

            const g = gradientFromColors([0xff0000]);

            expect(g.colorKeys.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('★★ 纯函数不写入参、out 传自己即就地写', () =>
    {
        it('★★ gradientGetColor / gradientGetValue 不改动渐变数据', () =>
        {
            const g = gradientFromColors([0xff0000, 0x0000ff]);

            g.alphaKeys = [{ alpha: 0.25, time: 0 }, { alpha: 0.25, time: 1 }];
            const snapshot = JSON.stringify(g);

            for (const time of [0, 0.25, 0.5, 0.75, 1])
            {
                gradientGetColor(g, time);
                gradientGetValue(g, time);
            }

            expect(JSON.stringify(g)).toBe(snapshot);
        });

        it('★★ 传 out 就地写：返回的就是传入的那个对象，且 out 与入参相同也安全', () =>
        {
            const g = gradientFromColors([0xff0000, 0x0000ff]);
            const out = { r: 0, g: 0, b: 0 };

            expect(gradientGetColor(g, 0.5, out)).toBe(out);
            expect(out.r).toBeCloseTo(0.5, 6);
            expect(out.b).toBeCloseTo(0.5, 6);

            // out === 入参（把关键点颜色本身当 out）：先读后写，不出现自污染
            const keyColor = g.colorKeys[0].color;

            gradientGetColor(g, 0.5, keyColor);
            expect(keyColor.r).toBeCloseTo(0.5, 6);
            expect(keyColor.b).toBeCloseTo(0.5, 6);
        });

        it('★★ 区间内插值结果写进 out；恰好命中键时**复制**键颜色（不再是同一个对象）', () =>
        {
            const g = gradientFromColors([0xff0000, 0x0000ff]);
            const c = gradientGetColor(g, 0);

            expect(c).not.toBe(g.colorKeys[0].color);
            expect(c.r).toBeCloseTo(1, 10);
            expect(c.g).toBeCloseTo(0, 10);

            // 写它不会回改渐变数据
            c.r = 0;
            expect(g.colorKeys[0].color.r).toBeCloseTo(1, 10);
        });

        it('★★ gradientGetValue 的 out 传自己（先算 rgb 再补 a）', () =>
        {
            const g = gradientFromColors([0x00ff00, 0x00ff00]);

            g.alphaKeys = [{ alpha: 0.5, time: 0 }, { alpha: 0.5, time: 1 }];
            const out = { r: 0, g: 0, b: 0, a: 0 };

            expect(gradientGetValue(g, 0.5, out)).toBe(out);
            expect(out.r).toBeCloseTo(0, 10);
            expect(out.g).toBeCloseTo(1, 10);
            expect(out.b).toBeCloseTo(0, 10);
            expect(out.a).toBeCloseTo(0.5, 10);
        });
    });

    describe('getValue / getColor', () =>
    {
        it('★ getValue 的 rgb 来自 getColor、alpha 来自 getAlpha', () =>
        {
            const g = gradientFromColors([0xff0000, 0x0000ff]);

            g.alphaKeys = [{ alpha: 0.25, time: 0 }, { alpha: 0.25, time: 1 }];

            const c = gradientGetValue(g, 0.5);

            expect(c.r).toBeCloseTo(gradientGetColor(g, 0.5).r, 6);
            expect(c.g).toBeCloseTo(gradientGetColor(g, 0.5).g, 6);
            expect(c.b).toBeCloseTo(gradientGetColor(g, 0.5).b, 6);
            expect(c.a).toBeCloseTo(gradientGetAlpha(g, 0.5), 6);
        });

        it('★★ 手算一条两关键帧渐变的取值（不拿实现当基准）', () =>
        {
            // 红 (1,0,0) → 蓝 (0,0,1)，alpha 1 → 0：t=0.25 时
            // r = 1*(1-0.25) + 0*0.25 = 0.75、b = 0*0.75 + 1*0.25 = 0.25、a = 1*(1-0.25) + 0*0.25 = 0.75
            const g = gradientFromColors([0xff0000, 0x0000ff]);

            g.alphaKeys = [{ alpha: 1, time: 0 }, { alpha: 0, time: 1 }];

            const c = gradientGetValue(g, 0.25);

            expect(c.r).toBeCloseTo(0.75, 10);
            expect(c.g).toBeCloseTo(0, 10);
            expect(c.b).toBeCloseTo(0.25, 10);
            expect(c.a).toBeCloseTo(0.75, 10);
        });

        it('★ 整段上不产生 NaN', () =>
        {
            const g = gradientFromColors([0xff0000, 0x00ff00, 0x0000ff]);

            g.alphaKeys = [{ alpha: 0, time: 0 }, { alpha: 1, time: 1 }];

            for (let i = 0; i <= 20; i++)
            {
                const c = gradientGetValue(g, i / 20);

                expect(Number.isFinite(c.r), `t=${i / 20} r`).toBe(true);
                expect(Number.isFinite(c.g), `t=${i / 20} g`).toBe(true);
                expect(Number.isFinite(c.b), `t=${i / 20} b`).toBe(true);
                expect(Number.isFinite(c.a), `t=${i / 20} a`).toBe(true);
            }
        });
    });
});
