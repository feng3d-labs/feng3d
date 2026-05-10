import { describe, expect, it } from 'vitest';
import { int, Int } from '../../../src/types/scalar/int';
import { uint } from '../../../src/types/scalar/uint';

describe('Int', () =>
{
    describe('构造函数', () =>
    {
        it('空构造函数应该返回未初始化的 Int', () =>
        {
            const i = int();

            expect(i).toBeInstanceOf(Int);
            expect(i.glslType).toBe('int');
            expect(i.wgslType).toBe('i32');
        });

        it('应该支持从数字构造', () =>
        {
            const i = int(42);

            expect(i.toGLSL()).toBe('42');
            expect(i.toWGSL()).toBe('42');
            expect(i.dependencies).toEqual([]);
        });

        it('应该将浮点数截断为整数', () =>
        {
            const i = int(3.7);

            expect(i.toGLSL()).toBe('3');
            expect(i.toWGSL()).toBe('3');
        });

        it('应该支持从 UInt 转换', () =>
        {
            const u = uint(10);
            const i = int(u);

            expect(i.toGLSL()).toBe('int(10u)');
            expect(i.toWGSL()).toBe('i32(10u)');
            expect(i.dependencies).toContain(u);
        });

        it('应该支持从 Int 复制', () =>
        {
            const i1 = int(5);
            const i2 = int(i1);

            expect(i2.toGLSL()).toBe('5');
            expect(i2.toWGSL()).toBe('5');
        });
    });

    describe('equals 方法', () =>
    {
        it('应该正确比较 Int 和 number', () =>
        {
            const i = int(5);
            const result = i.equals(5);

            expect(result.toGLSL()).toBe('(5 == 5)');
            expect(result.toWGSL()).toBe('(5 == 5)');
            expect(result.dependencies).toContain(i);
        });

        it('应该正确比较两个 Int', () =>
        {
            const i1 = int(5);
            const i2 = int(3);
            const result = i1.equals(i2);

            expect(result.toGLSL()).toBe('(5 == 3)');
            expect(result.toWGSL()).toBe('(5 == 3)');
            expect(result.dependencies).toContain(i1);
            expect(result.dependencies).toContain(i2);
        });
    });

    describe('mod 方法', () =>
    {
        it('应该正确计算 Int 和 number 的模', () =>
        {
            const i = int(10);
            const result = i.mod(3);

            expect(result.toGLSL()).toBe('10 % 3');
            expect(result.toWGSL()).toBe('10 % 3');
            expect(result.dependencies).toContain(i);
        });

        it('应该正确计算两个 Int 的模', () =>
        {
            const i1 = int(10);
            const i2 = int(3);
            const result = i1.mod(i2);

            expect(result.toGLSL()).toBe('10 % 3');
            expect(result.toWGSL()).toBe('10 % 3');
            expect(result.dependencies).toContain(i1);
            expect(result.dependencies).toContain(i2);
        });
    });

    describe('divide 方法', () =>
    {
        it('应该正确计算 Int 和 number 的除法', () =>
        {
            const i = int(10);
            const result = i.divide(3);

            expect(result.toGLSL()).toBe('10 / 3');
            expect(result.toWGSL()).toBe('10 / 3');
            expect(result.dependencies).toContain(i);
        });

        it('应该正确计算两个 Int 的除法', () =>
        {
            const i1 = int(10);
            const i2 = int(3);
            const result = i1.divide(i2);

            expect(result.toGLSL()).toBe('10 / 3');
            expect(result.toWGSL()).toBe('10 / 3');
            expect(result.dependencies).toContain(i1);
            expect(result.dependencies).toContain(i2);
        });
    });
});
