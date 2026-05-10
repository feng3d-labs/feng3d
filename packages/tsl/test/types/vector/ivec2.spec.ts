import { describe, expect, it } from 'vitest';
import { ivec2, IVec2 } from '../../../src/types/vector/ivec2';
import { vec2 } from '../../../src/types/vector/vec2';

describe('IVec2', () =>
{
    describe('构造函数', () =>
    {
        it('空构造函数应该返回未初始化的 IVec2', () =>
        {
            const v = ivec2();

            expect(v).toBeInstanceOf(IVec2);
            expect(v.glslType).toBe('ivec2');
            expect(v.wgslType).toBe('vec2<i32>');
        });

        it('应该支持从两个数字构造', () =>
        {
            const v = ivec2(1, 2);

            expect(v.toGLSL()).toBe('ivec2(1, 2)');
            expect(v.toWGSL()).toBe('vec2<i32>(1, 2)');
            expect(v.dependencies).toEqual([]);
        });

        it('应该支持从 Vec2 转换', () =>
        {
            const v2 = vec2(1.5, 2.5);
            const iv = ivec2(v2);

            expect(iv.toGLSL()).toBe('ivec2(vec2(1.5, 2.5))');
            expect(iv.toWGSL()).toBe('vec2<i32>(vec2<f32>(1.5, 2.5))');
            expect(iv.dependencies).toContain(v2);
        });
    });

    describe('分量访问', () =>
    {
        it('应该能够访问 x 分量', () =>
        {
            const v = ivec2(1, 2);
            const x = v.x;

            expect(x.toGLSL()).toBe('ivec2(1, 2).x');
            expect(x.toWGSL()).toBe('vec2<i32>(1, 2).x');
            expect(x.dependencies).toContain(v);
        });

        it('应该能够访问 y 分量', () =>
        {
            const v = ivec2(1, 2);
            const y = v.y;

            expect(y.toGLSL()).toBe('ivec2(1, 2).y');
            expect(y.toWGSL()).toBe('vec2<i32>(1, 2).y');
            expect(y.dependencies).toContain(v);
        });
    });

    describe('运算方法', () =>
    {
        it('add 应该正确相加两个 IVec2', () =>
        {
            const v1 = ivec2(1, 2);
            const v2 = ivec2(3, 4);
            const result = v1.add(v2);

            expect(result.toGLSL()).toBe('ivec2(1, 2) + ivec2(3, 4)');
            expect(result.toWGSL()).toBe('vec2<i32>(1, 2) + vec2<i32>(3, 4)');
            expect(result.dependencies).toContain(v1);
            expect(result.dependencies).toContain(v2);
        });

        it('subtract 应该正确相减两个 IVec2', () =>
        {
            const v1 = ivec2(3, 4);
            const v2 = ivec2(1, 2);
            const result = v1.subtract(v2);

            expect(result.toGLSL()).toBe('ivec2(3, 4) - ivec2(1, 2)');
            expect(result.toWGSL()).toBe('vec2<i32>(3, 4) - vec2<i32>(1, 2)');
            expect(result.dependencies).toContain(v1);
            expect(result.dependencies).toContain(v2);
        });

        it('subtract 应该支持标量减法', () =>
        {
            const v = ivec2(3, 4);
            const result = v.subtract(1);

            expect(result.toGLSL()).toBe('ivec2(3, 4) - 1');
            expect(result.toWGSL()).toBe('vec2<i32>(3, 4) - vec2<i32>(1)');
            expect(result.dependencies).toContain(v);
        });
    });
});
