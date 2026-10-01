import { describe, expect, it } from 'vitest';

import { Color3 } from '../src/Color3';
import { Color4 } from '../src/Color4';
import { Vector4 } from '../src/geom/Vector4';

/**
 * `Color4`（`packages/math/src/Color4.ts`，99 行，此前**行覆盖率 23.23%**）。
 *
 * 带 alpha 的颜色类。实测到的**关键格式语义**（都来自实现本体）：
 *
 * - **`fromUnit(color)`**：把整数按 **`0xAARRGGBB`** 拆开并**归一化到 `[0,1]`**
 *   （每段 `/ 0xff`）；`fromUnit24(color, a = 1)` 则是 **`0xRRGGBB`**（走 `Color3.fromUnit`）；
 * - **`toInt()`**：`(a*0xff << 24) + (r*0xff << 16) + (g*0xff << 8) + b*0xff`
 *   —— 因此与 `fromUnit` **互为逆运算**；
 * - **`toHexString()`**：`` `#${A}${R}${G}${B}` ``（**8 位、含 alpha、顺序是 AARRGGBB**）；
 * - **`toRGBA()`**：`` `rgba(r*255,g*255,b*255,a)` ``（分量**不取整**）；
 * - **`mix` / `multiply` / `multiplyNumber` 都是原地修改并返回 `this`**，
 *   而 **`mixTo` / `multiplyTo` 走 `vout.copy(this)…`，不改 `this`**。
 *
 * 所以断言以**往返不变量**与**格式**为主，配合 `mix` 的线性性质。
 */

const v = (r: number, g: number, b: number, a = 1) => new Color4(r, g, b, a);

describe('Color4（math）', () =>
{
    describe('构造与 setTo', () =>
    {
        it('默认是白色 (1,1,1,1)', () =>
        {
            const c = new Color4();

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

        it('★ setTo 四参写入并返回 this；省略 a 时 a 取 1', () =>
        {
            const c = new Color4();

            expect(c.setTo(0.5, 0.6, 0.7)).toBe(c);
            expect(c.a).toBe(1);

            c.setTo(0.1, 0.2, 0.3, 0.4);
            expect(c.a).toBeCloseTo(0.4, 10);
        });
    });

    describe('★ fromUnit（0xAARRGGBB 归一化）', () =>
    {
        it('★★ 0xffff0000 → 不透明红色 (1,0,0,1)', () =>
        {
            const c = new Color4().fromUnit(0xffff0000);

            expect(c.r).toBeCloseTo(1, 10);
            expect(c.g).toBeCloseTo(0, 10);
            expect(c.b).toBeCloseTo(0, 10);
            expect(c.a).toBeCloseTo(1, 10);
        });

        it('★★ 0xff0000ff → 不透明蓝色 (0,0,1,1)', () =>
        {
            const c = new Color4().fromUnit(0xff0000ff);

            expect(c.r).toBeCloseTo(0, 10);
            expect(c.g).toBeCloseTo(0, 10);
            expect(c.b).toBeCloseTo(1, 10);
            expect(c.a).toBeCloseTo(1, 10);
        });

        it('★ alpha 段来自最高字节：0x00000000 是全透明', () =>
        {
            const c = new Color4().fromUnit(0);

            expect(c.a).toBeCloseTo(0, 10);
        });

        it('★ 静态版与实例版结果一致', () =>
        {
            const a = Color4.fromUnit(0x80123456);
            const b = new Color4().fromUnit(0x80123456);

            expect(a.r).toBeCloseTo(b.r, 12);
            expect(a.g).toBeCloseTo(b.g, 12);
            expect(a.b).toBeCloseTo(b.b, 12);
            expect(a.a).toBeCloseTo(b.a, 12);
        });

        it('★ fromUnit24 把 0xRRGGBB 与给定的 alpha 组合', () =>
        {
            const c = new Color4().fromUnit24(0xff0000, 0.5);

            expect(c.r).toBeCloseTo(1, 10);
            expect(c.g).toBeCloseTo(0, 10);
            expect(c.b).toBeCloseTo(0, 10);
            expect(c.a).toBeCloseTo(0.5, 10);
        });

        it('fromUnit24 省略 alpha 时是 1', () =>
        {
            expect(new Color4().fromUnit24(0x00ff00).a).toBe(1);
        });
    });

    describe('★★ toInt 与 fromUnit 互为逆运算', () =>
    {
        it('★★ toInt 返回**有符号 32 位**：alpha ≥ 0x80 时是负数', () =>
        {
            // 实测：实现是 (a*0xff << 24) + (r*0xff << 16) + (g*0xff << 8) + b*0xff，
            // 而 JS 的 `<<` 是**有符号**位移，所以 0xff << 24 === -16777216。
            // 第一版我按"与 fromUnit 互为逆运算"断言（期望 0xffff0000 = 4294901760），失败后才查出来。
            expect(v(1, 0, 0, 1).toInt()).toBe(-65536);    // === 0xffff0000 | 0
            expect(v(1, 1, 1, 1).toInt()).toBe(-1);        // === 0xffffffff | 0
            expect(v(0, 0, 0, 0).toInt()).toBe(0);         // 全 0 仍是 0
        });

        it('★★ alpha < 0x80 时 toInt 与 fromUnit 确实互为逆运算', () =>
        {
            for (const int of [0x00000000, 0x7f0000ff, 0x7f123456, 0x00123456])
            {
                expect(new Color4().fromUnit(int).toInt(), `0x${int.toString(16)}`).toBe(int);
            }
        });
    });

    describe('★ toHexString / toRGBA 的格式', () =>
    {
        it('★★ toHexString 是 8 位 #AARRGGBB（大小写不敏感地比对）', () =>
        {
            expect(v(1, 0, 0, 1).toHexString().toLowerCase()).toBe('#ffff0000');
            expect(v(0, 0, 0, 0).toHexString().toLowerCase()).toBe('#00000000');
            expect(v(1, 1, 1, 1).toHexString().toLowerCase()).toBe('#ffffffff');
        });

        it('★ toHexString 以 # 开头、长度 9', () =>
        {
            const s = v(0.2, 0.4, 0.6, 0.8).toHexString();

            expect(s.startsWith('#')).toBe(true);
            expect(s.length).toBe(9);
        });

        it('★ toRGBA 输出 rgba(r,g,b,a) 形式', () =>
        {
            expect(v(1, 0, 0, 1).toRGBA()).toBe('rgba(255,0,0,1)');
            expect(v(0, 0, 0, 0).toRGBA()).toBe('rgba(0,0,0,0)');
        });

        it('★ toRGBA 的分量不取整（0.5 → 127.5）', () =>
        {
            expect(v(0.5, 0, 0, 1).toRGBA()).toBe('rgba(127.5,0,0,1)');
        });
    });

    describe('★ mix / mixTo（线性插值）', () =>
    {
        it('★★ rate=0.5 得到分量平均', () =>
        {
            const c = v(1, 0, 0, 1);

            c.mix(v(0, 0, 1, 1), 0.5);

            expect(c.r).toBeCloseTo(0.5, 10);
            expect(c.g).toBeCloseTo(0, 10);
            expect(c.b).toBeCloseTo(0.5, 10);
            expect(c.a).toBeCloseTo(1, 10);
        });

        it('★ rate=0 保持自身，rate=1 变成另一色', () =>
        {
            const a = v(1, 0, 0, 1);

            a.mix(v(0, 0, 1, 1), 0);
            expect(a.b).toBeCloseTo(0, 10);

            const b = v(1, 0, 0, 1);

            b.mix(v(0, 0, 1, 1), 1);
            expect(b.b).toBeCloseTo(1, 10);
            expect(b.r).toBeCloseTo(0, 10);
        });

        it('★ mix 原地修改并返回 this', () =>
        {
            const a = v(1, 0, 0, 1);

            expect(a.mix(v(0, 0, 1, 1), 0.5)).toBe(a);
        });

        it('★★ mixTo 不改 this，而是写入 vout', () =>
        {
            const a = v(1, 0, 0, 1);
            const out = new Color4();
            const ret = a.mixTo(v(0, 0, 1, 1), 0.5, out);

            expect(ret).toBe(out);
            expect(a.r, 'a 不该被改').toBeCloseTo(1, 10);
            expect(a.b).toBeCloseTo(0, 10);
            expect(out.b).toBeCloseTo(0.5, 10);
        });

        it('★ mixTo 省略 vout 时会新建一个', () =>
        {
            const a = v(1, 0, 0, 1);
            const out = a.mixTo(v(0, 0, 1, 1), 0.5);

            expect(out).not.toBe(a);
            expect(out.b).toBeCloseTo(0.5, 10);
        });
    });

    describe('★ multiply / multiplyNumber', () =>
    {
        it('★★ multiply 是分量相乘（原地、返回 this）', () =>
        {
            const a = v(1, 0.5, 0.25, 1);

            expect(a.multiply(v(0.5, 0.5, 0.5, 1))).toBe(a);
            expect(a.r).toBeCloseTo(0.5, 10);
            expect(a.g).toBeCloseTo(0.25, 10);
            expect(a.b).toBeCloseTo(0.125, 10);
        });

        it('★ multiplyTo 不改 this，而是写入 vout', () =>
        {
            const a = v(1, 1, 1, 1);
            const out = new Color4();

            a.multiplyTo(v(0.5, 0.25, 0.125, 1), out);

            expect(a.r, 'a 不该被改').toBeCloseTo(1, 10);
            expect(out.r).toBeCloseTo(0.5, 10);
            expect(out.g).toBeCloseTo(0.25, 10);
        });

        it('★★ multiplyNumber 每个分量各乘 scale（包括 alpha）', () =>
        {
            const c = v(0.5, 0.5, 0.5, 0.5);

            c.multiplyNumber(2);

            expect(c.r).toBeCloseTo(1, 10);
            expect(c.g).toBeCloseTo(1, 10);
            expect(c.b).toBeCloseTo(1, 10);
            expect(c.a).toBeCloseTo(1, 10);
        });
    });

    describe('equals / copy / clone / 转换', () =>
    {
        it('★ equals：相同为真、分量不同为假', () =>
        {
            expect(v(0.1, 0.2, 0.3, 0.4).equals(v(0.1, 0.2, 0.3, 0.4))).toBe(true);
            expect(v(0.1, 0.2, 0.3, 0.4).equals(v(0.1, 0.2, 0.3, 0.5))).toBe(false);
        });

        it('★ copy / clone 复制四个分量，clone 产生独立对象', () =>
        {
            const src = v(0.1, 0.2, 0.3, 0.4);
            const dst = new Color4().copy(src);
            const cloned = src.clone();

            expect(dst.r).toBeCloseTo(0.1, 10);
            expect(dst.a).toBeCloseTo(0.4, 10);
            expect(cloned).not.toBe(src);
            expect(cloned.b).toBeCloseTo(0.3, 10);
        });

        it('★ toColor3 取 r/g/b 丢掉 alpha；toVector4 四分量对应；toArray 写入数组', () =>
        {
            const c = v(0.1, 0.2, 0.3, 0.4);

            const c3 = c.toColor3();

            expect(c3).toBeInstanceOf(Color3);
            expect(c3.r).toBeCloseTo(0.1, 10);
            expect(c3.b).toBeCloseTo(0.3, 10);

            const v4 = c.toVector4();

            expect(v4).toBeInstanceOf(Vector4);
            expect(v4.x).toBeCloseTo(0.1, 10);
            expect(v4.w).toBeCloseTo(0.4, 10);

            const arr: number[] = [];

            c.toArray(arr);
            expect(arr.length).toBe(4);
            expect(arr[0]).toBeCloseTo(0.1, 10);
            expect(arr[3]).toBeCloseTo(0.4, 10);
        });

        it('★ toString 返回字符串', () =>
        {
            expect(typeof v(0.1, 0.2, 0.3, 0.4).toString()).toBe('string');
        });
    });
});
