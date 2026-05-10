import { describe, expect, it } from 'vitest';
import { float } from '../../../src/types/scalar/float';
import { vec2 } from '../../../src/types/vector/vec2';
import { vec4, Vec4 } from '../../../src/types/vector/vec4';
import { uniform } from '../../../src/variables/uniform';

describe('vec4', () =>
{
    describe('构造函数', () =>
    {
        it('应该能够创建 Vec4 实例', () =>
        {
            const v = vec4(1.0, 2.0, 3.0, 4.0);
            expect(v).toBeInstanceOf(Vec4);
            expect(v.toGLSL()).toBe('vec4(1.0, 2.0, 3.0, 4.0)');
            expect(v.toWGSL()).toBe('vec4<f32>(1.0, 2.0, 3.0, 4.0)');
        });
    });

    describe('vec4(xy: Vec2, z: number, w: number)', () =>
    {
        it('应该从 Vec2 字面量和两个数字创建 Vec4', () =>
        {
            const xy = vec2(1.0, 2.0);
            const result = vec4(xy, 3.0, 4.0);
            expect(result).toBeInstanceOf(Vec4);
            expect(result.toGLSL()).toBe('vec4(vec2(1.0, 2.0), 3.0, 4.0)');
            expect(result.toWGSL()).toBe('vec4<f32>(vec2<f32>(1.0, 2.0), 3.0, 4.0)');
        });

        it('应该从 Vec2 uniform 和两个数字创建 Vec4', () =>
        {
            const xy = uniform('uPosition', vec2(), 0, 0);
            const result = vec4(xy, 0.0, 1.0);
            expect(result).toBeInstanceOf(Vec4);
            expect(result.toGLSL()).toBe('vec4(uPosition, 0.0, 1.0)');
            expect(result.toWGSL()).toBe('vec4<f32>(uPosition, 0.0, 1.0)');
        });

    });

    describe('运算', () =>
    {
        it('应该支持加法运算', () =>
        {
            const a = vec4(1.0, 2.0, 3.0, 4.0);
            const b = vec4(5.0, 6.0, 7.0, 8.0);
            const result = a.add(b);
            expect(result.toGLSL()).toBe('vec4(1.0, 2.0, 3.0, 4.0) + vec4(5.0, 6.0, 7.0, 8.0)');
            expect(result.toWGSL()).toBe('vec4<f32>(1.0, 2.0, 3.0, 4.0) + vec4<f32>(5.0, 6.0, 7.0, 8.0)');
        });

        it('应该支持减法运算', () =>
        {
            const a = vec4(1.0, 2.0, 3.0, 4.0);
            const b = vec4(5.0, 6.0, 7.0, 8.0);
            const result = a.subtract(b);
            expect(result.toGLSL()).toBe('vec4(1.0, 2.0, 3.0, 4.0) - vec4(5.0, 6.0, 7.0, 8.0)');
            expect(result.toWGSL()).toBe('vec4<f32>(1.0, 2.0, 3.0, 4.0) - vec4<f32>(5.0, 6.0, 7.0, 8.0)');
        });

        it('应该支持乘法运算', () =>
        {
            const a = vec4(1.0, 2.0, 3.0, 4.0);
            const b = float(2.0);
            const result = a.multiply(b);
            expect(result.toGLSL()).toBe('vec4(1.0, 2.0, 3.0, 4.0) * 2.0');
            expect(result.toWGSL()).toBe('vec4<f32>(1.0, 2.0, 3.0, 4.0) * 2.0');
        });

        it('应该支持除法运算', () =>
        {
            const a = vec4(1.0, 2.0, 3.0, 4.0);
            const b = float(2.0);
            const result = a.divide(b);
            expect(result.toGLSL()).toBe('vec4(1.0, 2.0, 3.0, 4.0) / 2.0');
            expect(result.toWGSL()).toBe('vec4<f32>(1.0, 2.0, 3.0, 4.0) / 2.0');
        });

        it('运算时应该正确生成括号', () =>
        {
            const a = vec4(1.0, 2.0, 3.0, 4.0);
            const b = vec4(5.0, 6.0, 7.0, 8.0);
            const c = float(2.0);

            // (a + b) * c 应该生成括号
            const add = a.add(b);
            const mul = add.multiply(c);
            expect(mul.toGLSL()).toBe('(vec4(1.0, 2.0, 3.0, 4.0) + vec4(5.0, 6.0, 7.0, 8.0)) * 2.0');
            expect(mul.toWGSL()).toBe('(vec4<f32>(1.0, 2.0, 3.0, 4.0) + vec4<f32>(5.0, 6.0, 7.0, 8.0)) * 2.0');

            // a + b * c 不需要括号（乘除优先级更高）
            const mul2 = b.multiply(c);
            const add2 = a.add(mul2);
            expect(add2.toGLSL()).toBe('vec4(1.0, 2.0, 3.0, 4.0) + vec4(5.0, 6.0, 7.0, 8.0) * 2.0');
            expect(add2.toWGSL()).toBe('vec4<f32>(1.0, 2.0, 3.0, 4.0) + vec4<f32>(5.0, 6.0, 7.0, 8.0) * 2.0');
        });
    });
});

