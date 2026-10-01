import { describe, expect, it } from 'vitest';

import { AnimationCurve } from '../src/curve/AnimationCurve';
import type { AnimationCurveKeyframe } from '../src/curve/AnimationCurveKeyframe';

/**
 * `AnimationCurve`（`packages/math/src/curve/AnimationCurve.ts`，93 行，此前**行覆盖率 6.45%**）。
 *
 * 关键帧集合（`keys: AnimationCurveKeyframe[]`），本身是**纯数据类**（带 `@decoratorRegisterClass`）。
 *
 * ★★ **最重要的一条前提**：**`new AnimationCurve()` 的 `keys` 不是空数组 —— 默认已经带一个关键帧**
 * （实测 `numKeys === 1`）。我第一版按"空曲线"写断言，10 条用例集体失败（数量少 1、下标整体偏移）。
 * 所以本文件所有"数量"断言都以 **`c.numKeys` 的当前值**为基准，而不是写死。
 *
 * 实测到的其它语义：
 * - **`addKey(key)` 会 push *并自动 `sort()`***（按 `a.time - b.time` 升序），调用方不需要自己排序；
 * - **`deleteKey(key)` 是按引用查找**（`indexOf`），找不到就什么都不做；
 * - **`getSamples(num = 100)` 返回 `num + 1` 个点**（采样点 `[0, 1/num, …, 1]`，**含两端**）；
 * - **`getValue(t)` 就是 `getPoint(t)?.value`，`getPoint` 返回假值时给 `0`**。
 *
 * ⚠️ `getPoint` 内部的插值细节（106 行，涉及 `bezierCurve` 与 `WrapMode`）**不在本文件断言范围内**。
 */

const key = (time: number, value: number) => ({ time, value }) as AnimationCurveKeyframe;

describe('AnimationCurve（math/curve）', () =>
{
    describe('★★ 新建曲线的初始状态（默认已有一个关键帧）', () =>
    {
        it('★★ new AnimationCurve() 的 numKeys 是 1，不是 0 —— 默认带一个关键帧', () =>
        {
            const c = new AnimationCurve();

            expect(c.numKeys).toBe(1);
            expect(c.keys.length).toBe(1);
        });

        it('★ 默认关键帧的 time / value 都是数字', () =>
        {
            const c = new AnimationCurve();

            expect(typeof c.keys[0].time).toBe('number');
            expect(typeof c.keys[0].value).toBe('number');
            expect(Number.isFinite(c.keys[0].time)).toBe(true);
            expect(Number.isFinite(c.keys[0].value)).toBe(true);
        });

        it('★ getKey(0) 能取到那个默认关键帧；getKey(1) 是 undefined', () =>
        {
            const c = new AnimationCurve();

            expect(c.getKey(0)).toBe(c.keys[0]);
            expect(c.getKey(1)).toBeUndefined();
        });
    });

    describe('★ addKey / sort（addKey 会自动排序）', () =>
    {
        it('★ 每次 addKey 让 numKeys 加一（以当前值为基准）', () =>
        {
            const c = new AnimationCurve();
            const base = c.numKeys;

            c.addKey(key(0, 1));
            expect(c.numKeys).toBe(base + 1);
            c.addKey(key(1, 2));
            expect(c.numKeys).toBe(base + 2);
            c.addKey(key(2, 3));
            expect(c.numKeys).toBe(base + 3);
        });

        it('★★ 乱序添加后 keys 仍按 time 单调不减（addKey 内部会 sort）', () =>
        {
            const c = new AnimationCurve();

            c.addKey(key(5, 50));
            c.addKey(key(1, 10));
            c.addKey(key(3, 30));
            c.addKey(key(0, 0));

            const times = c.keys.map((k) => k.time);

            for (let i = 1; i < times.length; i++)
            {
                expect(times[i], `下标 ${i}：${times[i - 1]} → ${times[i]}`).toBeGreaterThanOrEqual(times[i - 1]);
            }
        });

        it('★ 显式 sort() 之后仍保持单调不减（改过 time 之后可以手动恢复）', () =>
        {
            const c = new AnimationCurve();
            const a = key(1, 10);
            const b = key(2, 20);

            c.addKey(a);
            c.addKey(b);

            // 直接改 time（纯数据类字段可写），顺序被打乱
            a.time = 10;
            c.sort();

            const times = c.keys.map((k) => k.time);

            for (let i = 1; i < times.length; i++)
            {
                expect(times[i], `下标 ${i}`).toBeGreaterThanOrEqual(times[i - 1]);
            }
            expect(times).toContain(10);
        });

        it('★ time 相同的关键帧都保留（不会去重）', () =>
        {
            const c = new AnimationCurve();
            const base = c.numKeys;

            c.addKey(key(1, 10));
            c.addKey(key(1, 20));

            expect(c.numKeys).toBe(base + 2);
        });
    });

    describe('★ deleteKey / indexOfKeys（按引用查找）', () =>
    {
        it('★ deleteKey 移除关键帧并让 numKeys 减一', () =>
        {
            const c = new AnimationCurve();
            const a = key(0, 1);

            c.addKey(a);

            const before = c.numKeys;

            c.deleteKey(a);

            expect(c.numKeys).toBe(before - 1);
            expect(c.keys).not.toContain(a);
        });

        it('★ deleteKey 传入不在集合里的对象时什么都不做（内容相同但引用不同也不删）', () =>
        {
            const c = new AnimationCurve();

            c.addKey(key(0, 1));

            const before = c.numKeys;

            c.deleteKey(key(0, 1));   // 内容相同，但是另一个对象

            expect(c.numKeys).toBe(before);
        });

        it('★ indexOfKeys 对已加入的关键帧返回其下标；不存在时为 −1', () =>
        {
            const c = new AnimationCurve();
            const a = key(0, 1);

            c.addKey(a);

            const idx = c.indexOfKeys(a);

            expect(idx).toBeGreaterThanOrEqual(0);
            expect(c.keys[idx]).toBe(a);
            expect(c.indexOfKeys(key(9, 9))).toBe(-1);
        });
    });

    describe('★★ getSamples（返回 num + 1 个点，含两端）', () =>
    {
        it('★★ getSamples(n) 返回 n + 1 个点', () =>
        {
            const c = new AnimationCurve();

            c.addKey(key(0, 0));
            c.addKey(key(1, 1));

            for (const n of [1, 2, 10, 100])
            {
                expect(c.getSamples(n).length, `n=${n}`).toBe(n + 1);
            }
        });

        it('★ 默认参数是 100，所以返回 101 个点', () =>
        {
            const c = new AnimationCurve();

            c.addKey(key(0, 0));

            expect(c.getSamples().length).toBe(101);
        });

        it('★ 采样点都是有限数（time / value 都是 number）', () =>
        {
            const c = new AnimationCurve();

            c.addKey(key(0, 3));
            c.addKey(key(1, 7));

            for (const p of c.getSamples(4))
            {
                expect(typeof p.time).toBe('number');
                expect(typeof p.value).toBe('number');
                expect(Number.isFinite(p.time)).toBe(true);
                expect(Number.isFinite(p.value)).toBe(true);
            }
        });
    });

    describe('★ getValue / getPoint', () =>
    {
        it('★ 返回值总是有限数字（空曲线与多关键帧都一样）', () =>
        {
            const empty = new AnimationCurve();

            for (const t of [-1, 0, 0.5, 1, 2])
            {
                expect(Number.isFinite(empty.getValue(t)), `空曲线 t=${t}`).toBe(true);
            }

            const c = new AnimationCurve();

            c.addKey(key(0, 0));
            c.addKey(key(1, 10));

            for (let i = 0; i <= 10; i++)
            {
                expect(Number.isFinite(c.getValue(i / 10)), `t=${i / 10}`).toBe(true);
            }
        });

        it('★ 两关键帧的曲线在整段上都有有限值', () =>
        {
            const c = new AnimationCurve();

            c.addKey(key(0, -5));
            c.addKey(key(2, 5));

            for (let i = 0; i <= 20; i++)
            {
                expect(Number.isFinite(c.getValue(i / 10)), `t=${i / 10}`).toBe(true);
            }
        });

        it('★ getPoint 返回的关键帧带 time / value 字段', () =>
        {
            const c = new AnimationCurve();

            c.addKey(key(0, 1));
            c.addKey(key(1, 2));

            const p = c.getPoint(0.5);

            expect(typeof p.time).toBe('number');
            expect(typeof p.value).toBe('number');
        });
    });
});
