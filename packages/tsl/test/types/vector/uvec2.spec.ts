import { describe, expect, it } from 'vitest';
import { uvec2, Uvec2 } from '../../../src/types/vector/uvec2';

describe('Uvec2', () =>
{
    describe('构造函数', () =>
    {
        it('空构造函数应该返回未初始化的 Uvec2', () =>
        {
            const v = uvec2();

            expect(v).toBeInstanceOf(Uvec2);
            expect(v.glslType).toBe('uvec2');
            expect(v.wgslType).toBe('vec2<u32>');
        });

        it('应该支持从两个数字构造', () =>
        {
            const v = uvec2(1, 2);

            expect(v.toGLSL()).toBe('uvec2(1, 2)');
            expect(v.toWGSL()).toBe('vec2<u32>(1, 2)');
            expect(v.dependencies).toEqual([]);
        });
    });

    describe('分量访问', () =>
    {
        it('应该能够访问 x 分量', () =>
        {
            const v = uvec2(1, 2);
            const x = v.x;

            expect(x.toGLSL()).toBe('uvec2(1, 2).x');
            expect(x.toWGSL()).toBe('vec2<u32>(1, 2).x');
            expect(x.dependencies).toContain(v);
        });

        it('应该能够访问 y 分量', () =>
        {
            const v = uvec2(1, 2);
            const y = v.y;

            expect(y.toGLSL()).toBe('uvec2(1, 2).y');
            expect(y.toWGSL()).toBe('vec2<u32>(1, 2).y');
            expect(y.dependencies).toContain(v);
        });
    });
});
