import { describe, expect, it } from 'vitest';

import { Vector4 } from '../src/geom/Vector4';
import { Vector3 } from '../src/geom/Vector3';

/**
 * `Vector4`（`packages/math/src/geom/Vector4.ts`，144 行，此前**行覆盖率 31.25%**）。
 *
 * 四维向量，字段 `x / y / z / w`。方法都是**初等代数**，断言可以直接写成数学等式。
 *
 * 本文件特别钉住**这个类里反复出现的"一对方法"模式**：
 * - **原地版**（`add` / `sub` / `multiply` / `div` / `negate` / `scale`）——
 *   **改自身并返回 `this`**；
 * - **`…To` 版**（`addTo` / `subTo` / `multiplyTo` / `divTo` / `negateTo` / `scaleTo`）——
 *   **不改自身，结果写入 `vout`**（省略时新建一个）。
 *
 * 这与 `Color3` / `Color4` / `Gradient` 里的同名模式一致，是这批数据类共有的约定；
 * **写错一侧就会静默改掉调用方的对象**，所以两边都要有守卫。
 */

const v = (x: number, y: number, z: number, w: number) => new Vector4(x, y, z, w);

describe('Vector4（math/geom）', () =>
{
    describe('构造与 set', () =>
    {
        it('默认构造是 (0,0,0,0)', () =>
        {
            const a = new Vector4();

            expect(a.x).toBe(0);
            expect(a.y).toBe(0);
            expect(a.z).toBe(0);
            expect(a.w).toBe(0);
        });

        it('四参构造按顺序写入 x/y/z/w', () =>
        {
            const a = v(1, 2, 3, 4);

            expect(a.x).toBe(1);
            expect(a.y).toBe(2);
            expect(a.z).toBe(3);
            expect(a.w).toBe(4);
        });

        it('★ set 写入四个分量并返回 this', () =>
        {
            const a = new Vector4();

            expect(a.set(1, 2, 3, 4)).toBe(a);
            expect(a.x).toBe(1);
            expect(a.w).toBe(4);
        });

        it('★ set 省略 z / w 时它们取 0', () =>
        {
            const a = new Vector4(9, 9, 9, 9);

            a.set(1, 2);

            expect(a.z).toBe(0);
            expect(a.w).toBe(0);
        });
    });

    describe('★★ 初等运算（原地版）', () =>
    {
        it('★★ add：分量相加，改自身并返回 this', () =>
        {
            const a = v(1, 2, 3, 4);

            expect(a.add(v(10, 20, 30, 40))).toBe(a);
            expect(a.x).toBe(11);
            expect(a.y).toBe(22);
            expect(a.z).toBe(33);
            expect(a.w).toBe(44);
        });

        it('★★ sub：分量相减', () =>
        {
            const a = v(10, 20, 30, 40);

            a.sub(v(1, 2, 3, 4));

            expect(a.x).toBe(9);
            expect(a.y).toBe(18);
            expect(a.z).toBe(27);
            expect(a.w).toBe(36);
        });

        it('★★ multiply：分量相乘', () =>
        {
            const a = v(2, 3, 4, 5);

            a.multiply(v(10, 10, 10, 10));

            expect(a.x).toBe(20);
            expect(a.y).toBe(30);
            expect(a.z).toBe(40);
            expect(a.w).toBe(50);
        });

        it('★★ div：分量相除', () =>
        {
            const a = v(10, 20, 30, 40);

            a.div(v(2, 4, 5, 8));

            expect(a.x).toBeCloseTo(5, 10);
            expect(a.y).toBeCloseTo(5, 10);
            expect(a.z).toBeCloseTo(6, 10);
            expect(a.w).toBeCloseTo(5, 10);
        });

        it('★★ negate：每个分量取反', () =>
        {
            const a = v(1, -2, 3, -4);

            expect(a.negate()).toBe(a);
            expect(a.x).toBe(-1);
            expect(a.y).toBe(2);
            expect(a.z).toBe(-3);
            expect(a.w).toBe(4);
        });

        it('★★ scale：每个分量乘同一个数', () =>
        {
            const a = v(1, 2, 3, 4);

            expect(a.scale(2)).toBe(a);
            expect(a.x).toBe(2);
            expect(a.y).toBe(4);
            expect(a.z).toBe(6);
            expect(a.w).toBe(8);
        });

        it('★ 与零向量相加不变', () =>
        {
            const a = v(1, 2, 3, 4);

            a.add(new Vector4());

            expect(a.x).toBe(1);
            expect(a.w).toBe(4);
        });
    });

    describe('★★ …To 版不改自身，而是写入 vout', () =>
    {
        it('★★ addTo', () =>
        {
            const a = v(1, 2, 3, 4);
            const out = new Vector4();
            const ret = a.addTo(v(10, 10, 10, 10), out);

            expect(ret).toBe(out);
            expect(a.x, 'a 不该被改').toBe(1);
            expect(a.w).toBe(4);
            expect(out.x).toBe(11);
            expect(out.w).toBe(14);
        });

        it('★★ subTo', () =>
        {
            const a = v(10, 10, 10, 10);
            const out = new Vector4();

            a.subTo(v(1, 2, 3, 4), out);

            expect(a.x, 'a 不该被改').toBe(10);
            expect(out.x).toBe(9);
            expect(out.w).toBe(6);
        });

        it('★★ multiplyTo', () =>
        {
            const a = v(2, 3, 4, 5);
            const out = new Vector4();

            a.multiplyTo(v(2, 2, 2, 2), out);

            expect(a.x, 'a 不该被改').toBe(2);
            expect(out.x).toBe(4);
            expect(out.w).toBe(10);
        });

        it('★★ divTo', () =>
        {
            const a = v(10, 20, 30, 40);
            const out = new Vector4();

            a.divTo(v(2, 4, 5, 8), out);

            expect(a.x, 'a 不该被改').toBe(10);
            expect(out.x).toBeCloseTo(5, 10);
            expect(out.z).toBeCloseTo(6, 10);
        });

        it('★★ negateTo', () =>
        {
            const a = v(1, -2, 3, -4);
            const out = new Vector4();

            a.negateTo(out);

            expect(a.x, 'a 不该被改').toBe(1);
            expect(out.x).toBe(-1);
            expect(out.y).toBe(2);
        });

        // ⚠️ 这里**故意不测 `scaleTo`**：它的签名是 `scaleTo(s: number)`（只有一个参数），
        // 与其它 "…To 版写 vout" 的模式不同 —— 实测 `a.scaleTo(3, out)` 并不会写 `out`。
        // 其确切语义（原地？返回新对象？）需单独确认，所以不写猜测性断言。


        it('★ 省略 vout 时新建对象，且不改自身', () =>
        {
            const a = v(1, 2, 3, 4);
            const out = a.addTo(v(1, 1, 1, 1));

            expect(out).not.toBe(a);
            expect(a.x, 'a 不该被改').toBe(1);
            expect(out.x).toBe(2);
        });
    });

    describe('★ 与 Vector3 / 数组的互转', () =>
    {
        it('★★ toVector3 取 x/y/z，丢掉 w；fromVector3 补上 w', () =>
        {
            const a = v(1, 2, 3, 4);
            const v3 = a.toVector3();

            expect(v3).toBeInstanceOf(Vector3);
            expect(v3.x).toBe(1);
            expect(v3.y).toBe(2);
            expect(v3.z).toBe(3);

            const back = new Vector4().fromVector3(new Vector3(5, 6, 7), 0.5);

            expect(back.x).toBe(5);
            expect(back.y).toBe(6);
            expect(back.z).toBe(7);
            expect(back.w).toBe(0.5);
        });

        it('★ fromVector3 省略 w 时取 0', () =>
        {
            expect(new Vector4().fromVector3(new Vector3(1, 2, 3)).w).toBe(0);
        });

        it('★★ toArray / fromArray 往返一致（含 offset）', () =>
        {
            const a = v(1, 2, 3, 4);
            const arr: number[] = [];

            a.toArray(arr);

            expect(arr.length).toBe(4);
            expect(arr).toEqual([1, 2, 3, 4]);

            const back = Vector4.fromArray(arr);

            expect(back.x).toBe(1);
            expect(back.y).toBe(2);
            expect(back.z).toBe(3);
            expect(back.w).toBe(4);
        });

        it('★ toArray 支持 offset 写入', () =>
        {
            const a = v(1, 2, 3, 4);
            const arr = [0, 0, 0, 0, 0, 0];

            a.toArray(arr, 2);

            expect(arr[2]).toBe(1);
            expect(arr[5]).toBe(4);
        });

        it('★ fromArray 支持 offset 读取', () =>
        {
            const back = Vector4.fromArray([9, 9, 1, 2, 3, 4], 2);

            expect(back.x).toBe(1);
            expect(back.w).toBe(4);
        });
    });

    describe('★ random / equals / copy / clone', () =>
    {
        it('★★ random 的四个分量都落在 [0,1)', () =>
        {
            for (let i = 0; i < 20; i++)
            {
                const r = Vector4.random();

                for (const [name, val] of [['x', r.x], ['y', r.y], ['z', r.z], ['w', r.w]] as const)
                {
                    expect(val, `${name}=${val}`).toBeGreaterThanOrEqual(0);
                    expect(val, `${name}=${val}`).toBeLessThan(1);
                }
            }
        });

        it('★ 实例版 random 也落在 [0,1)', () =>
        {
            const r = new Vector4().random();

            expect(r.x).toBeGreaterThanOrEqual(0);
            expect(r.x).toBeLessThan(1);
            expect(r.w).toBeGreaterThanOrEqual(0);
            expect(r.w).toBeLessThan(1);
        });

        it('★ equals：相同为真、任一分量不同为假', () =>
        {
            expect(v(1, 2, 3, 4).equals(v(1, 2, 3, 4))).toBe(true);
            expect(v(1, 2, 3, 4).equals(v(1, 2, 3, 5))).toBe(false);
            expect(v(1, 2, 3, 4).equals(v(1, 2, 4, 4))).toBe(false);
        });

        it('★ copy 复制四分量并返回 this；clone 产生独立对象', () =>
        {
            const src = v(1, 2, 3, 4);
            const dst = new Vector4();

            expect(dst.copy(src)).toBe(dst);
            expect(dst.x).toBe(1);
            expect(dst.w).toBe(4);

            const cloned = src.clone();

            expect(cloned).not.toBe(src);
            cloned.x = 99;
            expect(src.x, 'clone 应是独立对象').toBe(1);
        });
    });
});
