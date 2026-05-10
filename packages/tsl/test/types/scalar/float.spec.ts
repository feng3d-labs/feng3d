import { describe, expect, it } from 'vitest';
import { float, Float } from '../../../src/types/scalar/float';
import { uniform } from '../../../src/variables/uniform';
import { varying } from '../../../src/variables/varying';
import { exp } from '../../../src/math/exponential/exp';
import { max } from '../../../src/math/common/max';
import { vec3 } from '../../../src/types/vector/vec3';

describe('Float', () =>
{
    describe('构造函数', () =>
    {
        it('应该能够创建 Float 实例', () =>
        {
            const f = float(1.0);
            expect(f).toBeInstanceOf(Float);
        });

        it('应该正确存储值', () =>
        {
            const f = float(1.5);
            expect(f.toGLSL()).toBe('1.5');
            expect(f.toWGSL()).toBe('1.5');
        });
    });

    describe('uniform(name, float())', () =>
    {
        it('应该返回 Float 实例', () =>
        {
            const result = uniform('uValue', float(), 0, 0);
            expect(result).toBeInstanceOf(Float);
            expect(result.toGLSL()).toBe('uValue');
            expect(result.toWGSL()).toBe('uValue');
        });
    });

    describe('varying(name, float())', () =>
    {
        it('应该返回 Float 实例', () =>
        {
            const result = varying('vValue', float(), { location: 0 });
            expect(result).toBeInstanceOf(Float);
            expect(result.toGLSL()).toBe('vValue');
            // WGSL 输出由 vertex/fragment 着色器设置
        });
    });

    describe('运算', () =>
    {
        it('应该支持加法运算', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const result = a.add(b);
            expect(result.toGLSL()).toBe('1.0 + 2.0');
            expect(result.toWGSL()).toBe('1.0 + 2.0');
        });

        it('应该支持减法运算', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const result = a.subtract(b);
            expect(result.toGLSL()).toBe('1.0 - 2.0');
            expect(result.toWGSL()).toBe('1.0 - 2.0');
        });

        it('应该支持乘法运算', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const result = a.multiply(b);
            expect(result.toGLSL()).toBe('1.0 * 2.0');
            expect(result.toWGSL()).toBe('1.0 * 2.0');
        });

        it('应该支持除法运算', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const result = a.divide(b);
            expect(result.toGLSL()).toBe('1.0 / 2.0');
            expect(result.toWGSL()).toBe('1.0 / 2.0');
        });

        it('应该支持数字字面量运算', () =>
        {
            const a = float(1.0);
            const result = a.multiply(2.0);
            expect(result.toGLSL()).toBe('1.0 * 2.0');
            expect(result.toWGSL()).toBe('1.0 * 2.0');
        });

        it('运算时应该正确生成括号', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const c = float(3.0);

            // (a + b) * c 应该生成括号
            const add = a.add(b);
            const mul = add.multiply(c);
            expect(mul.toGLSL()).toBe('(1.0 + 2.0) * 3.0');
            expect(mul.toWGSL()).toBe('(1.0 + 2.0) * 3.0');

            // a + b * c 不需要括号（乘除优先级更高）
            const mul2 = b.multiply(c);
            const add2 = a.add(mul2);
            expect(add2.toGLSL()).toBe('1.0 + 2.0 * 3.0');
            expect(add2.toWGSL()).toBe('1.0 + 2.0 * 3.0');

            // a / (b + c) 应该生成括号
            const add3 = b.add(c);
            const div = a.divide(add3);
            expect(div.toGLSL()).toBe('1.0 / (2.0 + 3.0)');
            expect(div.toWGSL()).toBe('1.0 / (2.0 + 3.0)');
        });

        it('应该优化 -1.0 * x 为 -x', () =>
        {
            const negOne = float(-1.0);
            const x = float(2.0);

            // -1.0 * x 应该优化为 -x
            const result = negOne.multiply(x);
            expect(result.toGLSL()).toBe('-2.0');
            expect(result.toWGSL()).toBe('-2.0');

            // -1.0 * (a + b) 应该优化为 -(a + b)
            const a = float(1.0);
            const b = float(2.0);
            const add = a.add(b);
            const result2 = negOne.multiply(add);
            expect(result2.toGLSL()).toBe('-(1.0 + 2.0)');
            expect(result2.toWGSL()).toBe('-(1.0 + 2.0)');
        });

        it('应该正确处理科学计数法并优化同级乘法', () =>
        {
            const a = float(0.2);
            const turbidity = uniform('turbidity', float(), 0, 0);
            const b = float(10E-18);
            // 0.2 * turbidity * 1e-17 应该生成 0.2 * turbidity * 1e-17（同级乘法不需要括号）
            const mul1 = a.multiply(turbidity);
            const mul2 = mul1.multiply(b);
            expect(mul2.toGLSL()).toBe('0.2 * turbidity * 1e-17');
            expect(mul2.toWGSL()).toBe('0.2 * turbidity * 1e-17');
        });

        it('应该正确处理 -1.0 * (a - b) / c 优化为 -((a - b) / c)', () =>
        {
            const cutoffAngle = uniform('cutoffAngle', float(), 0, 0);
            const acosClamped = uniform('acosClamped', float(), 0, 1);
            const steepness = uniform('steepness', float(), 0, 2);
            // float(-1.0).multiply(cutoffAngle.subtract(acosClamped).divide(steepness))
            // 应该生成 -((cutoffAngle - acosClamped) / steepness)
            const sub = cutoffAngle.subtract(acosClamped);
            const div = sub.divide(steepness);
            const negMul = float(-1.0).multiply(div);
            expect(negMul.toGLSL()).toBe('-((cutoffAngle - acosClamped) / steepness)');
            expect(negMul.toWGSL()).toBe('-((cutoffAngle - acosClamped) / steepness)');
        });

        it('应该正确处理完整的复杂表达式', () =>
        {
            // 模拟 assign(vSunE, EE.multiply(max(0.0, float(1.0).subtract(exp(float(-1.0).multiply(cutoffAngle.subtract(acosClamped).divide(steepness)))))));
            // 应该生成: EE * max(0.0, 1.0 - exp(-((cutoffAngle - acosClamped) / steepness)))
            const EE = uniform('EE', float(), 0, 0);
            const cutoffAngle = uniform('cutoffAngle', float(), 0, 1);
            const acosClamped = uniform('acosClamped', float(), 0, 2);
            const steepness = uniform('steepness', float(), 0, 3);

            const sub = cutoffAngle.subtract(acosClamped);
            const div = sub.divide(steepness);
            const negMul = float(-1.0).multiply(div);
            const expResult = exp(negMul);
            const subtract = float(1.0).subtract(expResult);
            const maxResult = max(0.0, subtract);
            const final = EE.multiply(maxResult);

            expect(final.toGLSL()).toBe('EE * max(0.0, 1.0 - exp(-((cutoffAngle - acosClamped) / steepness)))');
            expect(final.toWGSL()).toBe('EE * max(0.0, 1.0 - exp(-((cutoffAngle - acosClamped) / steepness)))');
        });

        it('应该正确处理 float(-1.0).multiply(Vec3) 优化为 -Vec3', () =>
        {
            const vBetaR = uniform('vBetaR', vec3(), 0, 0);
            const sR = uniform('sR', float(), 0, 1);
            const vBetaM = uniform('vBetaM', vec3(), 0, 2);
            const sM = uniform('sM', float(), 0, 3);

            // float(-1.0).multiply(vBetaR.multiply(sR).add(vBetaM.multiply(sM)))
            // 应该生成 -(vBetaR * sR + vBetaM * sM)
            const mul1 = vBetaR.multiply(sR);
            const mul2 = vBetaM.multiply(sM);
            const add = mul1.add(mul2);
            const negMul = float(-1.0).multiply(add);
            expect(negMul.toGLSL()).toBe('-(vBetaR * sR + vBetaM * sM)');
            expect(negMul.toWGSL()).toBe('-(vBetaR * sR + vBetaM * sM)');
        });

        it('应该支持取模运算', () =>
        {
            const a = float(10.5);
            const b = float(3.0);
            const result = a.mod(b);
            expect(result.toGLSL()).toBe('10.5 % 3.0');
            expect(result.toWGSL()).toBe('10.5 % 3.0');
        });

        it('应该能够处理混合参数', () =>
        {
            const a = float(10.5);
            const b = 3.0;
            const result = a.mod(b);
            expect(result.toGLSL()).toBe('10.5 % 3.0');
            expect(result.toWGSL()).toBe('10.5 % 3.0');
        });
    });

    describe('Float.equals 方法', () =>
    {
        it('应该能够比较两个 Float 值', () =>
        {
            const f1 = float(1.0);
            const f2 = float(2.0);
            const result = f1.equals(f2);

            expect(result.toGLSL()).toBe('1.0 == 2.0');
            expect(result.toWGSL()).toBe('1.0 == 2.0');
            expect(result.glslType).toBe('bool');
            expect(result.wgslType).toBe('bool');
        });

        it('应该能够比较 Float 值和数字字面量', () =>
        {
            const f = float(1.0);
            const result = f.equals(1.0);

            expect(result.toGLSL()).toBe('1.0 == 1.0');
            expect(result.toWGSL()).toBe('1.0 == 1.0');
            expect(result.glslType).toBe('bool');
            expect(result.wgslType).toBe('bool');
        });
    });
});

