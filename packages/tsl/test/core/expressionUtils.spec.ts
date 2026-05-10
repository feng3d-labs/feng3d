import { describe, expect, it } from 'vitest';
import { float, Float } from '../../src/types/scalar/float';
import { vec2, Vec2 } from '../../src/types/vector/vec2';
import { vec3, Vec3 } from '../../src/types/vector/vec3';
import { vec4, Vec4 } from '../../src/types/vector/vec4';
import { Uniform } from '../../src/variables/uniform';

describe('表达式括号生成', () =>
{
    describe('Float 运算', () =>
    {
        it('加减运算时，乘除表达式不需要括号（优先级更高）', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const c = float(3.0);

            // a + b * c 应该生成 a + b * c（乘除优先级更高，不需要括号）
            const mul = b.multiply(c);
            const add = a.add(mul);
            expect(add.toGLSL()).toBe('1.0 + 2.0 * 3.0');
            expect(add.toWGSL()).toBe('1.0 + 2.0 * 3.0');

            // a - b * c 应该生成 a - b * c（乘除优先级更高，不需要括号）
            const sub = a.subtract(mul);
            expect(sub.toGLSL()).toBe('1.0 - 2.0 * 3.0');
            expect(sub.toWGSL()).toBe('1.0 - 2.0 * 3.0');
        });

        it('乘除运算时，加减表达式应该加括号', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const c = float(3.0);

            // (a + b) * c 应该生成 (1.0 + 2.0) * 3.0
            const add = a.add(b);
            const mul = add.multiply(c);
            expect(mul.toGLSL()).toBe('(1.0 + 2.0) * 3.0');
            expect(mul.toWGSL()).toBe('(1.0 + 2.0) * 3.0');

            // (a - b) * c 应该生成 (1.0 - 2.0) * 3.0
            const sub = a.subtract(b);
            const mul2 = sub.multiply(c);
            expect(mul2.toGLSL()).toBe('(1.0 - 2.0) * 3.0');
            expect(mul2.toWGSL()).toBe('(1.0 - 2.0) * 3.0');
        });

        it('除法时，右操作数应该加括号', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const c = float(3.0);

            // a / (b + c) 应该生成 1.0 / (2.0 + 3.0)
            const add = b.add(c);
            const div = a.divide(add);
            expect(div.toGLSL()).toBe('1.0 / (2.0 + 3.0)');
            expect(div.toWGSL()).toBe('1.0 / (2.0 + 3.0)');

            // a / (b * c) 应该生成 1.0 / (2.0 * 3.0)
            const mul = b.multiply(c);
            const div2 = a.divide(mul);
            expect(div2.toGLSL()).toBe('1.0 / (2.0 * 3.0)');
            expect(div2.toWGSL()).toBe('1.0 / (2.0 * 3.0)');
        });

        it('简单表达式不需要括号', () =>
        {
            const a = float(1.0);
            const b = float(2.0);

            // a + b 不需要括号
            const add = a.add(b);
            expect(add.toGLSL()).toBe('1.0 + 2.0');
            expect(add.toWGSL()).toBe('1.0 + 2.0');

            // a * b 不需要括号
            const mul = a.multiply(b);
            expect(mul.toGLSL()).toBe('1.0 * 2.0');
            expect(mul.toWGSL()).toBe('1.0 * 2.0');
        });
    });

    describe('Vec2 运算', () =>
    {
        it('加减运算时，乘除表达式不需要括号（优先级更高）', () =>
        {
            const a = vec2(1.0, 2.0);
            const b = vec2(3.0, 4.0);
            const c = float(2.0);

            // a + b * c 应该生成 a + b * c（乘除优先级更高，不需要括号）
            const mul = b.multiply(c);
            const add = a.add(mul);
            expect(add.toGLSL()).toBe('vec2(1.0, 2.0) + vec2(3.0, 4.0) * 2.0');
            expect(add.toWGSL()).toBe('vec2<f32>(1.0, 2.0) + vec2<f32>(3.0, 4.0) * 2.0');
        });

        it('乘除运算时，加减表达式应该加括号', () =>
        {
            const a = vec2(1.0, 2.0);
            const b = vec2(3.0, 4.0);
            const c = float(2.0);

            // (a + b) * c 应该生成 (a + b) * c
            const add = a.add(b);
            const mul = add.multiply(c);
            expect(mul.toGLSL()).toBe('(vec2(1.0, 2.0) + vec2(3.0, 4.0)) * 2.0');
            expect(mul.toWGSL()).toBe('(vec2<f32>(1.0, 2.0) + vec2<f32>(3.0, 4.0)) * 2.0');
        });
    });

    describe('Vec3 运算', () =>
    {
        it('加减运算时，乘除表达式不需要括号（优先级更高）', () =>
        {
            const a = vec3(1.0, 2.0, 3.0);
            const b = vec3(4.0, 5.0, 6.0);
            const c = float(2.0);

            // a + b * c 应该生成 a + b * c（乘除优先级更高，不需要括号）
            const mul = b.multiply(c);
            const add = a.add(mul);
            expect(add.toGLSL()).toBe('vec3(1.0, 2.0, 3.0) + vec3(4.0, 5.0, 6.0) * 2.0');
            expect(add.toWGSL()).toBe('vec3<f32>(1.0, 2.0, 3.0) + vec3<f32>(4.0, 5.0, 6.0) * 2.0');
        });

        it('乘除运算时，加减表达式应该加括号', () =>
        {
            const a = vec3(1.0, 2.0, 3.0);
            const b = vec3(4.0, 5.0, 6.0);
            const c = float(2.0);

            // (a + b) * c 应该生成 (a + b) * c
            const add = a.add(b);
            const mul = add.multiply(c);
            expect(mul.toGLSL()).toBe('(vec3(1.0, 2.0, 3.0) + vec3(4.0, 5.0, 6.0)) * 2.0');
            expect(mul.toWGSL()).toBe('(vec3<f32>(1.0, 2.0, 3.0) + vec3<f32>(4.0, 5.0, 6.0)) * 2.0');
        });
    });

    describe('Vec4 运算', () =>
    {
        it('加减运算时，乘除表达式不需要括号（优先级更高）', () =>
        {
            const a = vec4(1.0, 2.0, 3.0, 4.0);
            const b = vec4(5.0, 6.0, 7.0, 8.0);
            const c = float(2.0);

            // a + b * c 应该生成 a + b * c（乘除优先级更高，不需要括号）
            const mul = b.multiply(c);
            const add = a.add(mul);
            expect(add.toGLSL()).toBe('vec4(1.0, 2.0, 3.0, 4.0) + vec4(5.0, 6.0, 7.0, 8.0) * 2.0');
            expect(add.toWGSL()).toBe('vec4<f32>(1.0, 2.0, 3.0, 4.0) + vec4<f32>(5.0, 6.0, 7.0, 8.0) * 2.0');
        });

        it('乘除运算时，加减表达式应该加括号', () =>
        {
            const a = vec4(1.0, 2.0, 3.0, 4.0);
            const b = vec4(5.0, 6.0, 7.0, 8.0);
            const c = float(2.0);

            // (a + b) * c 应该生成 (a + b) * c
            const add = a.add(b);
            const mul = add.multiply(c);
            expect(mul.toGLSL()).toBe('(vec4(1.0, 2.0, 3.0, 4.0) + vec4(5.0, 6.0, 7.0, 8.0)) * 2.0');
            expect(mul.toWGSL()).toBe('(vec4<f32>(1.0, 2.0, 3.0, 4.0) + vec4<f32>(5.0, 6.0, 7.0, 8.0)) * 2.0');
        });
    });

    describe('复杂表达式', () =>
    {
        it('应该正确处理多层嵌套表达式', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const c = float(3.0);
            const d = float(4.0);

            // a + b * c + d 应该生成 1.0 + 2.0 * 3.0 + 4.0（乘除优先级更高，同级运算符不需要括号）
            const mul = b.multiply(c);
            const add1 = a.add(mul);
            const add2 = add1.add(d);
            expect(add2.toGLSL()).toBe('1.0 + 2.0 * 3.0 + 4.0');
            expect(add2.toWGSL()).toBe('1.0 + 2.0 * 3.0 + 4.0');
        });

        it('应该正确处理除法中的复杂表达式', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const c = float(3.0);
            const d = float(4.0);

            // a / (b + c * d) 应该生成 1.0 / (2.0 + 3.0 * 4.0)（乘除优先级更高，不需要括号）
            const mul = c.multiply(d);
            const add = b.add(mul);
            const div = a.divide(add);
            expect(div.toGLSL()).toBe('1.0 / (2.0 + 3.0 * 4.0)');
            expect(div.toWGSL()).toBe('1.0 / (2.0 + 3.0 * 4.0)');
        });

        it('同级运算符应该省略括号', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const c = float(3.0);

            // a + b + c 应该生成 1.0 + 2.0 + 3.0（不需要括号）
            const add1 = a.add(b);
            const add2 = add1.add(c);
            expect(add2.toGLSL()).toBe('1.0 + 2.0 + 3.0');
            expect(add2.toWGSL()).toBe('1.0 + 2.0 + 3.0');

            // a * b * c 应该生成 1.0 * 2.0 * 3.0（不需要括号）
            const mul1 = a.multiply(b);
            const mul2 = mul1.multiply(c);
            expect(mul2.toGLSL()).toBe('1.0 * 2.0 * 3.0');
            expect(mul2.toWGSL()).toBe('1.0 * 2.0 * 3.0');
        });

        it('减法右操作数需要括号', () =>
        {
            const a = float(1.0);
            const b = float(2.0);
            const c = float(3.0);

            // a - (b + c) 应该生成 1.0 - (2.0 + 3.0)
            const add = b.add(c);
            const sub = a.subtract(add);
            expect(sub.toGLSL()).toBe('1.0 - (2.0 + 3.0)');
            expect(sub.toWGSL()).toBe('1.0 - (2.0 + 3.0)');
        });
    });
});

