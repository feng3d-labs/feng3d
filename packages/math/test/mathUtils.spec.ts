import { describe, expect, it } from 'vitest';

import {
    clamp,
    clamp01,
    DEG2RAD,
    degToRad,
    equals,
    gcd,
    lcm,
    lerp,
    lerpClamped,
    mapLinear,
    max,
    min,
    newUuid,
    PRECISION,
    RAD2DEG,
    radToDeg,
    randFloat,
    randFloatSpread,
    randInt,
    sign,
    smootherstep,
    smoothstep,
    uclideanModulo,
} from '../src/mathUtils';
import { DEFAULT_ROTATION_ORDER, RotationOrder } from '../src/enums/RotationOrder';

/**
 * `packages/math/src/mathUtils.ts`——`MathUtil`（原 `polyfill`）+ `Mathf`（原 `MathF.ts`）
 * **合并后**的模块级纯函数集（issue #134 收尾批）。
 *
 * 这份 spec 有两个任务：
 *
 * 1. **覆盖合并后保留的全部成员**（原先 `mathf.spec.ts` / `mathfAngles.spec.ts` 里针对
 *    「纯转发到 `Math.*`」的用例**不再需要**——那些函数已删，调用方直接调 `Math.*`，
 *    原生函数不由本包负责测试；对应的原测试内容见 PR 说明）；
 * 2. **把合并时唯一真正危险的地方钉住**：`clamp` / `clamp01` / `min` / `max` / `sign`
 *    与原生的 `Math.min` / `Math.max` / `Math.sign` **语义不同**，合并时**不能**互相替换。
 *    这些差异全仓有真实消费方（如 `vec2LerpClamped`、`vec3SignedAngle`），
 *    所以每一条都在下面用 `★` 显式断言，改动前先看这些用例。
 */
describe('mathUtils（math 的标量工具集）', () =>
{
    describe('★ 与原生 `Math.*` 的语义差异（合并时最容易踩的地方）', () =>
    {
        it('★★ `clamp` 与 `Math.min(Math.max(...))` 的差异：越界取「近端」而非「有序上下界」', () =>
        {
            // 1) 区间内与边界上两者一致
            expect(clamp(5, 0, 10)).toBe(5);
            expect(clamp(0, 0, 10)).toBe(0);
            expect(clamp(10, 0, 10)).toBe(10);
            expect(Math.min(Math.max(5, 0), 10)).toBe(5);

            // 2) 越界：取「离 value 更近的那一端」
            expect(clamp(12, 10, 0)).toBe(10); // 两端等距(2/12) → 取较大的限值 10
            expect(clamp(-99, -10, -1)).toBe(-10); // 靠近 -10
            expect(clamp(100, 10, 0)).toBe(10); // 靠近 10
            // 与「有序上下界」语义（`Math.min(Math.max(...))`，原 `Mathf.Clamp`）的分歧就出在这种越界上：
            expect(Math.min(Math.max(100, 10), 0)).toBe(0);

            // 3) NaN：本函数返回「参数列表中较大的那个限值」，min/max 传播 NaN
            expect(clamp(Number.NaN, 0, 10)).toBe(10);
            expect(clamp(Number.NaN, 10, 0)).toBe(10);
            expect(Number.isNaN(Math.min(Math.max(Number.NaN, 0), 10))).toBe(true);
        });

        it('★★ `clamp` 不传播 NaN，`clamp01` 传播 NaN', () =>
        {
            expect(clamp(Number.NaN, 0, 1)).toBe(1);
            expect(Number.isNaN(clamp01(Number.NaN))).toBe(true);
        });

        it('★★ `min` / `max` 不传播 NaN，原生 `Math.min` / `Math.max` 传播', () =>
        {
            expect(min(Number.NaN, 5)).toBe(5);
            expect(max(Number.NaN, 5)).toBe(5);
            expect(Number.isNaN(Math.min(Number.NaN, 5))).toBe(true);
            expect(Number.isNaN(Math.max(Number.NaN, 5))).toBe(true);
        });

        it('★★ `sign(0) === 1`（原 `Mathf.Sign`），原生 `Math.sign(0) === 0`；`NaN` 归到 -1', () =>
        {
            expect(sign(0)).toBe(1);
            expect(sign(-0)).toBe(1);
            // `NaN >= 0` 为假 → 走 -1 分支（不是 1）
            expect(sign(Number.NaN)).toBe(-1);
            expect(Math.sign(0)).toBe(0);
            expect(Math.sign(-0)).toBe(-0);
        });
    });

    describe('常量', () =>
    {
        it('DEG2RAD / RAD2DEG 互为倒数，且与 π 的关系正确', () =>
        {
            expect(DEG2RAD * 180).toBeCloseTo(Math.PI, 12);
            expect(RAD2DEG).toBeCloseTo(1 / DEG2RAD, 12);
            expect(45 * DEG2RAD * RAD2DEG).toBeCloseTo(45, 12);
        });

        it('PRECISION 是判等的默认精度 1e-6', () =>
        {
            expect(PRECISION).toBe(1e-6);
        });

        it('DEFAULT_ROTATION_ORDER 是 RotationOrder.XYZ', () =>
        {
            expect(DEFAULT_ROTATION_ORDER).toBe(RotationOrder.XYZ);
        });

        it('degToRad / radToDeg 与常量一致', () =>
        {
            expect(degToRad(180)).toBeCloseTo(Math.PI, 12);
            expect(radToDeg(Math.PI)).toBeCloseTo(180, 12);
            expect(degToRad(90)).toBeCloseTo(90 * DEG2RAD, 12);
        });
    });

    describe('clamp / clamp01', () =>
    {
        it('区间内的值原样返回，越界被钳到端点', () =>
        {
            expect(clamp(5, 0, 10)).toBe(5);
            expect(clamp(-1, 0, 10)).toBe(0);
            expect(clamp(11, 0, 10)).toBe(10);
            expect(clamp(0, 0, 10)).toBe(0);
            expect(clamp(10, 0, 10)).toBe(10);
        });

        it('clamp01 把值限定在 [0,1]', () =>
        {
            expect(clamp01(-0.5)).toBe(0);
            expect(clamp01(0.25)).toBeCloseTo(0.25, 12);
            expect(clamp01(1.5)).toBe(1);
            expect(clamp01(0)).toBe(0);
            expect(clamp01(1)).toBe(1);
        });
    });

    describe('mapLinear', () =>
    {
        it('把 [a1,a2] 线性映射到 [b1,b2]', () =>
        {
            expect(mapLinear(0, 0, 1, 0, 100)).toBeCloseTo(0, 12);
            expect(mapLinear(1, 0, 1, 0, 100)).toBeCloseTo(100, 12);
            expect(mapLinear(0.5, 0, 1, 0, 100)).toBeCloseTo(50, 12);
        });

        it('原区间与目标区间长度相同 → 纯平移', () =>
        {
            expect(mapLinear(3, 0, 10, 5, 15)).toBeCloseTo(8, 12);
        });

        it('不夹取：入参越界时结果也越界', () =>
        {
            expect(mapLinear(2, 0, 1, 0, 100)).toBeCloseTo(200, 12);
        });
    });

    describe('lerp / lerpClamped', () =>
    {
        it('端点：t=0 得 start，t=1 得 end；t=0.5 得中点', () =>
        {
            expect(lerp(10, 20, 0)).toBeCloseTo(10, 12);
            expect(lerp(10, 20, 1)).toBeCloseTo(20, 12);
            expect(lerp(10, 20, 0.5)).toBeCloseTo(15, 12);
        });

        it('★ `lerp` 外插、`lerpClamped` 夹取 `t`（两者唯一的差别）', () =>
        {
            expect(lerp(10, 20, 2)).toBeCloseTo(30, 12);
            expect(lerp(10, 20, -1)).toBeCloseTo(0, 12);

            expect(lerpClamped(10, 20, 2)).toBeCloseTo(20, 12);
            expect(lerpClamped(10, 20, -1)).toBeCloseTo(10, 12);
        });

        it('`t` 在 [0,1] 内时两者完全一致', () =>
        {
            for (const t of [0, 0.1, 0.5, 0.9, 1])
            {
                expect(lerpClamped(3, 7, t), `t=${t}`).toBeCloseTo(lerp(3, 7, t), 12);
            }
        });
    });

    describe('smoothstep / smootherstep', () =>
    {
        it('区间外直接返回 0 / 1，区间内单调不减', () =>
        {
            expect(smoothstep(10, 10, 20)).toBe(0);
            expect(smoothstep(20, 10, 20)).toBe(1);
            expect(smoothstep(5, 10, 20)).toBe(0);
            expect(smoothstep(25, 10, 20)).toBe(1);

            let prev = -Infinity;

            for (let i = 0; i <= 20; i++)
            {
                const v = smoothstep(10 + i * 0.5, 10, 20);

                expect(v, `i=${i}`).toBeGreaterThanOrEqual(prev - 1e-12);
                prev = v;
            }
        });

        it('归一化中点是 0.5（3x²−2x³ 在 x=0.5 处为 0.5）', () =>
        {
            expect(smoothstep(15, 10, 20)).toBeCloseTo(0.5, 12);
            expect(smootherstep(15, 10, 20)).toBeCloseTo(0.5, 12);
        });

        it('smootherstep 的端点行为与 smoothstep 相同', () =>
        {
            expect(smootherstep(5, 10, 20)).toBe(0);
            expect(smootherstep(25, 10, 20)).toBe(1);
        });
    });

    describe('equals（绝对误差，默认 PRECISION）', () =>
    {
        it('自身相等；1e-9 的差为真；明显不同为假', () =>
        {
            expect(equals(1, 1)).toBe(true);
            expect(equals(1, 1 + 1e-9)).toBe(true);
            expect(equals(1, 2)).toBe(false);
            expect(equals(0, 0)).toBe(true);
        });

        it('显式精度覆盖默认值', () =>
        {
            expect(equals(1, 1.01, 0.1)).toBe(true);
            expect(equals(1, 1.01, 0.001)).toBe(false);
        });

        it('★ 与 `Mathf.Approximately` 不同：这里是纯绝对误差，不随量级放大', () =>
        {
            // 相对误差判定（Approximately）对 1e9 量级会给很宽的容差，本函数不会
            expect(equals(1e9, 1e9 + 1)).toBe(false);
            expect(equals(1e9, 1e9 + 1e-7)).toBe(true);
        });
    });

    describe('随机数', () =>
    {
        it('randInt 落在 [low, high] 且两端可达', () =>
        {
            const seen = new Set();

            for (let i = 0; i < 2000; i++)
            {
                const v = randInt(0, 2);

                expect(Number.isInteger(v)).toBe(true);
                expect(v).toBeGreaterThanOrEqual(0);
                expect(v).toBeLessThanOrEqual(2);
                seen.add(v);
            }
            expect(seen.has(0)).toBe(true);
            expect(seen.has(2)).toBe(true);
        });

        it('randFloat 落在 [low, high)', () =>
        {
            for (let i = 0; i < 500; i++)
            {
                const v = randFloat(-3, 5);

                expect(v).toBeGreaterThanOrEqual(-3);
                expect(v).toBeLessThan(5);
            }
        });

        it('randFloatSpread 落在 [-range/2, range/2)', () =>
        {
            for (let i = 0; i < 500; i++)
            {
                const v = randFloatSpread(4);

                expect(v).toBeGreaterThanOrEqual(-2);
                expect(v).toBeLessThan(2);
            }
        });
    });

    describe('uclideanModulo', () =>
    {
        it('★ 负数结果恒与除数同号（与 `%` 不同）', () =>
        {
            expect(uclideanModulo(-1, 3)).toBe(2);
            expect(-1 % 3).toBe(-1);

            expect(uclideanModulo(4, 3)).toBe(1);
            expect(uclideanModulo(-4, 3)).toBe(2);
            expect(uclideanModulo(0, 3)).toBe(0);
        });
    });

    describe('gcd / lcm', () =>
    {
        it('gcd 求最大公约数（含 0 与互质）', () =>
        {
            expect(gcd(12, 8)).toBe(4);
            expect(gcd(7, 13)).toBe(1);
            expect(gcd(5, 0)).toBe(5);
            expect(gcd(0, 5)).toBe(5);
        });

        it('lcm 求最小公倍数', () =>
        {
            expect(lcm(4, 6)).toBe(12);
            expect(lcm(7, 13)).toBe(91);
        });
    });

    describe('newUuid', () =>
    {
        it('长度 36、第 15 位固定为 4、分隔符位置正确', () =>
        {
            const id = newUuid();

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
                expect('89AB').toContain(newUuid()[19]);
            }
        });

        it('两次生成不相同', () =>
        {
            const set = new Set();

            for (let i = 0; i < 200; i++) set.add(newUuid());
            expect(set.size).toBe(200);
        });

        it('可指定长度（此时不再有 uuid 的固定位）', () =>
        {
            expect(newUuid(8)).toHaveLength(8);
        });
    });
});
