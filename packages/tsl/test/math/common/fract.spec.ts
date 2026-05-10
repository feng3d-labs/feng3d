import { describe, expect, it } from 'vitest';
import { fract } from '../../../src/math/common/fract';
import { float } from '../../../src/types/scalar/float';
import { vec2 } from '../../../src/types/vector/vec2';

describe('fract', () =>
{
    describe('number 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const result = fract(1.5);

            expect(result.toGLSL()).toBe('fract(1.5)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const result = fract(1.5);

            expect(result.toWGSL()).toBe('fract(1.5)');
        });

        it('依赖应该为空', () =>
        {
            const result = fract(1.5);

            expect(result.dependencies).toEqual([]);
        });
    });

    describe('Float 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const x = float(1.5);
            const result = fract(x);

            expect(result.toGLSL()).toBe('fract(1.5)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const x = float(1.5);
            const result = fract(x);

            expect(result.toWGSL()).toBe('fract(1.5)');
        });

        it('应该正确跟踪依赖', () =>
        {
            const x = float(1.5);
            const result = fract(x);

            expect(result.dependencies).toContain(x);
        });
    });

    describe('Vec2 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const v = vec2(1.5, 2.5);
            const result = fract(v);

            expect(result.toGLSL()).toBe('fract(vec2(1.5, 2.5))');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const v = vec2(1.5, 2.5);
            const result = fract(v);

            expect(result.toWGSL()).toBe('fract(vec2<f32>(1.5, 2.5))');
        });

        it('应该正确跟踪依赖', () =>
        {
            const v = vec2(1.5, 2.5);
            const result = fract(v);

            expect(result.dependencies).toContain(v);
        });
    });
});

