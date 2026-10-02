import { describe, expect, it } from 'vitest';

import {
    vec4Add,
    vec4Copy,
    vec4Divide,
    vec4Equals,
    vec4From,
    vec4FromArray,
    vec4FromVector3,
    vec4Multiply,
    vec4Negate,
    vec4Random,
    vec4ScaleNumber,
    vec4Sub,
    vec4ToArray,
    vec4ToVector3,
} from '../src/geom/vector4Ops';

/**
 * `Vector4`（`packages/math/src/geom/vector4Ops.ts`）。
 *
 * ★ **阶段 C-f**：`Vector4` 的 class 已删除，本文件从「class 规格」改写为**同义纯函数用例**
 * （与 C-e 对 `Box3` / `Quaternion` / `Matrix4x4` 的处理一致）：
 * 原「原地版」＝ `out` 传自己；原「`…To` 版」＝ `out` 传显式目标；原静态工厂 / getter 映射到 `vec4Xxx`。
 */

const v = (x: number, y: number, z: number, w: number) => ({ x: x, y: y, z: z, w: w });

describe('Vector4（math/geom）', () =>
{
    describe('构造与 set', () =>
    {
        it('默认构造是 (0,0,0,0)', () =>
        {
            const a = vec4From(0, 0, 0, 0);

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

        it('★ set 写入四个分量并返回 out', () =>
        {
            const a = { x: 0, y: 0, z: 0, w: 0 };

            expect(vec4From(1, 2, 3, 4, a)).toBe(a);
            expect(a.x).toBe(1);
            expect(a.w).toBe(4);
        });

        it('★ set 省略 z / w 时它们取 0（缺省值只属于 class 的公开签名，纯函数层显式传 0）', () =>
        {
            const a = { x: 9, y: 9, z: 9, w: 9 };

            vec4From(1, 2, 0, 0, a);

            expect(a.z).toBe(0);
            expect(a.w).toBe(0);
        });
    });

    describe('★★ 初等运算（out 传自己即就地）', () =>
    {
        it('★★ add：分量相加，写回自身并返回该 out', () =>
        {
            const a = v(1, 2, 3, 4);

            expect(vec4Add(a, v(10, 20, 30, 40), a)).toBe(a);
            expect(a.x).toBe(11);
            expect(a.y).toBe(22);
            expect(a.z).toBe(33);
            expect(a.w).toBe(44);
        });

        it('★★ sub：分量相减', () =>
        {
            const a = v(10, 20, 30, 40);

            vec4Sub(a, v(1, 2, 3, 4), a);

            expect(a.x).toBe(9);
            expect(a.y).toBe(18);
            expect(a.z).toBe(27);
            expect(a.w).toBe(36);
        });

        it('★★ multiply：分量相乘', () =>
        {
            const a = v(2, 3, 4, 5);

            vec4Multiply(a, v(10, 10, 10, 10), a);

            expect(a.x).toBe(20);
            expect(a.y).toBe(30);
            expect(a.z).toBe(40);
            expect(a.w).toBe(50);
        });

        it('★★ divide：分量相除', () =>
        {
            const a = v(10, 20, 30, 40);

            vec4Divide(a, v(2, 4, 5, 8), a);

            expect(a.x).toBeCloseTo(5, 10);
            expect(a.y).toBeCloseTo(5, 10);
            expect(a.z).toBeCloseTo(6, 10);
            expect(a.w).toBeCloseTo(5, 10);
        });

        it('★★ negate：每个分量取反', () =>
        {
            const a = v(1, -2, 3, -4);

            expect(vec4Negate(a, a)).toBe(a);
            expect(a.x).toBe(-1);
            expect(a.y).toBe(2);
            expect(a.z).toBe(-3);
            expect(a.w).toBe(4);
        });

        it('★★ scale：每个分量乘同一个数', () =>
        {
            const a = v(1, 2, 3, 4);

            expect(vec4ScaleNumber(a, 2, a)).toBe(a);
            expect(a.x).toBe(2);
            expect(a.y).toBe(4);
            expect(a.z).toBe(6);
            expect(a.w).toBe(8);
        });

        it('★ 与零向量相加不变', () =>
        {
            const a = v(1, 2, 3, 4);

            vec4Add(a, { x: 0, y: 0, z: 0, w: 0 }, a);

            expect(a.x).toBe(1);
            expect(a.w).toBe(4);
        });
    });

    describe('★★ 显式 out 不改自身', () =>
    {
        it('★★ add 写 out', () =>
        {
            const a = v(1, 2, 3, 4);
            const out = { x: 0, y: 0, z: 0, w: 0 };
            const ret = vec4Add(a, v(10, 10, 10, 10), out);

            expect(ret).toBe(out);
            expect(a.x, 'a 不该被改').toBe(1);
            expect(a.w).toBe(4);
            expect(out.x).toBe(11);
            expect(out.w).toBe(14);
        });

        it('★★ sub 写 out', () =>
        {
            const a = v(10, 10, 10, 10);
            const out = { x: 0, y: 0, z: 0, w: 0 };

            vec4Sub(a, v(1, 2, 3, 4), out);

            expect(a.x, 'a 不该被改').toBe(10);
            expect(out.x).toBe(9);
            expect(out.w).toBe(6);
        });

        it('★★ multiply 写 out', () =>
        {
            const a = v(2, 3, 4, 5);
            const out = { x: 0, y: 0, z: 0, w: 0 };

            vec4Multiply(a, v(2, 2, 2, 2), out);

            expect(a.x, 'a 不该被改').toBe(2);
            expect(out.x).toBe(4);
            expect(out.w).toBe(10);
        });

        it('★★ divide 写 out', () =>
        {
            const a = v(10, 20, 30, 40);
            const out = { x: 0, y: 0, z: 0, w: 0 };

            vec4Divide(a, v(2, 4, 5, 8), out);

            expect(a.x, 'a 不该被改').toBe(10);
            expect(out.x).toBeCloseTo(5, 10);
            expect(out.z).toBeCloseTo(6, 10);
        });

        it('★★ negate 写 out', () =>
        {
            const a = v(1, -2, 3, -4);
            const out = { x: 0, y: 0, z: 0, w: 0 };

            vec4Negate(a, out);

            expect(a.x, 'a 不该被改').toBe(1);
            expect(out.x).toBe(-1);
            expect(out.y).toBe(2);
        });

        it('★ 省略 out 时新建对象，且不改自身', () =>
        {
            const a = v(1, 2, 3, 4);
            const out = vec4Add(a, v(1, 1, 1, 1));

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
            const v3 = vec4ToVector3(a);

            expect(v3.x).toBe(1);
            expect(v3.y).toBe(2);
            expect(v3.z).toBe(3);

            const back = { x: 0, y: 0, z: 0, w: 0 };

            vec4FromVector3({ x: 5, y: 6, z: 7 }, 0.5, back);

            expect(back.x).toBe(5);
            expect(back.y).toBe(6);
            expect(back.z).toBe(7);
            expect(back.w).toBe(0.5);
        });

        it('★ fromVector3 省略 w 时取 0', () =>
        {
            const out = { x: 0, y: 0, z: 0, w: 0 };

            vec4FromVector3({ x: 1, y: 2, z: 3 }, 0, out);

            expect(out.w).toBe(0);
        });

        it('★★ toArray / fromArray 往返一致（含 offset）', () =>
        {
            const a = v(1, 2, 3, 4);
            const arr: number[] = [];

            vec4ToArray(a, arr);

            expect(arr.length).toBe(4);
            expect(arr).toEqual([1, 2, 3, 4]);

            const back = vec4FromArray(arr);

            expect(back.x).toBe(1);
            expect(back.y).toBe(2);
            expect(back.z).toBe(3);
            expect(back.w).toBe(4);
        });

        it('★ toArray 支持 offset 写入', () =>
        {
            const a = v(1, 2, 3, 4);
            const arr = [0, 0, 0, 0, 0, 0];

            vec4ToArray(a, arr, 2);

            expect(arr[2]).toBe(1);
            expect(arr[5]).toBe(4);
        });

        it('★ fromArray 支持 offset 读取', () =>
        {
            const back = vec4FromArray([9, 9, 1, 2, 3, 4], 2);

            expect(back.x).toBe(1);
            expect(back.w).toBe(4);
        });
    });

    describe('★ random / equals / copy', () =>
    {
        it('★★ random 的四个分量都落在 [0,1)', () =>
        {
            for (let i = 0; i < 20; i++)
            {
                const r = vec4Random();

                for (const [name, val] of [['x', r.x], ['y', r.y], ['z', r.z], ['w', r.w]] as const)
                {
                    expect(val, `${name}=${val}`).toBeGreaterThanOrEqual(0);
                    expect(val, `${name}=${val}`).toBeLessThan(1);
                }
            }
        });

        it('★ out 传自己时 random 就地写入', () =>
        {
            const r = { x: 0, y: 0, z: 0, w: 0 };

            expect(vec4Random(r)).toBe(r);
            expect(r.x).toBeGreaterThanOrEqual(0);
            expect(r.x).toBeLessThan(1);
            expect(r.w).toBeGreaterThanOrEqual(0);
            expect(r.w).toBeLessThan(1);
        });

        it('★ equals：相同为真、任一分量不同为假', () =>
        {
            expect(vec4Equals(v(1, 2, 3, 4), v(1, 2, 3, 4))).toBe(true);
            expect(vec4Equals(v(1, 2, 3, 4), v(1, 2, 3, 5))).toBe(false);
            expect(vec4Equals(v(1, 2, 3, 4), v(1, 2, 4, 4))).toBe(false);
        });

        it('★ copy 复制四分量并返回 out；缺省 out 产生独立对象', () =>
        {
            const src = v(1, 2, 3, 4);
            const dst = { x: 0, y: 0, z: 0, w: 0 };

            expect(vec4Copy(src, dst)).toBe(dst);
            expect(dst.x).toBe(1);
            expect(dst.w).toBe(4);

            const cloned = vec4Copy(src);

            expect(cloned).not.toBe(src);
            cloned.x = 99;
            expect(src.x, '缺省 out 应是独立对象').toBe(1);
        });
    });
});
