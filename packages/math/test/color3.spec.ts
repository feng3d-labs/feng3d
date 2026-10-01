import { describe, expect, it } from 'vitest';

import { Color3 } from '../src/Color3';
import { Color4 } from '../src/Color4';
import { Vector3 } from '../src/geom/Vector3';

/**
 * `Color3`（`packages/math/src/Color3.ts`，62 行，此前**行覆盖率 17.74%**）。
 *
 * 三通道颜色（`r/g/b`，`[0,1]` 浮点）。与 `Color4` 同族，但有几处**精确可断言**的格式语义：
 *
 * - **`fromUnit(color)`**：按 **`0xRRGGBB`** 拆字节并 `/0xff`（**没有 alpha 段**）；
 * - **`toInt()`**：`(r*0xff << 16) + (g*0xff << 8) + b*0xff` —— 最大 `0xffffff`，
 *   **不会碰到符号位**，所以它**不像 `Color4.toInt()` 那样返回负数**（两者行为不同，值得钉住）；
 * - **`toHexString()`**：`` `#${ToHex(R)}${ToHex(G)}${ToHex(B)}` `` → **6 位、大写**；
 * - **`static ToHex(i)`**：`i.toString(16)`，**不足 2 位时补 `0`，最后统一大写**
 *   （所以 `ToHex(0) === '00'`、`ToHex(15) === '0F'`、`ToHex(255) === 'FF'`）；
 * - **`toString()`**：`` `{R: ${r} G:${g} B:${b}}` ``（注意 `G:` 后**没有空格**，与 `R:` 不同）；
 * - **`mix` / `scale` 原地改并返回 `this`**，**`mixTo` / `scaleTo` 走 `vout.copy(this)…` 不改自身**。
 */

const c = (r: number, g: number, b: number) => new Color3(r, g, b);

describe('Color3（math）', () =>
{
    describe('构造与 setTo', () =>
    {
        it('默认是白色 (1,1,1)', () =>
        {
            const x = new Color3();

            expect(x.r).toBe(1);
            expect(x.g).toBe(1);
            expect(x.b).toBe(1);
        });

        it('三参构造按顺序写入 r/g/b', () =>
        {
            const x = c(0.1, 0.2, 0.3);

            expect(x.r).toBeCloseTo(0.1, 10);
            expect(x.g).toBeCloseTo(0.2, 10);
            expect(x.b).toBeCloseTo(0.3, 10);
        });

        it('★ setTo 写入并返回 this（可链式）', () =>
        {
            const x = new Color3();

            expect(x.setTo(0.5, 0.6, 0.7)).toBe(x);
            expect(x.r).toBeCloseTo(0.5, 10);
            expect(x.b).toBeCloseTo(0.7, 10);
        });
    });

    describe('★ fromUnit（0xRRGGBB 归一化）', () =>
    {
        it('★★ 0xff0000 → 红色 (1,0,0)', () =>
        {
            const x = new Color3().fromUnit(0xff0000);

            expect(x.r).toBeCloseTo(1, 10);
            expect(x.g).toBeCloseTo(0, 10);
            expect(x.b).toBeCloseTo(0, 10);
        });

        it('★★ 0x0000ff → 蓝色 (0,0,1)', () =>
        {
            const x = new Color3().fromUnit(0x0000ff);

            expect(x.r).toBeCloseTo(0, 10);
            expect(x.g).toBeCloseTo(0, 10);
            expect(x.b).toBeCloseTo(1, 10);
        });

        it('★ 静态版与实例版结果一致', () =>
        {
            const a = Color3.fromUnit(0x123456);
            const b = new Color3().fromUnit(0x123456);

            expect(a.r).toBeCloseTo(b.r, 12);
            expect(a.g).toBeCloseTo(b.g, 12);
            expect(a.b).toBeCloseTo(b.b, 12);
        });

        it('★ fromColor4 只取 r/g/b，丢掉 alpha', () =>
        {
            const x = Color3.fromColor4(new Color4(0.1, 0.2, 0.3, 0.4));

            expect(x.r).toBeCloseTo(0.1, 10);
            expect(x.g).toBeCloseTo(0.2, 10);
            expect(x.b).toBeCloseTo(0.3, 10);
        });
    });

    describe('★★ toInt：与 fromUnit 互逆，且不会变成负数（与 Color4 不同）', () =>
    {
        it('★★ 若干整数颜色往返后不变（含最高位为 1 的 0xff0000）', () =>
        {
            for (const int of [0x000000, 0xff0000, 0x00ff00, 0x0000ff, 0xffffff, 0x123456])
            {
                expect(new Color3().fromUnit(int).toInt(), `0x${int.toString(16)}`).toBe(int);
            }
        });

        it('★★ toInt 结果恒为非负（与 Color4.toInt 的有符号行为不同）', () =>
        {
            // Color4.toInt() 因为把 alpha 放到最高字节而可能返回负数（如 (1,0,0,1) → -65536）；
            // Color3 没有 alpha 段，最高只到 0xff0000，因此恒为非负。
            for (const int of [0xff0000, 0xffffff])
            {
                expect(new Color3().fromUnit(int).toInt()).toBeGreaterThan(0);
            }
            expect(c(1, 1, 1).toInt()).toBe(0xffffff);
        });
    });

    describe('★★ ToHex / toHexString 的格式', () =>
    {
        it("★★ static ToHex：不足两位补 0，并统一大写", () =>
        {
            expect(Color3.ToHex(0)).toBe('00');
            expect(Color3.ToHex(1)).toBe('01');
            expect(Color3.ToHex(15)).toBe('0F');
            expect(Color3.ToHex(16)).toBe('10');
            expect(Color3.ToHex(255)).toBe('FF');
        });

        it('★★ toHexString 是 6 位大写 #RRGGBB', () =>
        {
            expect(c(1, 0, 0).toHexString()).toBe('#FF0000');
            expect(c(0, 1, 0).toHexString()).toBe('#00FF00');
            expect(c(0, 0, 1).toHexString()).toBe('#0000FF');
            expect(c(1, 1, 1).toHexString()).toBe('#FFFFFF');
            expect(c(0, 0, 0).toHexString()).toBe('#000000');
        });

        it('★ toHexString 以 # 开头、长度 7', () =>
        {
            const s = c(0.2, 0.4, 0.6).toHexString();

            expect(s.startsWith('#')).toBe(true);
            expect(s.length).toBe(7);
        });

        it('★★ toInt 可能返回**非整数** —— 最后一项 b*0xff 不取整，如实钉住', () =>
        {
            // 实现是 (r*0xff << 16) + (g*0xff << 8) + b*0xff：
            // 前两项经过 `<<` 会被 ToInt32 截断，但**最后一项 b*0xff 不取整**。
            // 所以 (0.5, 0.25, 0.75).toInt() 是 8339391.25，而不是整数。
            // 第一版我按"toHexString 与 toInt 数值相同"断言，失败后才查出来。
            const value = c(0.5, 0.25, 0.75).toInt();

            expect(Number.isInteger(value)).toBe(false);
            expect(value).toBeCloseTo(8339391.25, 6);
        });

        it('★ 分量恰好是 n/255 时 toInt 是整数（往返才成立的前提）', () =>
        {
            for (const int of [0x000000, 0xff0000, 0x00ff00, 0x0000ff, 0xffffff, 0x123456])
            {
                expect(Number.isInteger(new Color3().fromUnit(int).toInt()), `0x${int.toString(16)}`).toBe(true);
            }
        });

        it('★ toHexString 会把分量截断成整数（实现里用 | 0）', () =>
        {
            expect(Number.isInteger(parseInt(c(0.5, 0.25, 0.75).toHexString().slice(1), 16))).toBe(true);
        });
    });

    describe('★ mix / mixTo', () =>
    {
        it('★★ 中点得到分量平均', () =>
        {
            const x = c(1, 0, 0);

            x.mix(c(0, 0, 1), 0.5);

            expect(x.r).toBeCloseTo(0.5, 10);
            expect(x.g).toBeCloseTo(0, 10);
            expect(x.b).toBeCloseTo(0.5, 10);
        });

        it('★ mix 原地改并返回 this', () =>
        {
            const x = c(1, 0, 0);

            expect(x.mix(c(0, 0, 1), 0.5)).toBe(x);
        });

        it('★★ mixTo 不改自身，而是写入 vout', () =>
        {
            const x = c(1, 0, 0);
            const out = new Color3();

            expect(x.mixTo(c(0, 0, 1), 0.5, out)).toBe(out);
            expect(x.r, 'x 不该被改').toBeCloseTo(1, 10);
            expect(out.b).toBeCloseTo(0.5, 10);
        });
    });

    describe('★ scale / scaleTo', () =>
    {
        it('★★ scale 每个分量各乘 s（原地、返回 this）', () =>
        {
            const x = c(0.25, 0.5, 0.75);

            expect(x.scale(2)).toBe(x);
            expect(x.r).toBeCloseTo(0.5, 10);
            expect(x.g).toBeCloseTo(1, 10);
            expect(x.b).toBeCloseTo(1.5, 10);
        });

        it('★ scaleTo 不改自身，而是写入 vout', () =>
        {
            const x = c(0.5, 0.5, 0.5);
            const out = new Color3();

            x.scaleTo(2, out);

            expect(x.r, 'x 不该被改').toBeCloseTo(0.5, 10);
            expect(out.r).toBeCloseTo(1, 10);
        });
    });

    describe('equals / copy / clone / 转换 / toString', () =>
    {
        it('★ equals：相同为真、分量不同为假', () =>
        {
            expect(c(0.1, 0.2, 0.3).equals(c(0.1, 0.2, 0.3))).toBe(true);
            expect(c(0.1, 0.2, 0.3).equals(c(0.1, 0.2, 0.4))).toBe(false);
        });

        it('★ copy / clone：复制分量，clone 产生独立对象', () =>
        {
            const src = c(0.1, 0.2, 0.3);
            const dst = new Color3().copy(src);
            const cloned = src.clone();

            expect(dst.r).toBeCloseTo(0.1, 10);
            expect(dst.b).toBeCloseTo(0.3, 10);
            expect(cloned).not.toBe(src);
            expect(cloned.g).toBeCloseTo(0.2, 10);
        });

        it('★ toVector3 与 toArray 的分量顺序是 r/g/b', () =>
        {
            const x = c(0.1, 0.2, 0.3);
            const v3 = x.toVector3();

            expect(v3).toBeInstanceOf(Vector3);
            expect(v3.x).toBeCloseTo(0.1, 10);
            expect(v3.y).toBeCloseTo(0.2, 10);
            expect(v3.z).toBeCloseTo(0.3, 10);

            const arr: number[] = [];

            x.toArray(arr);
            expect(arr.length).toBe(3);
            expect(arr[0]).toBeCloseTo(0.1, 10);
            expect(arr[2]).toBeCloseTo(0.3, 10);
        });

        it("★★ toString 的格式是 `{R: … G:… B:…}`（注意 G: 后没有空格）", () =>
        {
            expect(c(0.5, 0.25, 0.125).toString()).toBe('{R: 0.5 G:0.25 B:0.125}');
        });
    });
});
