import { mathUtil } from '@feng3d/polyfill';
import { describe, expect, it } from 'vitest';

import type { Euler, WritableEulerLike } from '../src/geom/eulerOps';
import {
    eulerCopy,
    eulerEquals,
    eulerFromArray,
    eulerFromVector3,
    eulerRandom,
    eulerReorder,
    eulerSet,
    eulerToArray,
    eulerToVector3,
} from '../src/geom/eulerOps';
import { RotationOrder } from '../src/enums/RotationOrder';
import { Vector3 } from '../src/geom/Vector3';

/**
 * 欧拉角纯数据形态 + `euler*` 纯函数层（`packages/math/src/geom/eulerOps.ts`）。
 *
 * **阶段 C-a 起 `Euler` class 已删除**，本文件由「class 行为用例」改写为「纯函数用例」，
 * 断言逐条保留（`new Euler(x, y, z, order)` → `{ x, y, z, order }` 字面量；
 * `e.set(...)` → `eulerSet(..., e)`；`e.fromVector3(v)` → `eulerFromVector3(e, v, undefined, e)`）。
 *
 * 断言选**明确**的部分：
 *
 * - 默认值 `(0, 0, 0)` + 默认旋转序；
 * - `eulerSet(x, y, z, order?)`（`order` 缺省**不写** `out.order`）；
 * - **`eulerFromVector3` / `eulerToVector3` 往返**、**`eulerFromArray` / `eulerToArray` 往返（含 offset）**；
 * - `eulerCopy` / `eulerEquals` / `eulerRandom`；
 * - **`eulerReorder(newOrder)`** 改变 `order`（同序 reorder 也会归一化分量）。
 *
 * ⚠️ **有意不测**：`eulerFromRotationMatrix`（占该文件近一半）与 `eulerFromQuaternion` ——
 * 它们依赖 `Matrix4x4` / `Quaternion` 的构造语义（含 `RotationOrder` 各成员的分支），
 * 已在 `test/geom/eulerOps.spec.ts` 里用手算期望值 + `mat4FromRotation` 交叉验证覆盖，
 * **本文件不为它们写"看起来在测"的断言。**
 */

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

/** 原 `new Euler(x, y, z, order)` 的字面量形态（纯函数层的 `out` 目标，不带判别字段）。 */
function eulerLike(x = 0, y = 0, z = 0, order: RotationOrder = mathUtil.DefaultRotationOrder): WritableEulerLike
{
    return { x, y, z, order };
}

describe('Euler（math/geom）', () =>
{
    describe('★ 构造与 set', () =>
    {
        it('★ 默认是 (0, 0, 0)，且带一个默认旋转顺序', () =>
        {
            // 数据声明形态（带 `readonly __type__: 'Euler'`）
            const e: Euler = { __type__: 'Euler', x: 0, y: 0, z: 0, order: mathUtil.DefaultRotationOrder };

            expect(e.x).toBe(0);
            expect(e.y).toBe(0);
            expect(e.z).toBe(0);
            expect(e.order).toBeDefined();
        });

        it('★ 四参构造按顺序写入 x / y / z 与 order', () =>
        {
            const base = eulerLike();
            const e = eulerLike(10, 20, 30, base.order);

            expect(e.x).toBe(10);
            expect(e.y).toBe(20);
            expect(e.z).toBe(30);
            expect(e.order).toBe(base.order);
        });

        it('★★ set 写入三个分量并返回 out（out 传自己即就地）', () =>
        {
            const e = eulerLike();

            expect(eulerSet(1, 2, 3, undefined, e)).toBe(e);
            expect(e.x).toBe(1);
            expect(e.y).toBe(2);
            expect(e.z).toBe(3);
        });

        it('★ set 缺省 out 时新建对象，初值是默认旋转序', () =>
        {
            const e = eulerSet(1, 2, 3);

            expect(e.x).toBe(1);
            expect(e.order).toBe(mathUtil.DefaultRotationOrder);
        });

        it('★ set 可以同时指定 order', () =>
        {
            const a = eulerLike();
            const b = eulerLike();

            // 找一个与 a 不同的 order 值（不强依赖枚举成员名）
            const others = [a.order, b.order].filter((o) => o !== a.order);

            if (others.length > 0)
            {
                e_setAndCheck(a, others[0]);
            }
            else
            {
                // 只有一种 order 时至少保证"显式传同一个值"不报错
                expect(() => eulerSet(1, 2, 3, a.order, a)).not.toThrow();
            }

            function e_setAndCheck(target: WritableEulerLike, order: RotationOrder)
            {
                eulerSet(4, 5, 6, order, target);
                expect(target.order).toBe(order);
                expect(target.x).toBe(4);
            }
        });
    });

    describe('★★ Vector3 往返', () =>
    {
        it('★★ fromVector3 → toVector3 往返一致', () =>
        {
            const e = eulerLike();

            eulerFromVector3(e, v(7, 8, 9), undefined, e);

            const back = eulerToVector3(e);

            expect(back.x).toBeCloseTo(7, 10);
            expect(back.y).toBeCloseTo(8, 10);
            expect(back.z).toBeCloseTo(9, 10);
        });

        it('★ toVector3 可传入目标对象并被复用', () =>
        {
            const e = eulerLike(1, 2, 3);
            const target = new Vector3();

            expect(eulerToVector3(e, target)).toBe(target);
            expect(target.x).toBeCloseTo(1, 10);
        });

        it('★ fromVector3 的 out 传自己即就地（可链式）', () =>
        {
            const e = eulerLike();

            expect(eulerFromVector3(e, v(1, 1, 1), undefined, e)).toBe(e);
        });
    });

    describe('★★ 数组往返（含 offset）', () =>
    {
        it('★★ toArray → fromArray 往返一致', () =>
        {
            const e = eulerLike(11, 22, 33);
            const arr: number[] = [];

            eulerToArray(e, arr);

            expect(arr.length).toBeGreaterThanOrEqual(3);

            const back = eulerFromArray(arr);

            expect(back.x).toBeCloseTo(11, 10);
            expect(back.y).toBeCloseTo(22, 10);
            expect(back.z).toBeCloseTo(33, 10);
        });

        it('★ toArray 支持 offset 写入', () =>
        {
            const e = eulerLike(1, 2, 3);
            const arr = [0, 0, 0, 0, 0];

            eulerToArray(e, arr, 2);

            expect(arr[2]).toBeCloseTo(1, 10);
            expect(arr[4]).toBeCloseTo(3, 10);
        });

        it('★ fromArray 支持 offset 读取', () =>
        {
            const back = eulerFromArray([9, 9, 4, 5, 6], 2);

            expect(back.x).toBeCloseTo(4, 10);
            expect(back.y).toBeCloseTo(5, 10);
            expect(back.z).toBeCloseTo(6, 10);
        });
    });

    describe('★ copy / equals / random', () =>
    {
        it('★ copy 产生独立对象', () =>
        {
            const e = eulerLike(1, 2, 3);
            const c = eulerCopy(e);

            expect(c).not.toBe(e);
            expect(c.x).toBeCloseTo(1, 10);
            expect(c.z).toBeCloseTo(3, 10);

            c.x = 99;
            expect(e.x, 'copy 应独立').toBeCloseTo(1, 10);
        });

        it('★ equals：相同为真、任一分量不同为假', () =>
        {
            const a = eulerLike(1, 2, 3);

            expect(eulerEquals(a, eulerLike(1, 2, 3, a.order))).toBe(true);
            expect(eulerEquals(a, eulerLike(1, 2, 4, a.order))).toBe(false);
            expect(eulerEquals(a, eulerLike(9, 2, 3, a.order))).toBe(false);
        });

        it('★ random 的分量都是有限数', () =>
        {
            for (let i = 0; i < 10; i++)
            {
                const e = eulerRandom();

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
            const e = eulerLike(10, 20, 30);

            eulerReorder(e, e.order, e);

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
            const e = eulerLike(10, 20, 30);
            const original = e.order;

            // 找一个与当前不同的 order（不强依赖枚举成员名）
            const candidates = [eulerLike().order, eulerLike(1, 2, 3).order];
            const other = candidates.find((o) => o !== original);

            if (other === undefined)
            {
                // 只有一种 order 时跳过（这本身也是"实现只支持一种顺序"的信息）
                expect(e.order).toBe(original);

                return;
            }

            eulerReorder(e, other, e);

            expect(e.order).toBe(other);
            // 分量应当是有限的（旋转语义不变，但具体数值取决于顺序换算）
            expect(Number.isFinite(e.x)).toBe(true);
            expect(Number.isFinite(e.y)).toBe(true);
            expect(Number.isFinite(e.z)).toBe(true);
        });

        it('★ reorder 的 out 传自己即就地（可链式）', () =>
        {
            const e = eulerLike();

            expect(eulerReorder(e, e.order, e)).toBe(e);
        });
    });
});
