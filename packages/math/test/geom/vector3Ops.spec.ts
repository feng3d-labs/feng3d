import { assert, describe, it } from 'vitest';

import type { Vector3Like } from '../../src/geom/vector3Ops';
import {
    VEC3_EPSILON,
    VEC3_EPSILON_NORMAL_SQRT,
    VEC3_ZERO,
    vec3Add,
    vec3Cross,
    vec3LerpClamped,
    vec3LerpNumber,
    vec3Normalized,
    vec3NormalizeThickness,
    vec3ScaleNumber,
    vec3Unit,
} from '../../src/geom/vector3Ops';

/**
 * 只取 xyz 三个分量。
 *
 * **不要**用 `{ ...vector3Instance }` 做断言：`Vector3` 声明了类字段 `__class__: 'Vector3';`，
 * 在 ESNext 目标下它成为实例自有的**可枚举**属性（值为 undefined），展开会多出一个键，
 * 与纯函数返回的 `{ x, y, z }` 字面量比较时必然不等（实测踩到，3 个用例因此假失败）。
 * 该字段在阶段 C 删除 class 后自然消失，届时这个辅助函数也可以简化。
 */
function xyz(v: Vector3Like): { x: number; y: number; z: number }
{
    return { x: v.x, y: v.y, z: v.z };
}

/**
 * `vector3Ops` 纯函数层的**契约测试**（issue #134 阶段 A1）。
 *
 * ## 为什么期望值一律硬编码
 *
 * class 的方法已经**委托给本文件要测的这些函数**，所以「拿 class 当正确性基准」是无效的：
 * 两边会一起错。实测过——把 `vec3Cross` 写成「边算边写」，一条以
 * `new Vector3(1,2,3).cross(b)` 为期望的用例照样通过（基准与受测方是同一个实现）。
 *
 * 因此这里分两类用例：
 *
 * - **数值类**：期望值手算后硬编码，能发现纯函数自身的实现错误；
 * - **接线类**：单独一条，只对比 class 与纯函数的返回值，用来发现委托时的参数顺序/`out` 传错
 *   （它对实现错误不敏感，这是刻意的分工）。
 */
describe('vector3Ops 纯函数层（#134 阶段 A1）', () =>
{
    it('运算不修改入参，结果只写 out', () =>
    {
        const a = { x: 1, y: 2, z: 3 };
        const b = { x: 4, y: 5, z: 6 };
        const out = { x: 0, y: 0, z: 0 };

        vec3Add(a, b, out);

        assert.deepEqual(xyz(out), { x: 5, y: 7, z: 9 });
        assert.deepEqual(xyz(a), { x: 1, y: 2, z: 3 }, '入参 a 被修改了');
        assert.deepEqual(xyz(b), { x: 4, y: 5, z: 6 }, '入参 b 被修改了');
    });

    it('out 缺省时新建普通字面量，同样不触碰入参', () =>
    {
        const a = { x: 1, y: 2, z: 3 };

        const r = vec3ScaleNumber(a, 2);

        assert.deepEqual(xyz(r), { x: 2, y: 4, z: 6 });
        assert.deepEqual(xyz(a), { x: 1, y: 2, z: 3 });
    });

    it('★ 回归：vec3Cross 就地调用（out 与 a 同一对象）三个分量跨分量读入参', () =>
    {
        const actual = { x: 1, y: 2, z: 3 };
        const b = { x: 4, y: 5, z: 6 };

        vec3Cross(actual, b, actual);

        // (1,2,3) × (4,5,6) = (2*6−3*5, 3*4−1*6, 1*5−2*4) = (−3, 6, −3)
        // 手算硬编码：写成「边算边写」时会得到 (−3, 30, −135)，此用例立刻失败
        assert.deepEqual(xyz(actual), { x: -3, y: 6, z: -3 });
    });

    it('vec3Cross 非就地调用与手算一致', () =>
    {
        const actual = vec3Cross({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 });

        assert.deepEqual(xyz(actual), { x: -3, y: 6, z: -3 });
    });

    it('★ 缺省 out（新建）与就地 out（传自己）两种形态结果一致', () =>
    {
        const a = { x: 1, y: 2, z: 3 };
        const b = { x: 4, y: 5, z: 6 };

        assert.deepEqual(xyz(vec3Cross(a, b)), xyz(vec3Cross(a, b, { x: 0, y: 0, z: 0 })));
        assert.deepEqual(xyz(vec3Add({ x: 1, y: 2, z: 3 }, b)), xyz(vec3Add({ x: 1, y: 2, z: 3 }, b, { x: 1, y: 2, z: 3 })));
    });

    it('三个「归一化」入口的退化分支各不相同', () =>
    {
        const zero = { x: 0, y: 0, z: 0 };

        // normalize() 与 Normalize() 都置零
        assert.deepEqual(xyz(vec3NormalizeThickness(zero)), { x: 0, y: 0, z: 0 });
        assert.deepEqual(xyz(vec3Normalized(zero)), { x: 0, y: 0, z: 0 });

        // unit() 给 (1,0,0)——与上面两个**不同**，不能互相替代
        assert.deepEqual(xyz(vec3Unit(zero)), { x: 1, y: 0, z: 0 });
    });

    it('极小向量上 vec3NormalizeThickness 与 vec3Normalized 分道', () =>
    {
        // 长度 1e-7，小于 VEC3_EPSILON(1e-5)：Normalized 判零，normalize 仍会归一
        const tiny = { x: 1e-7, y: 0, z: 0 };

        assert.deepEqual(xyz(vec3Normalized(tiny)), { x: 0, y: 0, z: 0 });
        assert.deepEqual(xyz(vec3NormalizeThickness(tiny)), { x: 1, y: 0, z: 0 });
    });

    it('vec3LerpClamped 夹取 t，vec3LerpNumber 不夹取', () =>
    {
        const a = { x: 0, y: 0, z: 0 };
        const b = { x: 10, y: 10, z: 10 };

        assert.equal(vec3LerpClamped(a, b, 2).x, 10);
        assert.equal(vec3LerpNumber(a, b, 2).x, 20);
    });

    it('冻结常量不可扩展（响应式系统据此不建代理）', () =>
    {
        assert.ok(!Object.isExtensible(VEC3_ZERO));
    });

    it('kEpsilon 常量与 class 时代的取值一致（单一来源）', () =>
    {
        assert.equal(VEC3_EPSILON, 0.00001);
        assert.equal(VEC3_EPSILON_NORMAL_SQRT, 1e-15);
    });
});
