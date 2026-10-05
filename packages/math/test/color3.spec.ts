import { describe, expect, it } from 'vitest';

import type { Color3 } from '../src/color/color3';
import {
    color3Copy,
    color3Equals,
    color3FromUnit,
    color3Mix,
    color3Scale,
    color3SetTo,
    color3ToArray,
    color3ToHex,
    color3ToHexString,
    color3ToInt,
    color3ToString,
    color3ToVector3,
} from '../src/color/color3';

/**
 * `Color3` 的**纯数据形态 + 纯函数层**（`packages/math/src/color/color3.ts`）。
 *
 * **阶段 C-b 起 `packages/math/src/Color3.ts` 的 class 已删除**，本文件由「class 行为用例」
 * 改写为「纯函数用例」，断言逐条保留（`new Color3(r,g,b)` → `color3SetTo(r,g,b)`、
 * `c.mixTo(o, rate, out)` → `color3Mix(c, o, rate, out)`、`Color3.ToHex(i)` → `color3ToHex(i)`）。
 * 原「class 委托接线」用例随 class 一起删除——委托方已不存在，手算用例就是等价网。
 *
 * 三通道颜色（`r/g/b`，`[0,1]` 浮点）。几处**精确可断言**的格式语义：
 *
 * - **`color3FromUnit(color)`**：按 **`0xRRGGBB`** 拆字节并 `/0xff`（**没有 alpha 段**）；
 * - **`color3ToInt()`**：`(r*0xff << 16) + (g*0xff << 8) + b*0xff` —— 最大 `0xffffff`，
 *   **不会碰到符号位**，所以它**不像 `color4ToInt()` 那样返回负数**（两者行为不同，值得钉住）；
 * - **`color3ToHexString()`**：`` `#${color3ToHex(R)}${color3ToHex(G)}${color3ToHex(B)}` `` → **6 位、大写**；
 * - **`color3ToHex(i)`**：`i.toString(16)`，**不足 2 位时补 `0`，最后统一大写**
 *   （所以 `color3ToHex(0) === '00'`、`color3ToHex(15) === '0F'`、`color3ToHex(255) === 'FF'`）；
 * - **`color3ToString()`**：`` `{R: ${r} G:${g} B:${b}}` ``（注意 `G:` 后**没有空格**，与 `R:` 不同）；
 * - 纯函数**只读入参**，结果写 `out`：`out` 传自己即原 class 的 `mix` / `scale`（就地改），
 *   传别的（或缺省）即原 class 的 `mixTo` / `scaleTo`。
 */

/** 原 `new Color3(r, g, b)` 的字面量形态（纯函数层的 `out` 目标，不带判别字段）。 */
const c = (r: number, g: number, b: number) => ({ r, g, b });

/** 数据声明形态：带 `readonly __type__: 'Color3'` 判别字段（方案 §5.9 的 D1 决策）。 */
const marked = (r: number, g: number, b: number): Color3 => ({ __type__: 'Color3', r, g, b });

describe('Color3（math）', () =>
{
    describe('构造与 setTo', () =>
    {
        it('默认是白色 (1,1,1)', () =>
        {
            const x = marked(1, 1, 1);

            expect(x.__type__).toBe('Color3');
            expect(x.r).toBe(1);
            expect(x.g).toBe(1);
            expect(x.b).toBe(1);
        });

        it('三参构造按顺序写入 r/g/b', () =>
        {
            const x = color3SetTo(0.1, 0.2, 0.3);

            expect(x.r).toBeCloseTo(0.1, 10);
            expect(x.g).toBeCloseTo(0.2, 10);
            expect(x.b).toBeCloseTo(0.3, 10);
        });

        it('★ setTo 写入并返回 out（可链式）', () =>
        {
            const x = c(1, 1, 1);

            expect(color3SetTo(0.5, 0.6, 0.7, x)).toBe(x);
            expect(x.r).toBeCloseTo(0.5, 10);
            expect(x.b).toBeCloseTo(0.7, 10);
        });
    });

    describe('★ fromUnit（0xRRGGBB 归一化）', () =>
    {
        it('★★ 0xff0000 → 红色 (1,0,0)', () =>
        {
            const x = color3FromUnit(0xff0000);

            expect(x.r).toBeCloseTo(1, 10);
            expect(x.g).toBeCloseTo(0, 10);
            expect(x.b).toBeCloseTo(0, 10);
        });

        it('★★ 0x0000ff → 蓝色 (0,0,1)', () =>
        {
            const x = color3FromUnit(0x0000ff);

            expect(x.r).toBeCloseTo(0, 10);
            expect(x.g).toBeCloseTo(0, 10);
            expect(x.b).toBeCloseTo(1, 10);
        });

        it('★ 缺省 out 与写入已有 out 结果一致', () =>
        {
            const a = color3FromUnit(0x123456);
            const b = c(1, 1, 1);

            color3FromUnit(0x123456, b);

            expect(a.r).toBeCloseTo(b.r, 12);
            expect(a.g).toBeCloseTo(b.g, 12);
            expect(a.b).toBeCloseTo(b.b, 12);
        });
    });

    describe('★★ toInt：与 fromUnit 互逆，且不会变成负数（与 Color4 不同）', () =>
    {
        it('★★ 若干整数颜色往返后不变（含最高位为 1 的 0xff0000）', () =>
        {
            for (const int of [0x000000, 0xff0000, 0x00ff00, 0x0000ff, 0xffffff, 0x123456])
            {
                expect(color3ToInt(color3FromUnit(int)), `0x${int.toString(16)}`).toBe(int);
            }
        });

        it('★★ toInt 结果恒为非负（与 color4ToInt 的有符号行为不同）', () =>
        {
            // color4ToInt() 因为把 alpha 放到最高字节而可能返回负数（如 (1,0,0,1) → -65536）；
            // Color3 没有 alpha 段，最高只到 0xff0000，因此恒为非负。
            for (const int of [0xff0000, 0xffffff])
            {
                expect(color3ToInt(color3FromUnit(int))).toBeGreaterThan(0);
            }
            expect(color3ToInt(c(1, 1, 1))).toBe(0xffffff);
        });
    });

    describe('★★ ToHex / toHexString 的格式', () =>
    {
        it('★★ color3ToHex：不足两位补 0，并统一大写', () =>
        {
            expect(color3ToHex(0)).toBe('00');
            expect(color3ToHex(1)).toBe('01');
            expect(color3ToHex(15)).toBe('0F');
            expect(color3ToHex(16)).toBe('10');
            expect(color3ToHex(255)).toBe('FF');
        });

        it('★★ toHexString 是 6 位大写 #RRGGBB', () =>
        {
            expect(color3ToHexString(c(1, 0, 0))).toBe('#FF0000');
            expect(color3ToHexString(c(0, 1, 0))).toBe('#00FF00');
            expect(color3ToHexString(c(0, 0, 1))).toBe('#0000FF');
            expect(color3ToHexString(c(1, 1, 1))).toBe('#FFFFFF');
            expect(color3ToHexString(c(0, 0, 0))).toBe('#000000');
        });

        it('★ toHexString 以 # 开头、长度 7', () =>
        {
            const s = color3ToHexString(c(0.2, 0.4, 0.6));

            expect(s.startsWith('#')).toBe(true);
            expect(s.length).toBe(7);
        });

        it('★★ toInt 可能返回**非整数** —— 最后一项 b*0xff 不取整，如实钉住', () =>
        {
            // 实现是 (r*0xff << 16) + (g*0xff << 8) + b*0xff：
            // 前两项经过 `<<` 会被 ToInt32 截断，但**最后一项 b*0xff 不取整**。
            // 所以 (0.5, 0.25, 0.75).toInt() 是 8339391.25，而不是整数。
            // 第一版我按"toHexString 与 toInt 数值相同"断言，失败后才查出来。
            const value = color3ToInt(c(0.5, 0.25, 0.75));

            expect(Number.isInteger(value)).toBe(false);
            expect(value).toBeCloseTo(8339391.25, 6);
        });

        it('★ 分量恰好是 n/255 时 toInt 是整数（往返才成立的前提）', () =>
        {
            for (const int of [0x000000, 0xff0000, 0x00ff00, 0x0000ff, 0xffffff, 0x123456])
            {
                expect(Number.isInteger(color3ToInt(color3FromUnit(int))), `0x${int.toString(16)}`).toBe(true);
            }
        });

        it('★ toHexString 会把分量截断成整数（实现里用 | 0）', () =>
        {
            expect(Number.isInteger(parseInt(color3ToHexString(c(0.5, 0.25, 0.75)).slice(1), 16))).toBe(true);
        });
    });

    describe('★ mix', () =>
    {
        it('★★ 中点得到分量平均', () =>
        {
            const x = c(1, 0, 0);

            color3Mix(x, c(0, 0, 1), 0.5, x);

            expect(x.r).toBeCloseTo(0.5, 10);
            expect(x.g).toBeCloseTo(0, 10);
            expect(x.b).toBeCloseTo(0.5, 10);
        });

        it('★ out 传自己即就地改并返回该对象', () =>
        {
            const x = c(1, 0, 0);

            expect(color3Mix(x, c(0, 0, 1), 0.5, x)).toBe(x);
        });

        it('★★ 缺省 out / 传别的 out 时都不改自身，而是写入 out', () =>
        {
            const x = c(1, 0, 0);
            const out = c(1, 1, 1);

            expect(color3Mix(x, c(0, 0, 1), 0.5, out)).toBe(out);
            expect(x.r, 'x 不该被改').toBeCloseTo(1, 10);
            expect(out.b).toBeCloseTo(0.5, 10);

            const fresh = color3Mix(x, c(0, 0, 1), 0.5);

            expect(fresh).not.toBe(x);
            expect(fresh.b).toBeCloseTo(0.5, 10);
        });
    });

    describe('★ scale', () =>
    {
        it('★★ scale 每个分量各乘 s（out 传自己即就地、返回该对象）', () =>
        {
            const x = c(0.25, 0.5, 0.75);

            expect(color3Scale(x, 2, x)).toBe(x);
            expect(x.r).toBeCloseTo(0.5, 10);
            expect(x.g).toBeCloseTo(1, 10);
            expect(x.b).toBeCloseTo(1.5, 10);
        });

        it('★ scale 传别的 out 时不改自身，而是写入 out', () =>
        {
            const x = c(0.5, 0.5, 0.5);
            const out = c(1, 1, 1);

            color3Scale(x, 2, out);

            expect(x.r, 'x 不该被改').toBeCloseTo(0.5, 10);
            expect(out.r).toBeCloseTo(1, 10);
        });
    });

    describe('equals / copy / 转换 / toString', () =>
    {
        it('★ equals：相同为真、分量不同为假', () =>
        {
            expect(color3Equals(c(0.1, 0.2, 0.3), c(0.1, 0.2, 0.3))).toBe(true);
            expect(color3Equals(c(0.1, 0.2, 0.3), c(0.1, 0.2, 0.4))).toBe(false);
        });

        it('★ copy：复制分量，缺省 out 产生独立对象', () =>
        {
            const src = c(0.1, 0.2, 0.3);
            const dst = c(1, 1, 1);

            color3Copy(src, dst);

            const cloned = color3Copy(src);

            expect(dst.r).toBeCloseTo(0.1, 10);
            expect(dst.b).toBeCloseTo(0.3, 10);
            expect(cloned).not.toBe(src);
            expect(cloned.g).toBeCloseTo(0.2, 10);
        });

        it('★ toVector3 与 toArray 的分量顺序是 r/g/b', () =>
        {
            const x = c(0.1, 0.2, 0.3);
            const v3 = color3ToVector3(x);

            // `out` 是纯函数层的最小形状 `WritableVector3Like`（阶段 C-f 起 `Vector3` 的 class 已删除，
            // 这个字面量本身就是最终形态，不再有「包一层 class 实例」的步骤）
            expect(v3).toEqual({ x: 0.1, y: 0.2, z: 0.3 });
            expect(v3.x).toBeCloseTo(0.1, 10);
            expect(v3.y).toBeCloseTo(0.2, 10);
            expect(v3.z).toBeCloseTo(0.3, 10);

            const arr: number[] = [];

            color3ToArray(x, arr);
            expect(arr.length).toBe(3);
            expect(arr[0]).toBeCloseTo(0.1, 10);
            expect(arr[2]).toBeCloseTo(0.3, 10);
        });

        it("★★ toString 的格式是 `{R: … G:… B:…}`（注意 G: 后没有空格）", () =>
        {
            expect(color3ToString(c(0.5, 0.25, 0.125))).toBe('{R: 0.5 G:0.25 B:0.125}');
        });
    });

    // ── 纯数据形态的契约（issue #134 阶段 C-b）──
    // `Color3` 现在是**带 `readonly __type__: 'Color3'` 的接口**，`Color3Like` 是不带判别字段的
    // 最小形状：纯函数只要求后者，于是普通字面量与带标记的数据可以混用。
    describe('★ 两级形状（C-b）', () =>
    {
        it('★★ 纯函数接受裸字面量，也接受带判别字段的数据', () =>
        {
            const literal = { r: 0, g: 1, b: 0 };
            const data = marked(1, 0, 0);

            expect(color3Mix(data, literal, 0.5)).toEqual({ r: 0.5, g: 0.5, b: 0 });
            expect(color3Mix(literal, data, 0.5)).toEqual({ r: 0.5, g: 0.5, b: 0 });
            expect(color3ToInt(data)).toBe(0xff0000);
            expect(color3Scale(literal, 2)).toEqual({ r: 0, g: 2, b: 0 });
        });

        it('★★ 缺省 out 不带判别字段（是「算出来的值」而不是「被声明的数据」）', () =>
        {
            expect('__type__' in color3Mix(c(1, 1, 1), c(0, 0, 0), 0.5)).toBe(false);
            expect('__type__' in color3FromUnit(0xff0000)).toBe(false);
        });

        it('★★ 只读入参、可复用 out', () =>
        {
            const base = c(1, 1, 1);
            const other = c(0, 0, 0);
            const out = c(-1, -1, -1);

            expect(color3Mix(base, other, 0.25, out)).toBe(out);
            expect(out).toEqual({ r: 0.75, g: 0.75, b: 0.75 });
            expect(base).toEqual({ r: 1, g: 1, b: 1 });
            expect(other).toEqual({ r: 0, g: 0, b: 0 });
        });
    });
});
