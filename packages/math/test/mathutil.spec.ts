import { describe, expect, it } from 'vitest';

import {
    mathUtilClamp,
    MATHF_DEG2RAD,
    mathUtilDegToRad,
    mathUtilEquals,
    mathUtilGcd,
    mathUtilLcm,
    mathUtilLerp,
    mathUtilMapLinear,
    mathUtilNewUuid,
    MATHUTIL_PRECISION,
    MATHF_RAD2DEG,
    mathUtilRadToDeg,
    mathUtilRandFloat,
    mathUtilRandFloatSpread,
    mathUtilRandInt,
    mathUtilSmootherstep,
    mathUtilSmoothstep,
    mathUtilUclideanModulo,
} from '../src/mathutil';
import { MATHF_DEG2RAD, MATHF_RAD2DEG, mathfClamp01, mathfLerp, mathfMax, mathfMin, mathfSign } from '../src/mathf';
import { DEFAULT_ROTATION_ORDER, RotationOrder } from '../src/enums/RotationOrder';

/**
 * `packages/math/src/mathutil.ts`——原 `polyfill` 的 `class MathUtil` 的**纯函数形态**。
 *
 * 这份 spec 有两个任务：
 *
 * 1. **覆盖纯函数化后保留的全部成员**（原 `MathUtil` 的每个实例方法 / 字段逐一对应）；
 * 2. **把「与 `mathf.ts` 同名不同义」的地方钉住** —— `mathUtilClamp` / `mathUtilLerp` /
 *    `mathUtilSmoothstep` / `mathUtilEquals` 与 `mathfClamp` / `mathfLerp` /
 *    `mathfSmoothStep` / `mathfApproximately` **语义不同**，两套并存是**有意的**
 *    （全仓有真实消费方，如 `vec2LerpClamped` 依赖 `mathUtilClamp(NaN, 0, 1) === 1`）。
 *    改动前先看这些带 `★` 的用例。
 */
describe('mathUtils（math 的标量工具集）', () =>
{
    describe('★ 与原生 `Math.*` 的语义差异（合并时最容易踩的地方）', () =>
    {
        it('★★ `mathUtilClamp` 与 `Math.min(Math.max(...))` 的差异：越界取「近端」而非「有序上下界」', () =>
        {
            // 1) 区间内与边界上两者一致
            expect(mathUtilClamp(5, 0, 10)).toBe(5);
            expect(mathUtilClamp(0, 0, 10)).toBe(0);
            expect(mathUtilClamp(10, 0, 10)).toBe(10);
            expect(Math.min(Math.max(5, 0), 10)).toBe(5);

            // 2) 越界：取「离 value 更近的那一端」
            expect(mathUtilClamp(12, 10, 0)).toBe(10); // 两端等距(2/12) → 取较大的限值 10
            expect(mathUtilClamp(-99, -10, -1)).toBe(-10); // 靠近 -10
            expect(mathUtilClamp(100, 10, 0)).toBe(10); // 靠近 10
            // 与「有序上下界」语义（`Math.min(Math.max(...))`，原 `Mathf.Clamp`）的分歧就出在这种越界上：
            expect(Math.min(Math.max(100, 10), 0)).toBe(0);

            // 3) NaN：本函数返回「参数列表中较大的那个限值」，mathfMin/mathfMax 传播 NaN
            expect(mathUtilClamp(Number.NaN, 0, 10)).toBe(10);
            expect(mathUtilClamp(Number.NaN, 10, 0)).toBe(10);
            expect(Number.isNaN(Math.min(Math.max(Number.NaN, 0), 10))).toBe(true);
        });

        it('★★ `mathUtilClamp` 不传播 NaN，`mathfClamp01` 传播 NaN', () =>
        {
            expect(mathUtilClamp(Number.NaN, 0, 1)).toBe(1);
            expect(Number.isNaN(mathfClamp01(Number.NaN))).toBe(true);
        });

        it('★★ `mathfMin` / `mathfMax` 不传播 NaN，原生 `Math.min` / `Math.max` 传播', () =>
        {
            expect(mathfMin(Number.NaN, 5)).toBe(5);
            expect(mathfMax(Number.NaN, 5)).toBe(5);
            expect(Number.isNaN(Math.min(Number.NaN, 5))).toBe(true);
            expect(Number.isNaN(Math.max(Number.NaN, 5))).toBe(true);
        });

        it('★★ `mathfSign(0) === 1`（原 `Mathf.Sign`），原生 `Math.sign(0) === 0`；`NaN` 归到 -1', () =>
        {
            expect(mathfSign(0)).toBe(1);
            expect(mathfSign(-0)).toBe(1);
            // `NaN >= 0` 为假 → 走 -1 分支（不是 1）
            expect(mathfSign(Number.NaN)).toBe(-1);
            expect(Math.sign(0)).toBe(0);
            expect(Math.sign(-0)).toBe(-0);
        });
    });

    describe('常量', () =>
    {
        it('MATHF_DEG2RAD / MATHF_RAD2DEG 互为倒数，且与 π 的关系正确', () =>
        {
            expect(MATHF_DEG2RAD * 180).toBeCloseTo(Math.PI, 12);
            expect(MATHF_RAD2DEG).toBeCloseTo(1 / MATHF_DEG2RAD, 12);
            expect(45 * MATHF_DEG2RAD * MATHF_RAD2DEG).toBeCloseTo(45, 12);
        });

        it('MATHUTIL_PRECISION 是判等的默认精度 1e-6', () =>
        {
            expect(MATHUTIL_PRECISION).toBe(1e-6);
        });

        it('DEFAULT_ROTATION_ORDER 是 RotationOrder.XYZ（原 mathUtil.DefaultRotationOrder）', () =>
        {
            expect(DEFAULT_ROTATION_ORDER).toBe(RotationOrder.XYZ);
        });

        it('mathUtilDegToRad / mathUtilRadToDeg 与常量一致', () =>
        {
            expect(mathUtilDegToRad(180)).toBeCloseTo(Math.PI, 12);
            expect(mathUtilRadToDeg(Math.PI)).toBeCloseTo(180, 12);
            expect(mathUtilDegToRad(90)).toBeCloseTo(90 * MATHF_DEG2RAD, 12);
        });
    });

    describe('mathUtilClamp / mathfClamp01', () =>
    {
        it('区间内的值原样返回，越界被钳到端点', () =>
        {
            expect(mathUtilClamp(5, 0, 10)).toBe(5);
            expect(mathUtilClamp(-1, 0, 10)).toBe(0);
            expect(mathUtilClamp(11, 0, 10)).toBe(10);
            expect(mathUtilClamp(0, 0, 10)).toBe(0);
            expect(mathUtilClamp(10, 0, 10)).toBe(10);
        });

        it('mathfClamp01 把值限定在 [0,1]', () =>
        {
            expect(mathfClamp01(-0.5)).toBe(0);
            expect(mathfClamp01(0.25)).toBeCloseTo(0.25, 12);
            expect(mathfClamp01(1.5)).toBe(1);
            expect(mathfClamp01(0)).toBe(0);
            expect(mathfClamp01(1)).toBe(1);
        });
    });

    describe('mathUtilMapLinear', () =>
    {
        it('把 [a1,a2] 线性映射到 [b1,b2]', () =>
        {
            expect(mathUtilMapLinear(0, 0, 1, 0, 100)).toBeCloseTo(0, 12);
            expect(mathUtilMapLinear(1, 0, 1, 0, 100)).toBeCloseTo(100, 12);
            expect(mathUtilMapLinear(0.5, 0, 1, 0, 100)).toBeCloseTo(50, 12);
        });

        it('原区间与目标区间长度相同 → 纯平移', () =>
        {
            expect(mathUtilMapLinear(3, 0, 10, 5, 15)).toBeCloseTo(8, 12);
        });

        it('不夹取：入参越界时结果也越界', () =>
        {
            expect(mathUtilMapLinear(2, 0, 1, 0, 100)).toBeCloseTo(200, 12);
        });
    });

    describe('mathUtilLerp / mathfLerp', () =>
    {
        it('端点：t=0 得 start，t=1 得 end；t=0.5 得中点', () =>
        {
            expect(mathUtilLerp(10, 20, 0)).toBeCloseTo(10, 12);
            expect(mathUtilLerp(10, 20, 1)).toBeCloseTo(20, 12);
            expect(mathUtilLerp(10, 20, 0.5)).toBeCloseTo(15, 12);
        });

        it('★ `mathUtilLerp` 外插、`mathfLerp` 夹取 `t`（两者唯一的差别）', () =>
        {
            expect(mathUtilLerp(10, 20, 2)).toBeCloseTo(30, 12);
            expect(mathUtilLerp(10, 20, -1)).toBeCloseTo(0, 12);

            expect(mathfLerp(10, 20, 2)).toBeCloseTo(20, 12);
            expect(mathfLerp(10, 20, -1)).toBeCloseTo(10, 12);
        });

        it('`t` 在 [0,1] 内时 `mathUtilLerp` 与 `mathfLerp` 完全一致', () =>
        {
            for (const t of [0, 0.1, 0.5, 0.9, 1])
            {
                expect(mathfLerp(3, 7, t), `t=${t}`).toBeCloseTo(mathUtilLerp(3, 7, t), 12);
            }
        });
    });

    describe('mathUtilSmoothstep / mathUtilSmootherstep', () =>
    {
        it('区间外直接返回 0 / 1，区间内单调不减', () =>
        {
            expect(mathUtilSmoothstep(10, 10, 20)).toBe(0);
            expect(mathUtilSmoothstep(20, 10, 20)).toBe(1);
            expect(mathUtilSmoothstep(5, 10, 20)).toBe(0);
            expect(mathUtilSmoothstep(25, 10, 20)).toBe(1);

            let prev = -Infinity;

            for (let i = 0; i <= 20; i++)
            {
                const v = mathUtilSmoothstep(10 + i * 0.5, 10, 20);

                expect(v, `i=${i}`).toBeGreaterThanOrEqual(prev - 1e-12);
                prev = v;
            }
        });

        it('归一化中点是 0.5（3x²−2x³ 在 x=0.5 处为 0.5）', () =>
        {
            expect(mathUtilSmoothstep(15, 10, 20)).toBeCloseTo(0.5, 12);
            expect(mathUtilSmootherstep(15, 10, 20)).toBeCloseTo(0.5, 12);
        });

        it('mathUtilSmootherstep 的端点行为与 mathUtilSmoothstep 相同', () =>
        {
            expect(mathUtilSmootherstep(5, 10, 20)).toBe(0);
            expect(mathUtilSmootherstep(25, 10, 20)).toBe(1);
        });
    });

    describe('mathUtilEquals（绝对误差，默认 MATHUTIL_PRECISION）', () =>
    {
        it('自身相等；1e-9 的差为真；明显不同为假', () =>
        {
            expect(mathUtilEquals(1, 1)).toBe(true);
            expect(mathUtilEquals(1, 1 + 1e-9)).toBe(true);
            expect(mathUtilEquals(1, 2)).toBe(false);
            expect(mathUtilEquals(0, 0)).toBe(true);
        });

        it('显式精度覆盖默认值', () =>
        {
            expect(mathUtilEquals(1, 1.01, 0.1)).toBe(true);
            expect(mathUtilEquals(1, 1.01, 0.001)).toBe(false);
        });

        it('★ 与 `mathfApproximately` 不同：这里是纯绝对误差，不随量级放大', () =>
        {
            // 相对误差判定（Approximately）对 1e9 量级会给很宽的容差，本函数不会
            expect(mathUtilEquals(1e9, 1e9 + 1)).toBe(false);
            expect(mathUtilEquals(1e9, 1e9 + 1e-7)).toBe(true);
        });
    });

    describe('随机数', () =>
    {
        it('mathUtilRandInt 落在 [low, high] 且两端可达', () =>
        {
            const seen = new Set();

            for (let i = 0; i < 2000; i++)
            {
                const v = mathUtilRandInt(0, 2);

                expect(Number.isInteger(v)).toBe(true);
                expect(v).toBeGreaterThanOrEqual(0);
                expect(v).toBeLessThanOrEqual(2);
                seen.add(v);
            }
            expect(seen.has(0)).toBe(true);
            expect(seen.has(2)).toBe(true);
        });

        it('mathUtilRandFloat 落在 [low, high)', () =>
        {
            for (let i = 0; i < 500; i++)
            {
                const v = mathUtilRandFloat(-3, 5);

                expect(v).toBeGreaterThanOrEqual(-3);
                expect(v).toBeLessThan(5);
            }
        });

        it('mathUtilRandFloatSpread 落在 [-range/2, range/2)', () =>
        {
            for (let i = 0; i < 500; i++)
            {
                const v = mathUtilRandFloatSpread(4);

                expect(v).toBeGreaterThanOrEqual(-2);
                expect(v).toBeLessThan(2);
            }
        });
    });

    describe('mathUtilUclideanModulo', () =>
    {
        it('★ 负数结果恒与除数同号（与 `%` 不同）', () =>
        {
            expect(mathUtilUclideanModulo(-1, 3)).toBe(2);
            expect(-1 % 3).toBe(-1);

            expect(mathUtilUclideanModulo(4, 3)).toBe(1);
            expect(mathUtilUclideanModulo(-4, 3)).toBe(2);
            expect(mathUtilUclideanModulo(0, 3)).toBe(0);
        });
    });

    describe('mathUtilGcd / mathUtilLcm', () =>
    {
        it('mathUtilGcd 求最大公约数（含 0 与互质）', () =>
        {
            expect(mathUtilGcd(12, 8)).toBe(4);
            expect(mathUtilGcd(7, 13)).toBe(1);
            expect(mathUtilGcd(5, 0)).toBe(5);
            expect(mathUtilGcd(0, 5)).toBe(5);
        });

        it('mathUtilLcm 求最小公倍数', () =>
        {
            expect(mathUtilLcm(4, 6)).toBe(12);
            expect(mathUtilLcm(7, 13)).toBe(91);
        });
    });

    describe('mathUtilNewUuid', () =>
    {
        it('长度 36、第 15 位固定为 4、分隔符位置正确', () =>
        {
            const id = mathUtilNewUuid();

            expect(id).toHaveLength(36);
            expect(id[14]).toBe('4');
            for (const i of [8, 13, 18, 23])
            {
                expect(id[i], `第 ${i} 位应为 -`).toBe('-');
            }
            expect(/^[0-9A-Fa-f-]{36}$/.test(id)).toBe(true);
        });

        it('变体位（第 20 位）落在 89AB 之一（字符集是十六进制大写）', () =>
        {
            for (let i = 0; i < 50; i++)
            {
                expect('89AB').toContain(mathUtilNewUuid()[19]);
            }
        });

        it('两次生成不相同', () =>
        {
            const set = new Set();

            for (let i = 0; i < 200; i++) set.add(mathUtilNewUuid());
            expect(set.size).toBe(200);
        });

        it('可指定长度（此时不再有 uuid 的固定位）', () =>
        {
            expect(mathUtilNewUuid(8)).toHaveLength(8);
        });
    });
});
