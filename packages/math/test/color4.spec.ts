import { describe, expect, it } from 'vitest';

import type { Color4 } from '../src/color/color4Ops';
import {
    color4Copy,
    color4Equals,
    color4FromUnit,
    color4FromUnit24,
    color4Mix,
    color4Multiply,
    color4MultiplyNumber,
    color4Random,
    color4SetTo,
    color4ToArray,
    color4ToColor3,
    color4ToHexString,
    color4ToInt,
    color4ToRGBA,
    color4ToString,
    color4ToVector4,
} from '../src/color/color4Ops';

/**
 * `Color4` 的**纯数据形态 + 纯函数层**（`packages/math/src/color/color4Ops.ts`）。
 *
 * **阶段 C-b 起 `packages/math/src/Color4.ts` 的 class 已删除**，本文件由「class 行为用例」
 * 改写为「纯函数用例」，断言逐条保留（`new Color4(r,g,b,a)` → `{ r, g, b, a }` 字面量、
 * `c.mix(o, rate)` → `color4Mix(c, o, rate, c)`、`c.multiplyNumber(s)` → `color4MultiplyNumber(c, s, c)`）。
 * 原「class 委托接线」用例随 class 一起删除。
 *
 * 带 alpha 的颜色。实测到的**关键格式语义**（都来自实现本体，逐字保留）：
 *
 * - **`color4FromUnit(color)`**：把整数按 **`0xAARRGGBB`** 拆开并**归一化到 `[0,1]`**
 *   （每段 `/ 0xff`）；`color4FromUnit24(color, a = 1)` 则是 **`0xRRGGBB`**；
 * - **`color4ToInt()`**：`(a*0xff << 24) + (r*0xff << 16) + (g*0xff << 8) + b*0xff`
 *   —— 因此与 `color4FromUnit` **互为逆运算**（alpha < 0x80 时）；
 * - **`color4ToHexString()`**：`` `#${A}${R}${G}${B}` ``（**8 位、含 alpha、顺序是 AARRGGBB**）；
 * - **`color4ToRGBA()`**：`` `rgba(r*255,g*255,b*255,a)` ``（分量**不取整**）；
 * - 纯函数只读入参、结果写 `out`：`out` 传自己即原 class 的 `mix` / `multiply` / `multiplyNumber`
 *   （就地改并返回自身），传别的（或缺省）即原 class 的 `mixTo` / `multiplyTo`。
 */

/** 原 `new Color4(r, g, b, a)` 的字面量形态（纯函数层的 `out` 目标，不带判别字段）。 */
const v = (r: number, g: number, b: number, a = 1) => ({ r, g, b, a });

/** 数据声明形态：带 `readonly __type__: 'Color4'` 判别字段（方案 §5.9 的 D1 决策）。 */
const marked = (r: number, g: number, b: number, a = 1): Color4 => ({ __type__: 'Color4', r, g, b, a });

describe('Color4（math）', () =>
{
    describe('构造与 setTo', () =>
    {
        it('默认是白色 (1,1,1,1)', () =>
        {
            const c = marked(1, 1, 1, 1);

            expect(c.__type__).toBe('Color4');
            expect(c.r).toBe(1);
            expect(c.g).toBe(1);
            expect(c.b).toBe(1);
            expect(c.a).toBe(1);
        });

        it('四参构造按顺序写入 r/g/b/a', () =>
        {
            const c = v(0.1, 0.2, 0.3, 0.4);

            expect(c.r).toBeCloseTo(0.1, 10);
            expect(c.g).toBeCloseTo(0.2, 10);
            expect(c.b).toBeCloseTo(0.3, 10);
            expect(c.a).toBeCloseTo(0.4, 10);
        });

        it('★ setTo 四参写入并返回 out；省略 a 时 a 取 1', () =>
        {
            const c = v(1, 1, 1, 1);

            expect(color4SetTo(0.5, 0.6, 0.7, undefined, c)).toBe(c);
            expect(c.a).toBe(1);

            color4SetTo(0.1, 0.2, 0.3, 0.4, c);
            expect(c.a).toBeCloseTo(0.4, 10);
        });
    });

    describe('★ fromUnit（0xAARRGGBB 归一化）', () =>
    {
        it('★★ 0xffff0000 → 不透明红色 (1,0,0,1)', () =>
        {
            const c = color4FromUnit(0xffff0000);

            expect(c.r).toBeCloseTo(1, 10);
            expect(c.g).toBeCloseTo(0, 10);
            expect(c.b).toBeCloseTo(0, 10);
            expect(c.a).toBeCloseTo(1, 10);
        });

        it('★★ 0xff0000ff → 不透明蓝色 (0,0,1,1)', () =>
        {
            const c = color4FromUnit(0xff0000ff);

            expect(c.r).toBeCloseTo(0, 10);
            expect(c.g).toBeCloseTo(0, 10);
            expect(c.b).toBeCloseTo(1, 10);
            expect(c.a).toBeCloseTo(1, 10);
        });

        it('★ alpha 段来自最高字节：0x00000000 是全透明', () =>
        {
            const c = color4FromUnit(0);

            expect(c.a).toBeCloseTo(0, 10);
        });

        it('★ 缺省 out 与写入已有 out 结果一致', () =>
        {
            const a = color4FromUnit(0x80123456);
            const b = v(1, 1, 1, 1);

            color4FromUnit(0x80123456, b);

            expect(a.r).toBeCloseTo(b.r, 12);
            expect(a.g).toBeCloseTo(b.g, 12);
            expect(a.b).toBeCloseTo(b.b, 12);
            expect(a.a).toBeCloseTo(b.a, 12);
        });

        it('★ fromUnit24 把 0xRRGGBB 与给定的 alpha 组合', () =>
        {
            const c = color4FromUnit24(0xff0000, 0.5);

            expect(c.r).toBeCloseTo(1, 10);
            expect(c.g).toBeCloseTo(0, 10);
            expect(c.b).toBeCloseTo(0, 10);
            expect(c.a).toBeCloseTo(0.5, 10);
        });

        it('fromUnit24 省略 alpha 时是 1', () =>
        {
            expect(color4FromUnit24(0x00ff00).a).toBe(1);
        });
    });

    describe('★★ toInt 与 fromUnit 互为逆运算', () =>
    {
        it('★★ toInt 返回**有符号 32 位**：alpha ≥ 0x80 时是负数', () =>
        {
            // 实测：实现是 (a*0xff << 24) + (r*0xff << 16) + (g*0xff << 8) + b*0xff，
            // 而 JS 的 `<<` 是**有符号**位移，所以 0xff << 24 === -16777216。
            // 第一版我按"与 fromUnit 互为逆运算"断言（期望 0xffff0000 = 4294901760），失败后才查出来。
            expect(color4ToInt(v(1, 0, 0, 1))).toBe(-65536);    // === 0xffff0000 | 0
            expect(color4ToInt(v(1, 1, 1, 1))).toBe(-1);        // === 0xffffffff | 0
            expect(color4ToInt(v(0, 0, 0, 0))).toBe(0);         // 全 0 仍是 0
        });

        it('★★ alpha < 0x80 时 toInt 与 fromUnit 确实互为逆运算', () =>
        {
            for (const int of [0x00000000, 0x7f0000ff, 0x7f123456, 0x00123456])
            {
                expect(color4ToInt(color4FromUnit(int)), `0x${int.toString(16)}`).toBe(int);
            }
        });
    });

    describe('★ toHexString / toRGBA 的格式', () =>
    {
        it('★★ toHexString 是 8 位 #AARRGGBB（大小写不敏感地比对）', () =>
        {
            expect(color4ToHexString(v(1, 0, 0, 1)).toLowerCase()).toBe('#ffff0000');
            expect(color4ToHexString(v(0, 0, 0, 0)).toLowerCase()).toBe('#00000000');
            expect(color4ToHexString(v(1, 1, 1, 1)).toLowerCase()).toBe('#ffffffff');
        });

        it('★ toHexString 以 # 开头、长度 9', () =>
        {
            const s = color4ToHexString(v(0.2, 0.4, 0.6, 0.8));

            expect(s.startsWith('#')).toBe(true);
            expect(s.length).toBe(9);
        });

        it('★ toRGBA 输出 rgba(r,g,b,a) 形式', () =>
        {
            expect(color4ToRGBA(v(1, 0, 0, 1))).toBe('rgba(255,0,0,1)');
            expect(color4ToRGBA(v(0, 0, 0, 0))).toBe('rgba(0,0,0,0)');
        });

        it('★ toRGBA 的分量不取整（0.5 → 127.5）', () =>
        {
            expect(color4ToRGBA(v(0.5, 0, 0, 1))).toBe('rgba(127.5,0,0,1)');
        });
    });

    describe('★ mix（线性插值）', () =>
    {
        it('★★ rate=0.5 得到分量平均', () =>
        {
            const c = v(1, 0, 0, 1);

            color4Mix(c, v(0, 0, 1, 1), 0.5, c);

            expect(c.r).toBeCloseTo(0.5, 10);
            expect(c.g).toBeCloseTo(0, 10);
            expect(c.b).toBeCloseTo(0.5, 10);
            expect(c.a).toBeCloseTo(1, 10);
        });

        it('★ rate=0 保持自身，rate=1 变成另一色', () =>
        {
            const a = v(1, 0, 0, 1);

            color4Mix(a, v(0, 0, 1, 1), 0, a);
            expect(a.b).toBeCloseTo(0, 10);

            const b = v(1, 0, 0, 1);

            color4Mix(b, v(0, 0, 1, 1), 1, b);
            expect(b.b).toBeCloseTo(1, 10);
            expect(b.r).toBeCloseTo(0, 10);
        });

        it('★ out 传自己即就地修改并返回该对象', () =>
        {
            const a = v(1, 0, 0, 1);

            expect(color4Mix(a, v(0, 0, 1, 1), 0.5, a)).toBe(a);
        });

        it('★★ 传别的 out 时不改自身，而是写入 out', () =>
        {
            const a = v(1, 0, 0, 1);
            const out = v(1, 1, 1, 1);
            const ret = color4Mix(a, v(0, 0, 1, 1), 0.5, out);

            expect(ret).toBe(out);
            expect(a.r, 'a 不该被改').toBeCloseTo(1, 10);
            expect(a.b).toBeCloseTo(0, 10);
            expect(out.b).toBeCloseTo(0.5, 10);
        });

        it('★ 省略 out 时会新建一个', () =>
        {
            const a = v(1, 0, 0, 1);
            const out = color4Mix(a, v(0, 0, 1, 1), 0.5);

            expect(out).not.toBe(a);
            expect(out.b).toBeCloseTo(0.5, 10);
        });
    });

    describe('★ multiply / multiplyNumber', () =>
    {
        it('★★ multiply 是分量相乘（out 传自己即就地、返回该对象）', () =>
        {
            const a = v(1, 0.5, 0.25, 1);

            expect(color4Multiply(a, v(0.5, 0.5, 0.5, 1), a)).toBe(a);
            expect(a.r).toBeCloseTo(0.5, 10);
            expect(a.g).toBeCloseTo(0.25, 10);
            expect(a.b).toBeCloseTo(0.125, 10);
        });

        it('★ multiply 传别的 out 时不改自身，而是写入 out', () =>
        {
            const a = v(1, 1, 1, 1);
            const out = v(1, 1, 1, 1);

            color4Multiply(a, v(0.5, 0.25, 0.125, 1), out);

            expect(a.r, 'a 不该被改').toBeCloseTo(1, 10);
            expect(out.r).toBeCloseTo(0.5, 10);
            expect(out.g).toBeCloseTo(0.25, 10);
        });

        it('★★ multiplyNumber 每个分量各乘 scale（包括 alpha）', () =>
        {
            const c = v(0.5, 0.5, 0.5, 0.5);

            color4MultiplyNumber(c, 2, c);

            expect(c.r).toBeCloseTo(1, 10);
            expect(c.g).toBeCloseTo(1, 10);
            expect(c.b).toBeCloseTo(1, 10);
            expect(c.a).toBeCloseTo(1, 10);
        });

        it('★ random(false) 不写 a：缺省新建时 a 保持 1，写入已有 out 时 a 保持原值', () =>
        {
            const fresh = color4Random(false);

            expect(fresh.a).toBe(1);
            expect(fresh.r).toBeGreaterThanOrEqual(0);
            expect(fresh.r).toBeLessThan(1);

            const target = v(0, 0, 0, 0.25);

            color4Random(false, target);
            expect(target.a).toBe(0.25);
        });
    });

    describe('equals / copy / 转换', () =>
    {
        it('★ equals：相同为真、分量不同为假', () =>
        {
            expect(color4Equals(v(0.1, 0.2, 0.3, 0.4), v(0.1, 0.2, 0.3, 0.4))).toBe(true);
            expect(color4Equals(v(0.1, 0.2, 0.3, 0.4), v(0.1, 0.2, 0.3, 0.5))).toBe(false);
        });

        it('★ copy 复制四个分量，缺省 out 产生独立对象', () =>
        {
            const src = v(0.1, 0.2, 0.3, 0.4);
            const dst = v(0.5, 0.5, 0.5, 0.5);

            color4Copy(src, dst);

            const cloned = color4Copy(src);

            expect(dst.r).toBeCloseTo(0.1, 10);
            expect(dst.a).toBeCloseTo(0.4, 10);
            expect(cloned).not.toBe(src);
            expect(cloned.b).toBeCloseTo(0.3, 10);
        });

        it('★ toColor3 取 r/g/b 丢掉 alpha；toVector4 四分量对应；toArray 写入数组', () =>
        {
            const c = v(0.1, 0.2, 0.3, 0.4);

            const c3 = color4ToColor3(c);

            expect(c3).toEqual({ r: 0.1, g: 0.2, b: 0.3 });
            expect(c3.r).toBeCloseTo(0.1, 10);
            expect(c3.b).toBeCloseTo(0.3, 10);

            const v4 = color4ToVector4(c);

            // out 是纯函数层的最小形状 `WritableVector4Like`（不是 Vector4 实例）
            expect(v4).toEqual({ x: 0.1, y: 0.2, z: 0.3, w: 0.4 });
            expect(v4.x).toBeCloseTo(0.1, 10);
            expect(v4.w).toBeCloseTo(0.4, 10);

            const arr: number[] = [];

            color4ToArray(c, arr);
            expect(arr.length).toBe(4);
            expect(arr[0]).toBeCloseTo(0.1, 10);
            expect(arr[3]).toBeCloseTo(0.4, 10);
        });

        it('★ toString 返回字符串', () =>
        {
            expect(typeof color4ToString(v(0.1, 0.2, 0.3, 0.4))).toBe('string');
        });
    });

    // ── 纯数据形态的契约（issue #134 阶段 C-b）──
    describe('★ 两级形状（C-b）', () =>
    {
        it('★★ 纯函数接受裸字面量，也接受带判别字段的数据', () =>
        {
            const literal = { r: 0, g: 1, b: 0, a: 1 };
            const data = marked(1, 0, 0, 0.5);

            expect(color4Mix(data, literal, 0.5)).toEqual({ r: 0.5, g: 0.5, b: 0, a: 0.75 });
            expect(color4ToInt(data)).toBe(color4ToInt({ r: 1, g: 0, b: 0, a: 0.5 }));
        });

        it('★★ 缺省 out 不带判别字段（是「算出来的值」而不是「被声明的数据」）', () =>
        {
            expect('__type__' in color4Mix(v(1, 1, 1, 1), v(0, 0, 0, 0), 0.5)).toBe(false);
            expect('__type__' in color4FromUnit(0xffff0000)).toBe(false);
        });
    });
});
