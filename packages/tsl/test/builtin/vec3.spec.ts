import { describe, expect, it } from 'vitest';
import { Attribute } from '../../src/variables/attribute';
import { float } from '../../src/types/scalar/float';
import { vec3, Vec3 } from '../../src/types/vector/vec3';
import { Uniform } from '../../src/variables/uniform';

describe('vec3', () =>
{
    describe('vec3()', () =>
    {
        it('应该返回 Vec3 实例', () =>
        {
            const result = vec3();
            expect(result).toBeInstanceOf(Vec3);
        });
    });

    describe('vec3(uniform: Uniform)', () =>
    {
        it('应该返回 Vec3 实例', () =>
        {
            const uniform = new Uniform('uPosition', 0, 0);
            const result = vec3(uniform);
            expect(result).toBeInstanceOf(Vec3);
        });

        it('应该将 Vec3 实例保存到 uniform.value', () =>
        {
            const uniform = new Uniform('uPosition', 0, 0);
            const vec3Instance = vec3(uniform);
            expect(uniform.value).toBe(vec3Instance);
        });

        it('应该正确设置 toGLSL 和 toWGSL 方法', () =>
        {
            const uniform = new Uniform('uPosition', 0, 0);
            const result = vec3(uniform);
            expect(result.toGLSL()).toBe('uPosition');
            expect(result.toWGSL()).toBe('uPosition');
        });

        it('应该设置正确的 dependencies', () =>
        {
            const uniform = new Uniform('uPosition', 0, 0);
            const result = vec3(uniform);
            expect(result.dependencies).toEqual([uniform]);
        });
    });

    describe('vec3(attribute: Attribute)', () =>
    {
        it('应该返回 Vec3 实例', () =>
        {
            const attribute = new Attribute('aPosition', 0);
            const result = vec3(attribute);
            expect(result).toBeInstanceOf(Vec3);
        });

        it('应该将 Vec3 实例保存到 attribute.value', () =>
        {
            const attribute = new Attribute('aPosition', 0);
            const vec3Instance = vec3(attribute);
            expect(attribute.value).toBe(vec3Instance);
        });

        it('应该正确设置 toGLSL 和 toWGSL 方法', () =>
        {
            const attribute = new Attribute('aPosition', 0);
            const result = vec3(attribute);
            expect(result.toGLSL()).toBe('aPosition');
            expect(result.toWGSL()).toBe('aPosition');
        });

        it('应该设置正确的 dependencies', () =>
        {
            const attribute = new Attribute('aPosition', 0);
            const result = vec3(attribute);
            expect(result.dependencies).toEqual([attribute]);
        });
    });

    describe('vec3(x: number, y: number, z: number)', () =>
    {
        it('应该处理三个数字参数并返回 Vec3 实例', () =>
        {
            const result = vec3(1.0, 2.0, 3.0);
            expect(result).toBeInstanceOf(Vec3);
        });

        it('应该正确设置 toGLSL 方法', () =>
        {
            const result = vec3(1.0, 2.0, 3.0);
            expect(result.toGLSL()).toBe('vec3(1.0, 2.0, 3.0)');
        });

        it('应该正确设置 toWGSL 方法', () =>
        {
            const result = vec3(1.0, 2.0, 3.0);
            expect(result.toWGSL()).toBe('vec3<f32>(1.0, 2.0, 3.0)');
        });

        it('应该设置空的 dependencies', () =>
        {
            const result = vec3(1.0, 2.0, 3.0);
            expect(result.dependencies).toEqual([]);
        });
    });

    describe('无效参数', () =>
    {
        it('应该拒绝两个参数', () =>
        {
            // @ts-expect-error 故意只传两个参数，验证运行时的参数个数校验
            expect(() => vec3(1.0, 2.0)).toThrow('Invalid arguments for vec3');
        });

        it('应该拒绝四个参数', () =>
        {
            // @ts-expect-error 故意传四个参数，验证运行时的参数个数校验
            expect(() => vec3(1.0, 2.0, 3.0, 4.0)).toThrow('Invalid arguments for vec3');
        });

        it('应该拒绝非数字、非Uniform、非Attribute类型的参数', () =>
        {
            expect(() => vec3('x' as any, 'y' as any, 'z' as any)).toThrow('Invalid arguments for vec3');
        });
    });

    describe('Vec3 类属性', () =>
    {
        it('应该具有正确的 glslType', () =>
        {
            const result = vec3();
            expect(result.glslType).toBe('vec3');
        });

        it('应该具有正确的 wgslType', () =>
        {
            const result = vec3();
            expect(result.wgslType).toBe('vec3<f32>');
        });
    });

    describe('运算', () =>
    {
        it('应该支持加法运算', () =>
        {
            const a = vec3(1.0, 2.0, 3.0);
            const b = vec3(4.0, 5.0, 6.0);
            const result = a.add(b);
            expect(result.toGLSL()).toBe('vec3(1.0, 2.0, 3.0) + vec3(4.0, 5.0, 6.0)');
            expect(result.toWGSL()).toBe('vec3<f32>(1.0, 2.0, 3.0) + vec3<f32>(4.0, 5.0, 6.0)');
        });

        it('应该支持减法运算', () =>
        {
            const a = vec3(1.0, 2.0, 3.0);
            const b = vec3(4.0, 5.0, 6.0);
            const result = a.subtract(b);
            expect(result.toGLSL()).toBe('vec3(1.0, 2.0, 3.0) - vec3(4.0, 5.0, 6.0)');
            expect(result.toWGSL()).toBe('vec3<f32>(1.0, 2.0, 3.0) - vec3<f32>(4.0, 5.0, 6.0)');
        });

        it('应该支持乘法运算', () =>
        {
            const a = vec3(1.0, 2.0, 3.0);
            const b = float(2.0);
            const result = a.multiply(b);
            expect(result.toGLSL()).toBe('vec3(1.0, 2.0, 3.0) * 2.0');
            expect(result.toWGSL()).toBe('vec3<f32>(1.0, 2.0, 3.0) * 2.0');
        });

        it('应该支持除法运算', () =>
        {
            const a = vec3(1.0, 2.0, 3.0);
            const b = float(2.0);
            const result = a.divide(b);
            expect(result.toGLSL()).toBe('vec3(1.0, 2.0, 3.0) / 2.0');
            expect(result.toWGSL()).toBe('vec3<f32>(1.0, 2.0, 3.0) / 2.0');
        });

        it('运算时应该正确生成括号', () =>
        {
            const a = vec3(1.0, 2.0, 3.0);
            const b = vec3(4.0, 5.0, 6.0);
            const c = float(2.0);

            // (a + b) * c 应该生成括号
            const add = a.add(b);
            const mul = add.multiply(c);
            expect(mul.toGLSL()).toBe('(vec3(1.0, 2.0, 3.0) + vec3(4.0, 5.0, 6.0)) * 2.0');
            expect(mul.toWGSL()).toBe('(vec3<f32>(1.0, 2.0, 3.0) + vec3<f32>(4.0, 5.0, 6.0)) * 2.0');

            // a + b * c 不需要括号（乘除优先级更高）
            const mul2 = b.multiply(c);
            const add2 = a.add(mul2);
            expect(add2.toGLSL()).toBe('vec3(1.0, 2.0, 3.0) + vec3(4.0, 5.0, 6.0) * 2.0');
            expect(add2.toWGSL()).toBe('vec3<f32>(1.0, 2.0, 3.0) + vec3<f32>(4.0, 5.0, 6.0) * 2.0');
        });
    });
});

