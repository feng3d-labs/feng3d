import { describe, expect, it } from 'vitest';
import { cos } from '../../../src/math/trigonometric/cos';
import { float } from '../../../src/types/scalar/float';

describe('cos', () =>
{
    describe('number 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const result = cos(0.5);

            expect(result.toGLSL()).toBe('cos(0.5)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const result = cos(0.5);

            expect(result.toWGSL()).toBe('cos(0.5)');
        });

        it('依赖应该为空', () =>
        {
            const result = cos(0.5);

            expect(result.dependencies).toEqual([]);
        });
    });

    describe('Float 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const x = float(0.5);
            const result = cos(x);

            expect(result.toGLSL()).toBe('cos(0.5)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const x = float(0.5);
            const result = cos(x);

            expect(result.toWGSL()).toBe('cos(0.5)');
        });

        it('应该正确跟踪依赖', () =>
        {
            const x = float(0.5);
            const result = cos(x);

            expect(result.dependencies).toContain(x);
        });
    });
});

