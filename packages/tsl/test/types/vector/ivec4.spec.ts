import { describe, expect, it } from 'vitest';
import { ivec4, IVec4 } from '../../../src/types/vector/ivec4';

describe('IVec4', () =>
{
    describe('构造函数', () =>
    {
        it('应该支持无参数构造', () =>
        {
            const v = ivec4();
            expect(v).toBeInstanceOf(IVec4);
        });

        it('应该支持从四个数字构造', () =>
        {
            const v = ivec4(1, 2, 3, 4);

            expect(v.toGLSL()).toBe('ivec4(1, 2, 3, 4)');
            expect(v.toWGSL()).toBe('vec4<i32>(1, 2, 3, 4)');
            expect(v.dependencies).toEqual([]);
        });
    });

    describe('类型属性', () =>
    {
        it('应该有正确的 glslType', () =>
        {
            const v = ivec4(1, 2, 3, 4);
            expect(v.glslType).toBe('ivec4');
        });

        it('应该有正确的 wgslType', () =>
        {
            const v = ivec4(1, 2, 3, 4);
            expect(v.wgslType).toBe('vec4<i32>');
        });
    });

    describe('分量访问', () =>
    {
        it('应该能访问 x 分量', () =>
        {
            const v = ivec4(1, 2, 3, 4);
            const x = v.x;

            expect(x.toGLSL()).toBe('ivec4(1, 2, 3, 4).x');
        });

        it('应该能访问 w 分量', () =>
        {
            const v = ivec4(1, 2, 3, 4);
            const w = v.w;

            expect(w.toGLSL()).toBe('ivec4(1, 2, 3, 4).w');
        });
    });
});

