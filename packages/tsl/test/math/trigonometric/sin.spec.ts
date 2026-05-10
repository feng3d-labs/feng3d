import { describe, expect, it } from 'vitest';
import { sin } from '../../../src/math/trigonometric/sin';
import { float } from '../../../src/types/scalar/float';

describe('sin', () =>
{
    describe('number 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const result = sin(0.5);

            expect(result.toGLSL()).toBe('sin(0.5)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const result = sin(0.5);

            expect(result.toWGSL()).toBe('sin(0.5)');
        });

        it('依赖应该为空', () =>
        {
            const result = sin(0.5);

            expect(result.dependencies).toEqual([]);
        });
    });

    describe('Float 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const x = float(0.5);
            const result = sin(x);

            expect(result.toGLSL()).toBe('sin(0.5)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const x = float(0.5);
            const result = sin(x);

            expect(result.toWGSL()).toBe('sin(0.5)');
        });

        it('应该正确跟踪依赖', () =>
        {
            const x = float(0.5);
            const result = sin(x);

            expect(result.dependencies).toContain(x);
        });
    });
});

