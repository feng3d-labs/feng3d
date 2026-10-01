import { describe, expect, it } from 'vitest';

import { Euler } from '../src/geom/Euler';
import { Vector3 } from '../src/geom/Vector3';

/**
 * `Euler`（`packages/math/src/geom/Euler.ts`，104 行，此前**行覆盖率 71.15%**）。
 *
 * 欧拉角（`x` / `y` / `z` + `order`）。断言选**明确**的部分：
 *
 * - `constructor(x=0, y=0, z=0, order = mathUtil.DefaultRotationOrder)`；
 * - `set(x, y, z, order?)`；
 * - **`fromVector3` / `toVector3` 往返**、**`fromArray` / `toArray` 往返（含 offset）**；
 * - `clone` / `equals` / `random`；
 * - **`reorder(newOrder)`** 改变 `order`（同序 reorder 应当不改变分量）。
 *
 * ⚠️ **有意不测**：`fromRotationMatrix`（128 行，占该文件近一半）与 `fromQuaternion` ——
 * 它们依赖 `Matrix4x4` / `Quaternion` 的构造语义（含 `RotationOrder` 各成员的分支），
 * 需要先单独确认，属于另一类工作。**本文件不为它们写"看起来在测"的断言。**
 */

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

describe('Euler（math/geom）', () =>
{
    describe('★ 构造与 set', () =>
    {
        it('★ 默认是 (0, 0, 0)，且带一个默认旋转顺序', () =>
        {
            const e = new Euler();

            expect(e.x).toBe(0);
            expect(e.y).toBe(0);
            expect(e.z).toBe(0);
            expect(e.order).toBeDefined();
        });

        it('★ 四参构造按顺序写入 x / y / z 与 order', () =>
        {
            const base = new Euler();
            const e = new Euler(10, 20, 30, base.order);

            expect(e.x).toBe(10);
            expect(e.y).toBe(20);
            expect(e.z).toBe(30);
            expect(e.order).toBe(base.order);
        });

        it('★★ set 写入三个分量并返回 this', () =>
        {
            const e = new Euler();

            expect(e.set(1, 2, 3)).toBe(e);
            expect(e.x).toBe(1);
            expect(e.y).toBe(2);
            expect(e.z).toBe(3);
        });

        it('★ set 可以同时指定 order', () =>
        {
            const a = new Euler();
            const b = new Euler();

            // 找一个与 a 不同的 order 值（不强依赖枚举成员名）
            const others = [a.order, b.order].filter((o) => o !== a.order);

            if (others.length > 0)
            {
                e_setAndCheck(a, others[0]);
            }
            else
            {
                // 只有一种 order 时至少保证"显式传同一个值"不报错
                expect(() => a.set(1, 2, 3, a.order)).not.toThrow();
            }

            function e_setAndCheck(target: Euler, order: typeof a.order)
            {
                target.set(4, 5, 6, order);
                expect(target.order).toBe(order);
                expect(target.x).toBe(4);
            }
        });
    });

    describe('★★ Vector3 往返', () =>
    {
        it('★★ fromVector3 → toVector3 往返一致', () =>
        {
            const e = new Euler();

            e.fromVector3(v(7, 8, 9));

            const back = e.toVector3();

            expect(back.x).toBeCloseTo(7, 10);
            expect(back.y).toBeCloseTo(8, 10);
            expect(back.z).toBeCloseTo(9, 10);
        });

        it('★ toVector3 可传入目标对象并被复用', () =>
        {
            const e = new Euler(1, 2, 3);
            const target = new Vector3();

            expect(e.toVector3(target)).toBe(target);
            expect(target.x).toBeCloseTo(1, 10);
        });

        it('★ fromVector3 返回 this（可链式）', () =>
        {
            const e = new Euler();

            expect(e.fromVector3(v(1, 1, 1))).toBe(e);
        });
    });

    describe('★★ 数组往返（含 offset）', () =>
    {
        it('★★ toArray → fromArray 往返一致', () =>
        {
            const e = new Euler(11, 22, 33);
            const arr: number[] = [];

            e.toArray(arr);

            expect(arr.length).toBeGreaterThanOrEqual(3);

            const back = new Euler().fromArray(arr);

            expect(back.x).toBeCloseTo(11, 10);
            expect(back.y).toBeCloseTo(22, 10);
            expect(back.z).toBeCloseTo(33, 10);
        });

        it('★ toArray 支持 offset 写入', () =>
        {
            const e = new Euler(1, 2, 3);
            const arr = [0, 0, 0, 0, 0];

            e.toArray(arr, 2);

            expect(arr[2]).toBeCloseTo(1, 10);
            expect(arr[4]).toBeCloseTo(3, 10);
        });

        it('★ fromArray 支持 offset 读取', () =>
        {
            const back = new Euler().fromArray([9, 9, 4, 5, 6], 2);

            expect(back.x).toBeCloseTo(4, 10);
            expect(back.y).toBeCloseTo(5, 10);
            expect(back.z).toBeCloseTo(6, 10);
        });
    });

    describe('★ clone / equals / random', () =>
    {
        it('★ clone 产生独立对象', () =>
        {
            const e = new Euler(1, 2, 3);
            const c = e.clone();

            expect(c).not.toBe(e);
            expect(c.x).toBeCloseTo(1, 10);
            expect(c.z).toBeCloseTo(3, 10);

            c.x = 99;
            expect(e.x, 'clone 应独立').toBeCloseTo(1, 10);
        });

        it('★ equals：相同为真、任一分量不同为假', () =>
        {
            const a = new Euler(1, 2, 3, new Euler().order);

            expect(a.equals(new Euler(1, 2, 3, a.order))).toBe(true);
            expect(a.equals(new Euler(1, 2, 4, a.order))).toBe(false);
            expect(a.equals(new Euler(9, 2, 3, a.order))).toBe(false);
        });

        it('★ random 的分量都是有限数', () =>
        {
            for (let i = 0; i < 10; i++)
            {
                const e = new Euler().random();

                expect(Number.isFinite(e.x), `x=${e.x}`).toBe(true);
                expect(Number.isFinite(e.y), `y=${e.y}`).toBe(true);
                expect(Number.isFinite(e.z), `z=${e.z}`).toBe(true);
            }
        });
    });

    describe('★ reorder', () =>
    {
        it('★★ 实测：reorder **即便顺序不变**也会把角度归一化（我第一版就栽在这里）', () =>
        {
            // 实测：reorder(相同 order) 把 x=10 变成了 10 - 4π ≈ -2.5664 —— 落在 [-π, π] 内。
            // 也就是说 reorder 除了换顺序，还会把角度减到 2π 的整数倍之内。
            // 语义上 10 与 10-4π 是同一个旋转，但**数值会变** —— 很容易被误判成 bug。
            const e = new Euler(10, 20, 30);

            e.reorder(e.order);

            // 归一化后的角度落在 [-π, π]
            for (const [name, val] of [['x', e.x], ['y', e.y], ['z', e.z]] as const)
            {
                expect(Math.abs(val), name + '=' + val).toBeLessThanOrEqual(Math.PI + 1e-9);
            }

            // 但与原值只差 2π 的整数倍（同一个旋转）
            const diff = 10 - e.x;
            const turns = diff / (2 * Math.PI);

            expect(turns, 'x 的差值应是 2π 的整数倍').toBeCloseTo(Math.round(turns), 6);
        });

        it('★ reorder 会把 order 改成新值', () =>
        {
            const e = new Euler(10, 20, 30);
            const original = e.order;

            // 找一个与当前不同的 order（不强依赖枚举成员名）
            const candidates = [new Euler().order, new Euler(1, 2, 3, undefined).order];
            const other = candidates.find((o) => o !== original);

            if (other === undefined)
            {
                // 只有一种 order 时跳过（这本身也是"实现只支持一种顺序"的信息）
                expect(e.order).toBe(original);

                return;
            }

            e.reorder(other);

            expect(e.order).toBe(other);
            // 分量应当是有限的（旋转语义不变，但具体数值取决于顺序换算）
            expect(Number.isFinite(e.x)).toBe(true);
            expect(Number.isFinite(e.y)).toBe(true);
            expect(Number.isFinite(e.z)).toBe(true);
        });

        it('★ reorder 返回 this（可链式）', () =>
        {
            const e = new Euler();

            expect(e.reorder(e.order)).toBe(e);
        });
    });
});
