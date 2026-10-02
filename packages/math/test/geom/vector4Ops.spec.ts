import { assert, describe, it } from 'vitest';



import type { Vector4Like } from '../../src/geom/vector4Ops';
import {
    VEC4_EPSILON,
    VEC4_NEGATIVE_INFINITY,
    VEC4_ONE,
    VEC4_POSITIVE_INFINITY,
    VEC4_ZERO,
    vec4Add,
    vec4Copy,
    vec4Distance,
    vec4Divide,
    vec4Dot,
    vec4Equals,
    vec4From,
    vec4FromArray,
    vec4FromVector3,
    vec4Lerp,
    vec4LerpClamped,
    vec4LerpNumber,
    vec4Length,
    vec4LengthSquared,
    vec4Max,
    vec4Min,
    vec4MoveTowards,
    vec4Multiply,
    vec4Negate,
    vec4Normalized,
    vec4NormalizeXYZ,
    vec4Project,
    vec4Random,
    vec4Scale,
    vec4ScaleNumber,
    vec4StrictEquals,
    vec4Sub,
    vec4ToArray,
    vec4ToString,
    vec4ToVector3,
} from '../../src/geom/vector4Ops';

/**
 * 只取 xyzw 四个分量。
 *
 * **不要**用 `{ ...vector4Instance }` 做断言：class 在 ESNext 目标下把声明字段编译为
 * 实例自有的**可枚举**属性，展开可能与纯函数返回的 `{ x, y, z, w }` 字面量不等
 * （`vector3Ops.spec.ts` 踩过这个坑，见其文件头说明）。
 */
function xyzw(v: Vector4Like): { x: number; y: number; z: number; w: number }
{
    return { x: v.x, y: v.y, z: v.z, w: v.w };
}

/**
 * `vector4Ops` 纯函数层的**契约测试**（issue #134 阶段 A2f）。
 *
 * ## 为什么期望值一律硬编码
 *
 * class 的方法已经**委托给本文件要测的这些函数**，所以「拿 class 当正确性基准」是无效的：
 * 两边会一起错（方案 §10.1 的 P3）。因此分两类用例：
 *
 * - **数值类**：期望值手算后硬编码，能发现纯函数自身的实现错误；
 * - **接线类**：单独一条，只对比 class 与纯函数的返回值，用来发现委托时的参数顺序 / `out` 传错
 *   （它对实现错误不敏感，这是刻意的分工）。
 */
describe('vector4Ops 纯函数层（#134 阶段 A2f）', () =>
{
    it('运算不修改入参，结果只写 out', () =>
    {
        const a = { x: 1, y: 2, z: 3, w: 4 };
        const b = { x: 10, y: 20, z: 30, w: 40 };
        const out = { x: -1, y: -1, z: -1, w: -1 };

        vec4Add(a, b, out);

        assert.deepEqual(xyzw(out), { x: 11, y: 22, z: 33, w: 44 });
        assert.deepEqual(xyzw(a), { x: 1, y: 2, z: 3, w: 4 }, '入参 a 被修改了');
        assert.deepEqual(xyzw(b), { x: 10, y: 20, z: 30, w: 40 }, '入参 b 被修改了');
    });

    it('out 缺省时新建，且缺省初值与 { x: 0, y: 0, z: 0, w: 0 } 一致（四个分量都是 0）', () =>
    {
        const a = { x: 1, y: 2, z: 3, w: 4 };

        const sum = vec4Add(a, a);
        const neg = vec4Negate(a);
        const scaled = vec4ScaleNumber(a, 0);

        // 返回的都是普通字面量（没有 class 身份），且不触碰入参
        assert.deepEqual(xyzw(sum), { x: 2, y: 4, z: 6, w: 8 });
        assert.deepEqual(xyzw(neg), { x: -1, y: -2, z: -3, w: -4 });
        // 0 倍缩放的结果是 0，而不是「未写入的 1」——P6 的检查点（Vector4 的默认 w 也是 0）
        assert.deepEqual(xyzw(scaled), { x: 0, y: 0, z: 0, w: 0 });
        assert.deepEqual(xyzw(a), { x: 1, y: 2, z: 3, w: 4 });
    });

    it('vec4From / vec4Copy / vec4FromArray 按分量写入', () =>
    {
        assert.deepEqual(xyzw(vec4From(1, 2, 3, 4)), { x: 1, y: 2, z: 3, w: 4 });
        assert.deepEqual(xyzw(vec4Copy({ x: 5, y: 6, z: 7, w: 8 })), { x: 5, y: 6, z: 7, w: 8 });
        assert.deepEqual(xyzw(vec4FromArray([9, 9, 1, 2, 3, 4], 2)), { x: 1, y: 2, z: 3, w: 4 });
    });

    it('vec4Add / vec4Sub / vec4Multiply / vec4Divide 逐分量运算', () =>
    {
        const a = { x: 1, y: 2, z: 3, w: 4 };
        const b = { x: 10, y: 20, z: 30, w: 40 };

        assert.deepEqual(xyzw(vec4Add(a, b)), { x: 11, y: 22, z: 33, w: 44 });
        assert.deepEqual(xyzw(vec4Sub(b, a)), { x: 9, y: 18, z: 27, w: 36 });
        assert.deepEqual(xyzw(vec4Multiply(a, b)), { x: 10, y: 40, z: 90, w: 160 });
        assert.deepEqual(xyzw(vec4Divide(b, a)), { x: 10, y: 10, z: 10, w: 10 });
    });

    it('vec4Scale / vec4ScaleNumber / vec4Negate', () =>
    {
        const a = { x: 1, y: 2, z: 3, w: 4 };

        assert.deepEqual(xyzw(vec4Scale(a, { x: 2, y: 3, z: 4, w: 5 })), { x: 2, y: 6, z: 12, w: 20 });
        assert.deepEqual(xyzw(vec4ScaleNumber(a, -2)), { x: -2, y: -4, z: -6, w: -8 });
        assert.deepEqual(xyzw(vec4Negate(a)), { x: -1, y: -2, z: -3, w: -4 });
    });

    it('vec4Lerp 不夹取 alpha；vec4LerpClamped 夹取到 [0,1]', () =>
    {
        const a = { x: 0, y: 0, z: 0, w: 0 };
        const b = { x: 10, y: 20, z: 30, w: 40 };

        // 手算：0 + (10−0)×0.5 = 5，其余同理
        assert.deepEqual(xyzw(vec4Lerp(a, b, 0.5)), { x: 5, y: 10, z: 15, w: 20 });
        // 不夹取：t=2 时越过 b
        assert.deepEqual(xyzw(vec4Lerp(a, b, 2)), { x: 20, y: 40, z: 60, w: 80 });

        // 夹取：t=-1 → a，t=2 → b
        assert.deepEqual(xyzw(vec4LerpClamped(a, b, -1)), { x: 0, y: 0, z: 0, w: 0 });
        assert.deepEqual(xyzw(vec4LerpClamped(a, b, 2)), { x: 10, y: 20, z: 30, w: 40 });
        // vec4LerpNumber 与 vec4Lerp 同语义（不夹取）
        assert.deepEqual(xyzw(vec4LerpNumber(a, b, 2)), { x: 20, y: 40, z: 60, w: 80 });
    });

    it('★ 回归：vec4Lerp 就地调用（out 与 a 同一对象）跨分量读入参', () =>
    {
        const actual = { x: 0, y: 0, z: 0, w: 0 };
        const b = { x: 10, y: 20, z: 30, w: 40 };

        vec4Lerp(actual, b, 0.5, actual);

        // 逐分量独立，手算 (5,10,15,20)：「边算边写」也不会错，但这是就地回归的守门用例
        assert.deepEqual(xyzw(actual), { x: 5, y: 10, z: 15, w: 20 });
    });

    it('vec4Copy 就地调用（out 与 a 同一对象）等价于不变', () =>
    {
        const actual = { x: 1, y: 2, z: 3, w: 4 };

        vec4Copy(actual, actual);

        assert.deepEqual(xyzw(actual), { x: 1, y: 2, z: 3, w: 4 });
    });

    it('vec4Dot / vec4Length / vec4LengthSquared / vec4Distance', () =>
    {
        // 1×5 + 2×6 + 3×7 + 4×8 = 5 + 12 + 21 + 32 = 70
        assert.equal(vec4Dot({ x: 1, y: 2, z: 3, w: 4 }, { x: 5, y: 6, z: 7, w: 8 }), 70);
        // √(9+16) = 5
        assert.equal(vec4Length({ x: 0, y: 3, z: 4, w: 0 }), 5);
        assert.equal(vec4LengthSquared({ x: 0, y: 3, z: 4, w: 0 }), 25);
        // a−b = (0,0,0,3) → 3
        assert.equal(vec4Distance({ x: 1, y: 2, z: 3, w: 7 }, { x: 1, y: 2, z: 3, w: 4 }), 3);
    });

    it('vec4Equals 按 precision 判等，vec4StrictEquals 用 ===', () =>
    {
        const a = { x: 1, y: 2, z: 3, w: 4 };

        assert.equal(vec4Equals(a, { x: 1, y: 2, z: 3, w: 4 }), true);
        assert.equal(vec4Equals(a, { x: 1, y: 2, z: 3, w: 4.1 }), false);
        // 1e-9 < PRECISION(1e-6)，判定相等
        assert.equal(vec4Equals(a, { x: 1, y: 2, z: 3, w: 4 + 1e-9 }), true);
        // 显式给更小的 precision 时不再相等
        assert.equal(vec4Equals(a, { x: 1, y: 2, z: 3, w: 4 + 1e-9 }, 1e-12), false);

        assert.equal(vec4StrictEquals(a, { x: 1, y: 2, z: 3, w: 4 }), true);
        assert.equal(vec4StrictEquals(a, { x: 1, y: 2, z: 3, w: 4 + 1e-9 }), false);
        // 严格相等下 NaN 与自身不等——这正是它与 vec4Equals 的分工
        assert.equal(vec4StrictEquals({ x: NaN, y: 2, z: 3, w: 4 }, { x: NaN, y: 2, z: 3, w: 4 }), false);
    });

    it('两个「归一化」入口语义不同：静态版带 w，实例版只动 x/y/z', () =>
    {
        const a = { x: 0, y: 3, z: 4, w: 10 };

        // 静态版：mag = √(0+9+16+100) = √125 ≈ 11.1803，w 也除以 mag
        const whole = vec4Normalized(a);
        assert.deepEqual(xyzw(whole), { x: 0, y: 3 / Math.sqrt(125), z: 4 / Math.sqrt(125), w: 10 / Math.sqrt(125) });

        // 实例版：mag 仍按四分量算（√125），但只写 x/y/z，w 原样保留
        const xyzOnly = vec4NormalizeXYZ(a);
        assert.deepEqual(xyzw(xyzOnly), { x: 0, y: 3 / Math.sqrt(125), z: 4 / Math.sqrt(125), w: 10 });
    });

    it('归一化的退化分支：静态版给 (0,0,0,0)；实例版 x/y/z 置零但保留 w', () =>
    {
        // 四分量模长 √(1e-14 ×3 + 1e-14) = 2e-7 ≤ VEC4_EPSILON(1e-5) → 走退化分支
        const tiny = { x: 1e-7, y: 1e-7, z: 1e-7, w: 1e-7 };

        assert.deepEqual(xyzw(vec4Normalized(tiny)), { x: 0, y: 0, z: 0, w: 0 });

        // 这里 w 取 7：模长 √(3e-14 + 49) ≈ 7，**不再**是退化分支，
        // 但可以证明实例版「保留 w」不是巧合（w 原样写出，x/y/z 各自除以四分量模长）。
        // x/y/z 用 toBeCloseTo 比较：这里期望值的量级是 1e-8，
        // 而「字面量 1e-7/7」与「1e-7/√(49+3e-14)」在浮点末位上本就不等。
        const bigW = { x: 1e-7, y: 1e-7, z: 1e-7, w: 7 };
        const bigWNormalized = vec4NormalizeXYZ(bigW);

        assert.equal(bigWNormalized.w, 7, '实例版归一化不应改动 w');
        assert.deepEqual(
            [bigWNormalized.x, bigWNormalized.y, bigWNormalized.z].map((v) => Math.abs(v - 1e-7 / 7) < 1e-20),
            [true, true, true]
        );
    });

    it('★ 回归：vec4NormalizeXYZ 就地调用（out 与 a 同一对象）不污染 w', () =>
    {
        const actual = { x: 0, y: 3, z: 4, w: 10 };

        vec4NormalizeXYZ(actual, actual);

        // out.w 读的仍是入参的 w（10）；若实现把 w 写在 x/y/z 之前、或误用整向量归一化，这里会变
        assert.deepEqual(xyzw(actual), { x: 0, y: 3 / Math.sqrt(125), z: 4 / Math.sqrt(125), w: 10 });
    });

    it('vec4Project：b 非零时按投影公式；b 为零向量时给出 NaN 分量（无退化分支）', () =>
    {
        // dot(a,b) = 3, dot(b,b) = 9 → scale = 1/3；(3,0,0,0)×(1/3) = (1,0,0,0)
        assert.deepEqual(xyzw(vec4Project({ x: 1, y: 2, z: 2, w: 0 }, { x: 3, y: 0, z: 0, w: 0 })), { x: 1, y: 0, z: 0, w: 0 });

        const zeroProjected = vec4Project({ x: 1, y: 2, z: 3, w: 4 }, { x: 0, y: 0, z: 0, w: 0 });
        assert.ok(Number.isNaN(zeroProjected.x), 'b 为零向量时应给出 NaN，而不是像 Vector3.Project 那样返回零向量');
    });

    it('★ 回归：vec4Project 就地调用（out 与 a 同一对象）跨分量读入参', () =>
    {
        const actual = { x: 1, y: 2, z: 2, w: 0 };
        const b = { x: 3, y: 0, z: 0, w: 0 };

        vec4Project(actual, b, actual);

        // scale = (1×3 + 2×0 + 2×0 + 0×0) / (3×3) = 1/3 → b×scale = (1,0,0,0)
        assert.deepEqual(xyzw(actual), { x: 1, y: 0, z: 0, w: 0 });
    });

    it('vec4Min / vec4Max 逐分量取小 / 取大（用 Mathf 语义）', () =>
    {
        const lhs = { x: 1, y: 9, z: 3, w: 9 };
        const rhs = { x: 8, y: 2, z: 3, w: 0 };

        assert.deepEqual(xyzw(vec4Min(lhs, rhs)), { x: 1, y: 2, z: 3, w: 0 });
        assert.deepEqual(xyzw(vec4Max(lhs, rhs)), { x: 8, y: 9, z: 3, w: 9 });

        // 这是与 Math.min/Math.max 的**真实语义差异**：Mathf.Min 是 `a < b ? a : b`，
        // 比较为 false 时返回**第二个**参数，所以 (NaN, 1) 得到 1 而不是 NaN；
        // Math.min(NaN, 1) 则为 NaN。委托时必须用 Mathf 才能与 class 原行为一致。
        assert.equal(vec4Min({ x: NaN, y: 1, z: 1, w: 1 }, { x: 1, y: 1, z: 1, w: 1 }).x, 1);
        assert.equal(vec4Max({ x: NaN, y: 1, z: 1, w: 1 }, { x: 1, y: 1, z: 1, w: 1 }).x, 1);
    });

    it('vec4ToVector3 丢弃 w；vec4FromVector3 补上 w', () =>
    {
        assert.deepEqual(vec4ToVector3({ x: 1, y: 2, z: 3, w: 4 }), { x: 1, y: 2, z: 3 });
        assert.deepEqual(xyzw(vec4FromVector3({ x: 5, y: 6, z: 7 }, 0.5)), { x: 5, y: 6, z: 7, w: 0.5 });
    });

    it('vec4ToArray / vec4FromArray 支持 offset，往返一致', () =>
    {
        const arr = [0, 0, 0, 0, 0, 0];

        vec4ToArray({ x: 1, y: 2, z: 3, w: 4 }, arr, 2);

        assert.deepEqual(arr, [0, 0, 1, 2, 3, 4]);
        assert.deepEqual(xyzw(vec4FromArray(arr, 2)), { x: 1, y: 2, z: 3, w: 4 });
    });

    it('vec4MoveTowards：正常推进 / 一步到达 / 退化分支返回 target 本身', () =>
    {
        const current = { x: 0, y: 0, z: 0, w: 0 };
        const target = { x: 10, y: 0, z: 0, w: 0 };

        // 距离 10，步长 4 → 走到 x=4
        assert.deepEqual(xyzw(vec4MoveTowards(current, target, 4)), { x: 4, y: 0, z: 0, w: 0 });

        // 步长 20 > 距离，直接到达
        const reached = vec4MoveTowards(current, target, 20);
        assert.deepEqual(xyzw(reached), { x: 10, y: 0, z: 0, w: 0 });

        // 退化分支返回的是入参 target **本身**（既有行为，方案 §5.3 的同型问题）
        const same = vec4MoveTowards(current, target, 20);
        assert.equal(same, target, '退化分支应与既有实现一样返回 target 本身');

        // 已在目标上（sqdist === 0）同样返回 target 本身
        assert.equal(vec4MoveTowards(target, target, 0), target);
    });

    it('vec4Random 写入四个分量且都在 [0,1)', () =>
    {
        const r = vec4Random();

        for (const val of [r.x, r.y, r.z, r.w])
        {
            assert.ok(val >= 0 && val < 1, `分量 ${val} 不在 [0,1) 内`);
        }
    });

    it('vec4ToString 输出 <x, y, z, w>', () =>
    {
        assert.equal(vec4ToString({ x: 1, y: 2, z: 3, w: 4 }), '<1, 2, 3, 4>');
    });

    it('VEC4_* 常量彼此同值且冻结（响应式系统据此不建代理）', () =>
    {
        assert.ok(!Object.isExtensible(VEC4_ZERO));
        assert.equal(VEC4_EPSILON, 0.00001);

        assert.deepEqual(xyzw(VEC4_ZERO), { x: 0, y: 0, z: 0, w: 0 });
        assert.deepEqual(xyzw(VEC4_ONE), { x: 1, y: 1, z: 1, w: 1 });
        assert.deepEqual(xyzw(VEC4_POSITIVE_INFINITY), { x: Infinity, y: Infinity, z: Infinity, w: Infinity });
        assert.deepEqual(xyzw(VEC4_NEGATIVE_INFINITY), { x: -Infinity, y: -Infinity, z: -Infinity, w: -Infinity });
    });

    it('★ 缺省 out（新建）与就地 out（传自己）两种形态结果一致', () =>
    {
        const a = { x: 1, y: 2, z: 3, w: 4 };
        const b = { x: 10, y: 20, z: 30, w: 40 };

        assert.deepEqual(xyzw(vec4Add(a, b)), xyzw(vec4Add({ x: 1, y: 2, z: 3, w: 4 }, b, { x: 1, y: 2, z: 3, w: 4 })));
        assert.deepEqual(xyzw(vec4Sub(a, b)), xyzw(vec4Sub({ x: 1, y: 2, z: 3, w: 4 }, b, { x: 1, y: 2, z: 3, w: 4 })));
        assert.deepEqual(xyzw(vec4Multiply(a, b)), xyzw(vec4Multiply({ x: 1, y: 2, z: 3, w: 4 }, b, { x: 1, y: 2, z: 3, w: 4 })));
        assert.deepEqual(xyzw(vec4Divide(a, b)), xyzw(vec4Divide({ x: 1, y: 2, z: 3, w: 4 }, b, { x: 1, y: 2, z: 3, w: 4 })));
        assert.deepEqual(xyzw(vec4Negate(a)), xyzw(vec4Negate({ x: 1, y: 2, z: 3, w: 4 }, { x: 1, y: 2, z: 3, w: 4 })));
        assert.deepEqual(xyzw(vec4ScaleNumber(a, 2)), xyzw(vec4ScaleNumber({ x: 1, y: 2, z: 3, w: 4 }, 2, { x: 1, y: 2, z: 3, w: 4 })));
        assert.deepEqual(xyzw(vec4Copy(a)), xyzw(vec4Copy(a, { x: 0, y: 0, z: 0, w: 0 })));
        assert.deepEqual(xyzw(vec4Lerp(a, b, 0.5)), xyzw(vec4Lerp({ x: 1, y: 2, z: 3, w: 4 }, b, 0.5, { x: 1, y: 2, z: 3, w: 4 })));
        assert.deepEqual(xyzw(vec4LerpClamped(a, b, 0.5)), xyzw(vec4LerpClamped({ x: 1, y: 2, z: 3, w: 4 }, b, 0.5, { x: 1, y: 2, z: 3, w: 4 })));
        assert.deepEqual(xyzw(vec4LerpNumber(a, b, 0.5)), xyzw(vec4LerpNumber({ x: 1, y: 2, z: 3, w: 4 }, b, 0.5, { x: 1, y: 2, z: 3, w: 4 })));
        assert.deepEqual(xyzw(vec4Normalized(a)), xyzw(vec4Normalized({ x: 1, y: 2, z: 3, w: 4 }, { x: 1, y: 2, z: 3, w: 4 })));
        assert.deepEqual(xyzw(vec4Project(a, b)), xyzw(vec4Project({ x: 1, y: 2, z: 3, w: 4 }, b, { x: 1, y: 2, z: 3, w: 4 })));
        assert.deepEqual(xyzw(vec4Min(a, b)), xyzw(vec4Min({ x: 1, y: 2, z: 3, w: 4 }, b, { x: 1, y: 2, z: 3, w: 4 })));
        assert.deepEqual(xyzw(vec4Max(a, b)), xyzw(vec4Max({ x: 1, y: 2, z: 3, w: 4 }, b, { x: 1, y: 2, z: 3, w: 4 })));

        // 度量函数没有 out，直接比数值
        assert.equal(vec4Dot(a, b), vec4Dot(a, b));
        assert.equal(vec4Distance(a, b), vec4Distance(a, b));
        assert.equal(vec4Length(a), vec4Length(a));
        assert.equal(vec4LengthSquared(a), vec4LengthSquared(a));
        assert.equal(vec4MoveTowards(a, b, 1).x, vec4MoveTowards(a, b, 1, { x: 0, y: 0, z: 0, w: 0 }).x);
        assert.equal(vec4Equals(a, b), vec4Equals(a, b));
        assert.equal(vec4StrictEquals(a, b), vec4StrictEquals(a, b));
        assert.equal(vec4ToString(a), vec4ToString(a));

        // 实例版归一化只动 x/y/z：用 (w ≠ 0) 的向量对比，才能区分两个归一化入口
        const c = { x: 0, y: 3, z: 4, w: 10 };

        assert.deepEqual(xyzw(vec4NormalizeXYZ(c)), xyzw(vec4NormalizeXYZ({ x: 0, y: 3, z: 4, w: 10 }, { x: 0, y: 3, z: 4, w: 10 })));
    });

    it('vec4ToVector3 缺省新建可写对象，两次调用不共享实例', () =>
    {
        const a = vec4ToVector3({ x: 1, y: 2, z: 3, w: 4 });
        const b = vec4ToVector3({ x: 5, y: 6, z: 7, w: 8 });

        assert.notEqual(a, b, '两次缺省调用不应共享同一个输出对象');
        assert.deepEqual(a, { x: 1, y: 2, z: 3 });
        assert.deepEqual(b, { x: 5, y: 6, z: 7 });
    });

    it('★ 每个「缺省 out」的公共入口都返回独立对象（P8b：数组/对象共享陷阱）', () =>
    {
        const a = { x: 1, y: 2, z: 3, w: 4 };
        const b = { x: 10, y: 20, z: 30, w: 40 };
        const fresh = [
            vec4FromArray([1, 2, 3, 4]),
            vec4FromVector3({ x: 1, y: 2, z: 3 }, 1),
            vec4Random(),
            vec4LerpClamped(a, b, 0.5),
            vec4LerpNumber(a, b, 0.5),
            vec4MoveTowards(a, b, 1),
            vec4Multiply(a, b),
            vec4Normalized(a),
            vec4Project(a, b),
            vec4Min(a, b),
            vec4Max(a, b),
            vec4Copy(a),
            vec4Add(a, b),
            vec4Sub(a, b),
            vec4Divide(a, b),
            vec4Negate(a),
            vec4ScaleNumber(a, 2),
            vec4Lerp(a, b, 0.5),
            vec4ToVector3(a),
        ];

        // 每个元素都必须是可写对象，且前后两次调用不能共享同一个实例
        for (const v of fresh)
        {
            assert.equal(typeof v, 'object');
            assert.notEqual(v, a);
            assert.notEqual(v, b);
        }
        assert.notEqual(vec4Copy(a), vec4Copy(a), '两次缺省调用不应共享同一个输出对象');
    });

    it('vec4ToVector3 返回的纯数据对象可写（消费方直接当 out 用）', () =>
    {
        const v3 = vec4ToVector3({ x: 1, y: 2, z: 3, w: 4 });

        v3.y = 20;

        assert.equal(v3.x, 1);
        assert.equal(v3.z, 3);
        assert.equal(v3.y, 20);
    });
});

