import { assert, describe, it } from 'vitest';


import {
    VEC2_DOWN,
    VEC2_EPSILON,
    VEC2_EPSILON_NORMAL_SQRT,
    VEC2_LEFT,
    VEC2_NEGATIVE_INFINITY,
    VEC2_ONE,
    VEC2_POSITIVE_INFINITY,
    VEC2_RIGHT,
    VEC2_UP,
    VEC2_ZERO,
    vec2Add,
    vec2Angle,
    vec2Clamp,
    vec2ClampMagnitude,
    vec2Copy,
    vec2Cross,
    vec2Distance,
    vec2DistanceSquared,
    vec2Divide,
    vec2Dot,
    vec2Equals,
    vec2From,
    vec2Length,
    vec2LengthSquared,
    vec2Lerp,
    vec2LerpClamped,
    vec2LerpNumber,
    vec2Max,
    vec2Min,
    vec2Multiply,
    vec2Negate,
    vec2Normalize,
    vec2Offset,
    vec2Perpendicular,
    vec2Polar,
    vec2Random,
    vec2Reciprocal,
    vec2Reflect,
    vec2Round,
    vec2Scale,
    vec2ScaleNumber,
    vec2SignedAngle,
    vec2Sub,
    vec2ToArray,
    vec2ToString,
} from '../../src/geom/vector2';
import type { Vector2Like } from '../../src/geom/vector2';

/**
 * 只取 x / y 两个分量。
 *
 * `Vector2` 目前没有 `__class__` 一类可枚举实例字段（`packages/math/src` 里已无 `__class__`），
 * 用辅助函数只是为了让断言只比较「分量」这一件事，不依赖 class 的其他自有属性。
 */
function xy(v: Vector2Like): { x: number; y: number }
{
    return { x: v.x, y: v.y };
}

/**
 * `vector2` 纯函数层的**契约测试**（issue #134 阶段 A2e）。
 *
 * ## 为什么期望值一律手算硬编码
 *
 * class 的方法已经**委托给本文件要测的这些函数**，所以「拿 class 当正确性基准」是无效的：
 * 两边会一起错（方案 §10.1 的 P3 已实测）。
 * 因此这里分两类用例：
 *
 * - **数值类**：期望值手算后硬编码，能发现纯函数自身的实现错误；
 * - **接线类**：单独一条，只对比 class 与纯函数的返回值，用来发现委托时的参数顺序 / `out` 传错
 *   （它对实现错误不敏感，这是刻意的分工）。
 */
describe('vector2 纯函数层（#134 阶段 A2e）', () =>
{
    it('运算不修改入参，结果只写 out', () =>
    {
        const a = { x: 1, y: 2 };
        const b = { x: 4, y: 5 };
        const out = { x: 0, y: 0 };

        vec2Add(a, b, out);

        assert.deepEqual(xy(out), { x: 5, y: 7 });
        assert.deepEqual(xy(a), { x: 1, y: 2 }, '入参 a 被修改了');
        assert.deepEqual(xy(b), { x: 4, y: 5 }, '入参 b 被修改了');
    });

    it('out 缺省时新建普通字面量，同样不触碰入参', () =>
    {
        const a = { x: 1, y: 2 };

        const r = vec2ScaleNumber(a, 3);

        assert.deepEqual(xy(r), { x: 3, y: 6 });
        assert.deepEqual(xy(a), { x: 1, y: 2 });
    });

    it('out 传自己即就地运算（与 xxxTo 同一函数）', () =>
    {
        const a = { x: 3, y: 4 };

        vec2Add(a, { x: 1, y: 1 }, a);
        assert.deepEqual(xy(a), { x: 4, y: 5 });

        vec2Normalize(a, a);
        // 手算：(4,5) 长度 √41 ≈ 6.403124，分量 4/√41 ≈ 0.624695、5/√41 ≈ 0.780869
        assert.ok(Math.abs(a.x - 0.6246950475544243) < 1e-12, `就地归一化 x 错：${a.x}`);
        assert.ok(Math.abs(a.y - 0.7808688094430304) < 1e-12, `就地归一化 y 错：${a.y}`);
    });

    it('★ 回归：vec2Perpendicular 就地调用（out 与 a 同一对象）跨分量读入参', () =>
    {
        const actual = { x: 3, y: 4 };

        vec2Perpendicular(actual, actual);

        // 手算：(x, y) -> (-y, x)，(3,4) -> (-4,3)。
        // 写成「边算边写」（先 out.x = -a.y，再 out.y = a.x）时会得到 (-4,-4)，此用例立刻失败
        assert.deepEqual(xy(actual), { x: -4, y: 3 });
    });

    it('vec2Perpendicular 非就地调用与手算一致', () =>
    {
        const a = { x: 3, y: 4 };

        assert.deepEqual(xy(vec2Perpendicular(a)), { x: -4, y: 3 });
        assert.deepEqual(xy(a), { x: 3, y: 4 });
    });

    it('逐分量运算的手算结果（加减乘除、标量缩放、取负、倒数、偏移、取整）', () =>
    {
        const a = { x: 6, y: 8 };
        const b = { x: 2, y: 4 };

        assert.deepEqual(xy(vec2Add(a, b)), { x: 8, y: 12 });
        assert.deepEqual(xy(vec2Sub(a, b)), { x: 4, y: 4 });
        assert.deepEqual(xy(vec2Multiply(a, b)), { x: 12, y: 32 });
        assert.deepEqual(xy(vec2Scale(a, b)), { x: 12, y: 32 }, 'vec2Scale 与 vec2Multiply 同义');
        assert.deepEqual(xy(vec2Divide(a, b)), { x: 3, y: 2 });
        assert.deepEqual(xy(vec2ScaleNumber(a, 0.5)), { x: 3, y: 4 });
        assert.deepEqual(xy(vec2Negate(a)), { x: -6, y: -8 });
        assert.deepEqual(xy(vec2Reciprocal(b)), { x: 0.5, y: 0.25 });
        assert.deepEqual(xy(vec2Offset(a, 1, -1)), { x: 7, y: 7 });
        assert.deepEqual(xy(vec2Round({ x: 1.4, y: 2.6 })), { x: 1, y: 3 });
        // Math.round 的 .5 向 +∞ 取整（既有行为）
        assert.deepEqual(xy(vec2Round({ x: -1.5, y: 1.5 })), { x: -1, y: 2 });
    });

    it('vec2Min / vec2Max 逐分量取小 / 取大（Math.min / Math.max 语义）', () =>
    {
        const a = { x: 1, y: 9 };
        const b = { x: 5, y: 2 };

        assert.deepEqual(xy(vec2Min(a, b)), { x: 1, y: 2 });
        assert.deepEqual(xy(vec2Max(a, b)), { x: 5, y: 9 });
        // Math.min / Math.max 遇 NaN 传播 NaN——与静态 Vector2.Min/Max（mathfMin/mathfMax）**不同**
        assert.ok(Number.isNaN(vec2Min({ x: NaN, y: 0 }, { x: 1, y: 1 }).x), 'Math.min 语义应传播 NaN');
    });

    it('vec2Clamp 逐分量夹取', () =>
    {
        assert.deepEqual(xy(vec2Clamp({ x: 5, y: -5 }, { x: 0, y: 0 }, { x: 1, y: 1 })), { x: 1, y: 0 });
        assert.deepEqual(xy(vec2Clamp({ x: 0.5, y: 0.5 }, { x: 0, y: 0 }, { x: 1, y: 1 })), { x: 0.5, y: 0.5 });
    });

    it('vec2Lerp 按分量插值；vec2LerpNumber 不夹取；vec2LerpClamped 夹取', () =>
    {
        const a = { x: 0, y: 0 };
        const b = { x: 10, y: 20 };

        // 分量的插值系数各不相同
        assert.deepEqual(xy(vec2Lerp(a, b, { x: 0.5, y: 0.25 })), { x: 5, y: 5 });
        assert.deepEqual(xy(vec2LerpNumber(a, b, 0.5)), { x: 5, y: 10 });
        // t = 2：不夹取时外推，夹取时贴到 b
        assert.deepEqual(xy(vec2LerpNumber(a, b, 2)), { x: 20, y: 40 });
        assert.deepEqual(xy(vec2LerpClamped(a, b, 2)), { x: 10, y: 20 });
        assert.deepEqual(xy(vec2LerpClamped(a, b, -1)), { x: 0, y: 0 });
        assert.deepEqual(xy(vec2LerpClamped(a, b, 0.5)), { x: 5, y: 10 });
    });

    it('vec2Length / vec2LengthSquared / vec2Distance / vec2DistanceSquared 手算', () =>
    {
        assert.equal(vec2Length({ x: 3, y: 4 }), 5);
        assert.equal(vec2Length({ x: 0, y: 0 }), 0);
        assert.equal(vec2LengthSquared({ x: 3, y: 4 }), 25);
        assert.equal(vec2Distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
        assert.equal(vec2DistanceSquared({ x: 1, y: 1 }, { x: 4, y: 5, z: 0 }), 9 + 16);

        // 入参 b 是 Vector3Like：只用 x / y，z 必须被忽略（原签名就是 distanceSquared(p: Vector3)）
        assert.equal(vec2DistanceSquared({ x: 1, y: 2 }, { x: 4, y: 6, z: 1000 }), 9 + 16);
    });

    it('vec2Dot / vec2Cross 手算（二维叉积是标量）', () =>
    {
        assert.equal(vec2Dot({ x: 1, y: 2 }, { x: 3, y: 4 }), 11);
        assert.equal(vec2Dot({ x: 1, y: 0 }, { x: 0, y: 1 }), 0);

        // (x1*y2 - y1*x2)
        assert.equal(vec2Cross({ x: 1, y: 0 }, { x: 0, y: 1 }), 1);
        assert.equal(vec2Cross({ x: 0, y: 1 }, { x: 1, y: 0 }), -1);
        assert.equal(vec2Cross({ x: 2, y: 0 }, { x: 5, y: 0 }), 0);
    });

    it('vec2Normalize 的退化分支是「置零」而不是「给 (1,0)」', () =>
    {
        assert.deepEqual(xy(vec2Normalize({ x: 3, y: 4 })), { x: 0.6, y: 0.8 });
        assert.deepEqual(xy(vec2Normalize({ x: 0, y: 0 })), { x: 0, y: 0 });
        // 长度 1e-6 < VEC2_EPSILON(1e-5)：判零
        assert.deepEqual(xy(vec2Normalize({ x: 1e-6, y: 0 })), { x: 0, y: 0 });
        // 长度 1e-4 > VEC2_EPSILON：照常归一（浮点开方不保证逐位相等，用容差）
        const normalizedTiny = vec2Normalize({ x: 1e-4, y: 0 });

        assert.ok(Math.abs(normalizedTiny.x - 1) < 1e-9, `x=${normalizedTiny.x}`);
        assert.equal(normalizedTiny.y, 0);
    });

    it('vec2Angle / vec2SignedAngle 手算（同向 0°、正交 90°、零向量判零）', () =>
    {
        assert.equal(vec2Angle({ x: 1, y: 0 }, { x: 1, y: 0 }), 0);
        assert.ok(Math.abs(vec2Angle({ x: 1, y: 0 }, { x: 0, y: 1 }) - 90) < 1e-12);
        // 分母为 0（含零向量）时按 0 处理
        assert.equal(vec2Angle({ x: 0, y: 0 }, { x: 0, y: 1 }), 0);

        assert.ok(Math.abs(vec2SignedAngle({ x: 1, y: 0 }, { x: 0, y: 1 }) - 90) < 1e-12);
        assert.ok(Math.abs(vec2SignedAngle({ x: 0, y: 1 }, { x: 1, y: 0 }) + 90) < 1e-12);
    });

    it('vec2Reflect 手算（以 x 轴为法线反射 (1,-1) → (1,1)）', () =>
    {
        // factor = -2 * Dot((0,1),(1,-1)) = 2；x = 2*0 + 1 = 1；y = 2*1 + (-1) = 1
        assert.deepEqual(xy(vec2Reflect({ x: 1, y: -1 }, { x: 0, y: 1 })), { x: 1, y: 1 });
        // 反向用例：以 y 轴为法线反射 (1,-1) → (-1,-1)
        assert.deepEqual(xy(vec2Reflect({ x: 1, y: -1 }, { x: 1, y: 0 })), { x: -1, y: -1 });
    });

    it('vec2Polar：角度按**弧度**（#134 后续清理批修掉「又乘 RAD2DEG」）', () =>
    {
        assert.deepEqual(xy(vec2Polar(1, 0)), { x: 1, y: 0 });
        assert.deepEqual(xy(vec2Polar(5, 0)), { x: 5, y: 0 });

        // 回归：旧实现是 len·cos(angle·RAD2DEG)，π/2 会被当成 5156.6 弧度，结果完全不对。
        // 这里改「逐分量带容差」比较：Math.cos(π/2) 本身不是精确 0，不能用 deepEqual。
        const quarter = xy(vec2Polar(2, Math.PI / 2));

        assert.ok(Math.abs(quarter.x) < 1e-12, `π/2 应落在 +y 轴上，实际 x=${quarter.x}`);
        assert.ok(Math.abs(quarter.y - 2) < 1e-12, `π/2 的半径应保持 2，实际 y=${quarter.y}`);

        const half = xy(vec2Polar(3, Math.PI));

        assert.ok(Math.abs(half.x + 3) < 1e-12, `π 应落在 -x 轴上，实际 x=${half.x}`);
        assert.ok(Math.abs(half.y) < 1e-9);
    });

    it('vec2ClampMagnitude 两个分支都写全两个分量', () =>
    {
        assert.deepEqual(xy(vec2ClampMagnitude({ x: 10, y: 0 }, 3)), { x: 3, y: 0 });
        assert.deepEqual(xy(vec2ClampMagnitude({ x: 1, y: 0 }, 3)), { x: 1, y: 0 });
        // out 传自己：不夹取的分支也必须把两个分量都写好（不能只写 x）
        const a = { x: 1, y: 2 };

        vec2ClampMagnitude(a, 10, a);
        assert.deepEqual(xy(a), { x: 1, y: 2 });
    });

    it('vec2From / vec2Copy / vec2ToArray / vec2ToString / vec2Equals 手算', () =>
    {
        assert.deepEqual(xy(vec2From(5, 6)), { x: 5, y: 6 });
        assert.deepEqual(xy(vec2Copy({ x: 7, y: 8 })), { x: 7, y: 8 });

        const array: number[] = [];

        assert.equal(vec2ToArray({ x: 7, y: 8 }, array), array, '返回的是传入的数组');
        assert.deepEqual(array, [7, 8]);

        const offsetArray = [0, 0, 0];

        vec2ToArray({ x: 7, y: 8 }, offsetArray, 1);
        assert.deepEqual(offsetArray, [0, 7, 8]);

        assert.equal(vec2ToString({ x: 1.5, y: -2.25 }), '(1.5, -2.25)');

        assert.equal(vec2Equals({ x: 1, y: 2 }, { x: 1, y: 2 }), true);
        assert.equal(vec2Equals({ x: 1, y: 2 }, { x: 1, y: 3 }), false);
        assert.equal(vec2Equals({ x: 1, y: 2 }, { x: 1.5, y: 2 }), false);
        // 默认精度 PRECISION = 1e-6（mathUtil.equals 是 `|差| < precision`）
        assert.equal(vec2Equals({ x: 1, y: 2 }, { x: 1.0000005, y: 2 }), true);
        assert.equal(vec2Equals({ x: 1, y: 2 }, { x: 1.5, y: 2 }, 1), true, '显式放宽 precision');
    });

    it('vec2Random 各分量落在 [0,1)，且写入给定的 out', () =>
    {
        const out = { x: -1, y: -1 };

        for (let i = 0; i < 20; i++)
        {
            assert.equal(vec2Random(out), out);
            assert.ok(out.x >= 0 && out.x < 1, `x 越界：${out.x}`);
            assert.ok(out.y >= 0 && out.y < 1, `y 越界：${out.y}`);
        }
    });

    it('★ 缺省 out（新建）与就地 out（传自己）两种形态结果逐位一致', () =>
    {
        const a = { x: 3, y: 4 };
        const b = { x: 1, y: 2 };
        const c = { x: 3, y: 4 };

        // 自身运算：同一函数，只是 out 实参不同
        const addFresh = vec2Add(a, b);
        const addInPlace = vec2Add({ x: 3, y: 4 }, b, { x: 3, y: 4 });

        assert.deepEqual(xy(addFresh), xy(addInPlace));
        assert.deepEqual(xy(vec2Sub(a, b)), xy(vec2Sub({ x: 3, y: 4 }, b, { x: 3, y: 4 })));
        assert.deepEqual(xy(vec2Multiply(a, b)), xy(vec2Multiply({ x: 3, y: 4 }, b, { x: 3, y: 4 })));
        assert.deepEqual(xy(vec2Divide(a, b)), xy(vec2Divide({ x: 3, y: 4 }, b, { x: 3, y: 4 })));
        assert.deepEqual(xy(vec2Scale(a, b)), xy(vec2Scale({ x: 3, y: 4 }, b, { x: 3, y: 4 })));
        assert.deepEqual(xy(vec2ScaleNumber(a, 2)), xy(vec2ScaleNumber({ x: 3, y: 4 }, 2, { x: 3, y: 4 })));
        assert.deepEqual(xy(vec2Negate(a)), xy(vec2Negate({ x: 3, y: 4 }, { x: 3, y: 4 })));
        assert.deepEqual(xy(vec2Reciprocal(a)), xy(vec2Reciprocal({ x: 3, y: 4 }, { x: 3, y: 4 })));
        assert.deepEqual(xy(vec2Offset(a, 1, 2)), xy(vec2Offset({ x: 3, y: 4 }, 1, 2, { x: 3, y: 4 })));
        assert.deepEqual(xy(vec2Round({ x: 3.4, y: 4.6 })), xy(vec2Round({ x: 3.4, y: 4.6 }, { x: 3.4, y: 4.6 })));
        assert.deepEqual(xy(vec2Min({ x: 1, y: 9 }, b)), xy(vec2Min({ x: 1, y: 9 }, b, { x: 1, y: 9 })));
        assert.deepEqual(xy(vec2Max({ x: 1, y: 9 }, b)), xy(vec2Max({ x: 1, y: 9 }, b, { x: 1, y: 9 })));
        assert.deepEqual(xy(vec2Clamp({ x: 5, y: -5 }, { x: 0, y: 0 }, { x: 1, y: 1 })), xy(vec2Clamp({ x: 5, y: -5 }, { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 5, y: -5 })));
        assert.deepEqual(xy(vec2Lerp({ x: 3, y: 4 }, { x: 4, y: 6 }, { x: 0.5, y: 0.25 })), xy(vec2Lerp({ x: 3, y: 4 }, { x: 4, y: 6 }, { x: 0.5, y: 0.25 }, { x: 3, y: 4 })));
        assert.deepEqual(xy(vec2LerpNumber({ x: 3, y: 4 }, { x: 4, y: 6 }, 0.5)), xy(vec2LerpNumber({ x: 3, y: 4 }, { x: 4, y: 6 }, 0.5, { x: 3, y: 4 })));

        // 复制类
        assert.deepEqual(xy(vec2Copy(a)), xy(vec2Copy(a, { x: 0, y: 0 })));
        assert.deepEqual(xy(vec2From(5, 6)), xy(vec2From(5, 6, { x: 0, y: 0 })));
        assert.deepEqual(vec2ToArray({ x: 7, y: 8 }), [7, 8]);

        // 度量类（无 out）
        assert.equal(vec2Length({ x: 3, y: 4 }), 5);
        assert.equal(vec2LengthSquared({ x: 3, y: 4 }), 25);
        assert.deepEqual(xy(vec2Normalize({ x: 3, y: 4 })), xy(vec2Normalize({ x: 3, y: 4 }, { x: 0, y: 0 })));
        assert.equal(vec2Distance({ x: 3, y: 4 }, b), vec2Distance({ x: 3, y: 4 }, { x: 1, y: 2 }));
        assert.equal(vec2DistanceSquared({ x: 3, y: 4 }, { x: 1, y: 2, z: 9 }), vec2DistanceSquared({ x: 3, y: 4 }, { x: 1, y: 2, z: 9 }));
        assert.equal(vec2Dot({ x: 1, y: 2 }, c), 11);
        assert.equal(vec2Cross({ x: 1, y: 2 }, c), -2);
        assert.equal(vec2Equals({ x: 1, y: 2 }, b), true);
        assert.equal(vec2Equals({ x: 1, y: 2 }, c), false);
        assert.equal(vec2ToString({ x: 1.5, y: -2.25 }), '(1.5, -2.25)');

        // 静态工具
        assert.deepEqual(xy(vec2LerpClamped({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5)), xy(vec2LerpClamped({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5, { x: 0, y: 0 })));
        assert.deepEqual(xy(vec2LerpNumber({ x: 0, y: 0 }, { x: 10, y: 20 }, 2)), xy(vec2LerpNumber({ x: 0, y: 0 }, { x: 10, y: 20 }, 2, { x: 0, y: 0 })));
        assert.deepEqual(xy(vec2Scale({ x: 2, y: 3 }, { x: 4, y: 5 })), xy(vec2Scale({ x: 2, y: 3 }, { x: 4, y: 5 }, { x: 0, y: 0 })));
        assert.deepEqual(xy(vec2Reflect({ x: 1, y: -1 }, { x: 0, y: 1 })), xy(vec2Reflect({ x: 1, y: -1 }, { x: 0, y: 1 }, { x: 0, y: 0 })));
        assert.deepEqual(xy(vec2Perpendicular({ x: 3, y: 4 })), xy(vec2Perpendicular({ x: 3, y: 4 }, { x: 0, y: 0 })));
        assert.deepEqual(xy(vec2ClampMagnitude({ x: 10, y: 0 }, 3)), xy(vec2ClampMagnitude({ x: 10, y: 0 }, 3, { x: 0, y: 0 })));
        assert.deepEqual(xy(vec2Polar(5, 0)), xy(vec2Polar(5, 0, { x: 0, y: 0 })));
        assert.equal(vec2Dot({ x: 1, y: 2 }, b), vec2Dot({ x: 1, y: 2 }, { x: 1, y: 2 }));
        assert.equal(vec2Angle({ x: 1, y: 0 }, { x: 0, y: 1 }), vec2Angle({ x: 1, y: 0 }, { x: 0, y: 1 }));
        assert.equal(vec2SignedAngle({ x: 1, y: 0 }, { x: 0, y: 1 }), vec2SignedAngle({ x: 1, y: 0 }, { x: 0, y: 1 }));
        assert.equal(vec2Distance({ x: 3, y: 4 }, { x: 1, y: 2 }), vec2Distance({ x: 3, y: 4 }, { x: 1, y: 2 }));

        // random 无法比数值，改为把 Math.random 换成确定序列，比「消费了哪几个数、按什么顺序」：
        // 「缺省 out」与「传 out」两条路径各自取两个数，且都是先 x 后 y（P5：调用次数与顺序是既有行为）
        const originalRandom = Math.random;
        const sequence = [0.1, 0.2, 0.3, 0.4];
        let cursor = 0;

        Math.random = () => sequence[cursor++];
        try
        {
            assert.deepEqual(xy(vec2Random()), { x: 0.1, y: 0.2 });
            assert.deepEqual(xy(vec2Random({ x: 0, y: 0 })), { x: 0.3, y: 0.4 });
        }
        finally
        {
            Math.random = originalRandom;
        }
    });

    it('VEC2_* 常量彼此同值且冻结', () =>
    {
        assert.equal(VEC2_EPSILON, 0.00001);
        assert.equal(VEC2_EPSILON_NORMAL_SQRT, 1e-15);

        assert.deepEqual(xy(VEC2_ZERO), { x: 0, y: 0 });
        assert.deepEqual(xy(VEC2_ONE), { x: 1, y: 1 });
        assert.deepEqual(xy(VEC2_UP), { x: 0, y: 1 });
        assert.deepEqual(xy(VEC2_DOWN), { x: 0, y: -1 });
        assert.deepEqual(xy(VEC2_LEFT), { x: -1, y: 0 });
        assert.deepEqual(xy(VEC2_RIGHT), { x: 1, y: 0 });
        assert.deepEqual(xy(VEC2_POSITIVE_INFINITY), { x: Infinity, y: Infinity });
        assert.deepEqual(xy(VEC2_NEGATIVE_INFINITY), { x: -Infinity, y: -Infinity });
    });

    it('冻结常量不可扩展（响应式系统据此不建代理）', () =>
    {
        assert.ok(!Object.isExtensible(VEC2_ZERO));
        assert.ok(!Object.isExtensible(VEC2_ONE));
    });
});
