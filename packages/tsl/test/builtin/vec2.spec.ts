import { describe, expect, it } from 'vitest';
import { Attribute } from '../../src/variables/attribute';
import { float, Float } from '../../src/types/scalar/float';
import { vec2, Vec2 } from '../../src/types/vector/vec2';
import { Uniform } from '../../src/variables/uniform';

describe('Vec2', () =>
{
    describe('构造函数', () =>
    {
        it('应该能够创建 Vec2 实例', () =>
        {
            const v = vec2(1.0, 2.0);
            expect(v).toBeInstanceOf(Vec2);
        });

        it('应该正确存储 x 和 y 值', () =>
        {
            const v = vec2(1.5, 2.5);
            expect(v.x).toBeInstanceOf(Float);
            expect(v.y).toBeInstanceOf(Float);
            expect(v.x.toGLSL()).toBe('vec2(1.5, 2.5).x');
            expect(v.y.toGLSL()).toBe('vec2(1.5, 2.5).y');
        });
    });

    describe('getter', () =>
    {
        it('应该能够获取 x 分量', () =>
        {
            const v = new Vec2(10.0, 20.0);
            expect(v.x).toBeInstanceOf(Float);
            expect(v.x.toGLSL()).toBe('vec2(10.0, 20.0).x');
        });

        it('应该能够获取 y 分量', () =>
        {
            const v = new Vec2(10.0, 20.0);
            expect(v.y).toBeInstanceOf(Float);
            expect(v.y.toGLSL()).toBe('vec2(10.0, 20.0).y');
        });
    });

    describe('toGLSL', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const v = new Vec2(1.0, 2.0);
            expect(v.toGLSL()).toBe('vec2(1.0, 2.0)');
        });

        it('应该处理浮点数', () =>
        {
            const v = new Vec2(1.5, 2.5);
            expect(v.toGLSL()).toBe('vec2(1.5, 2.5)');
        });

        it('应该处理负数', () =>
        {
            const v = new Vec2(-1.0, -2.0);
            expect(v.toGLSL()).toBe('vec2(-1.0, -2.0)');
        });
    });

    describe('toWGSL', () =>
    {
        it('应该生成正确的 WGSL 代码', () =>
        {
            const v = new Vec2(1.0, 2.0);
            expect(v.toWGSL()).toBe('vec2<f32>(1.0, 2.0)');
        });

        it('应该处理浮点数', () =>
        {
            const v = new Vec2(1.5, 2.5);
            expect(v.toWGSL()).toBe('vec2<f32>(1.5, 2.5)');
        });

        it('应该处理负数', () =>
        {
            const v = new Vec2(-1.0, -2.0);
            expect(v.toWGSL()).toBe('vec2<f32>(-1.0, -2.0)');
        });
    });
});

describe('vec2', () =>
{
    describe('vec2(x: number, y: number)', () =>
    {
        it('应该返回 Vec2 实例', () =>
        {
            const result = vec2(1.0, 2.0);
            expect(result).toBeInstanceOf(Vec2);
        });

        it('应该正确创建 Vec2 实例', () =>
        {
            const result = vec2(1.5, 2.5);
            expect(result.x).toBeInstanceOf(Float);
            expect(result.y).toBeInstanceOf(Float);
            expect(result.x.toGLSL()).toBe('vec2(1.5, 2.5).x');
            expect(result.y.toGLSL()).toBe('vec2(1.5, 2.5).y');
        });

        it('应该能够转换为 GLSL', () =>
        {
            const result = vec2(1.0, 2.0);
            expect(result.toGLSL()).toBe('vec2(1.0, 2.0)');
        });

        it('应该能够转换为 WGSL', () =>
        {
            const result = vec2(1.0, 2.0);
            expect(result.toWGSL()).toBe('vec2<f32>(1.0, 2.0)');
        });
    });

    describe('vec2(uniform: Uniform)', () =>
    {
        it('应该返回 Vec2 实例', () =>
        {
            const uniform = new Uniform('uPosition', 0, 0);
            const result = vec2(uniform);
            expect(result).toBeInstanceOf(Vec2);
            expect(result.toGLSL()).toBe('uPosition');
            expect(result.toWGSL()).toBe('uPosition');
            expect(result.x.toGLSL()).toBe('uPosition.x');
            expect(result.y.toGLSL()).toBe('uPosition.y');
            expect(result.x.toWGSL()).toBe('uPosition.x');
            expect(result.y.toWGSL()).toBe('uPosition.y');
        });

        it('应该将类型信息保存到 uniform.value', () =>
        {
            const uniform = new Uniform('uPosition', 0, 0);
            vec2(uniform);
            expect(uniform.value).toBeDefined();
            expect(uniform.value?.glslType).toBe('vec2');
            expect(uniform.value?.wgslType).toBe('vec2<f32>');
        });
    });

    describe('vec2(attribute: Attribute)', () =>
    {
        it('应该返回 Vec2 实例', () =>
        {
            const attribute = new Attribute('aPosition', 0);
            const result = vec2(attribute);
            expect(result).toBeInstanceOf(Vec2);
            expect(result.toGLSL()).toBe('aPosition');
            expect(result.toWGSL()).toBe('aPosition');
            expect(result.x.toGLSL()).toBe('aPosition.x');
            expect(result.y.toGLSL()).toBe('aPosition.y');
            expect(result.x.toWGSL()).toBe('aPosition.x');
            expect(result.y.toWGSL()).toBe('aPosition.y');
        });

        it('应该将类型信息保存到 attribute.value', () =>
        {
            const attribute = new Attribute('aPosition', 0);
            vec2(attribute);
            expect(attribute.value).toBeDefined();
            expect(attribute.value?.glslType).toBe('vec2');
            expect(attribute.value?.wgslType).toBe('vec2<f32>');
        });
    });

    describe('其他参数组合', () =>
    {
        it('应该处理多个数字参数', () =>
        {
            // 注意：当前实现中，只有两个数字参数会返回 Vec2
            // 多个参数会抛出错误
            expect(() => (vec2 as any)(1.0, 2.0, 3.0)).toThrow();
        });

        it('应该处理字符串参数', () =>
        {
            // 字符串参数会抛出错误
            expect(() => (vec2 as any)('x', 'y')).toThrow('Vec2 构造函数：无效的参数');
        });

        it('应该处理混合参数', () =>
        {
            // 混合参数会抛出错误
            expect(() => (vec2 as any)(1.0, 'y')).toThrow('Vec2 构造函数：无效的参数');
        });
    });

    describe('运算', () =>
    {
        it('应该支持加法运算', () =>
        {
            const a = vec2(1.0, 2.0);
            const b = vec2(3.0, 4.0);
            const result = a.add(b);
            expect(result.toGLSL()).toBe('vec2(1.0, 2.0) + vec2(3.0, 4.0)');
            expect(result.toWGSL()).toBe('vec2<f32>(1.0, 2.0) + vec2<f32>(3.0, 4.0)');
        });

        it('应该支持减法运算', () =>
        {
            const a = vec2(1.0, 2.0);
            const b = vec2(3.0, 4.0);
            const result = a.subtract(b);
            expect(result.toGLSL()).toBe('vec2(1.0, 2.0) - vec2(3.0, 4.0)');
            expect(result.toWGSL()).toBe('vec2<f32>(1.0, 2.0) - vec2<f32>(3.0, 4.0)');
        });

        it('应该支持乘法运算', () =>
        {
            const a = vec2(1.0, 2.0);
            const b = float(2.0);
            const result = a.multiply(b);
            expect(result.toGLSL()).toBe('vec2(1.0, 2.0) * 2.0');
            expect(result.toWGSL()).toBe('vec2<f32>(1.0, 2.0) * 2.0');
        });

        it('应该支持除法运算', () =>
        {
            const a = vec2(1.0, 2.0);
            const b = float(2.0);
            const result = a.divide(b);
            expect(result.toGLSL()).toBe('vec2(1.0, 2.0) / 2.0');
            expect(result.toWGSL()).toBe('vec2<f32>(1.0, 2.0) / 2.0');
        });

        it('运算时应该正确生成括号', () =>
        {
            const a = vec2(1.0, 2.0);
            const b = vec2(3.0, 4.0);
            const c = float(2.0);

            // (a + b) * c 应该生成括号
            const add = a.add(b);
            const mul = add.multiply(c);
            expect(mul.toGLSL()).toBe('(vec2(1.0, 2.0) + vec2(3.0, 4.0)) * 2.0');
            expect(mul.toWGSL()).toBe('(vec2<f32>(1.0, 2.0) + vec2<f32>(3.0, 4.0)) * 2.0');

            // a + b * c 不需要括号（乘除优先级更高）
            const mul2 = b.multiply(c);
            const add2 = a.add(mul2);
            expect(add2.toGLSL()).toBe('vec2(1.0, 2.0) + vec2(3.0, 4.0) * 2.0');
            expect(add2.toWGSL()).toBe('vec2<f32>(1.0, 2.0) + vec2<f32>(3.0, 4.0) * 2.0');
        });
    });
});

