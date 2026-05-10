import { describe, expect, it } from 'vitest';
import { exp } from '../../../src/math/exponential/exp';
import { float } from '../../../src/types/scalar/float';
import { vec3 } from '../../../src/types/vector/vec3';
import { vec4 } from '../../../src/types/vector/vec4';

describe('exp', () =>
{
    describe('number 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const result = exp(1.0);

            expect(result.toGLSL()).toBe('exp(1)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const result = exp(1.0);

            expect(result.toWGSL()).toBe('exp(1)');
        });

        it('依赖应该为空', () =>
        {
            const result = exp(1.0);

            expect(result.dependencies).toEqual([]);
        });
    });

    describe('Float 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const x = float(1.0);
            const result = exp(x);

            expect(result.toGLSL()).toBe('exp(1.0)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const x = float(1.0);
            const result = exp(x);

            expect(result.toWGSL()).toBe('exp(1.0)');
        });

        it('应该正确跟踪依赖', () =>
        {
            const x = float(1.0);
            const result = exp(x);

            expect(result.dependencies).toContain(x);
        });
    });

    describe('Vec3 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const v = vec3(1.0, 2.0, 3.0);
            const result = exp(v);

            expect(result.toGLSL()).toBe('exp(vec3(1.0, 2.0, 3.0))');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const v = vec3(1.0, 2.0, 3.0);
            const result = exp(v);

            expect(result.toWGSL()).toBe('exp(vec3<f32>(1.0, 2.0, 3.0))');
        });

        it('应该正确跟踪依赖', () =>
        {
            const v = vec3(1.0, 2.0, 3.0);
            const result = exp(v);

            expect(result.dependencies).toContain(v);
        });
    });

    describe('Vec4 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const v = vec4(1.0, 2.0, 3.0, 4.0);
            const result = exp(v);

            expect(result.toGLSL()).toBe('exp(vec4(1.0, 2.0, 3.0, 4.0))');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const v = vec4(1.0, 2.0, 3.0, 4.0);
            const result = exp(v);

            expect(result.toWGSL()).toBe('exp(vec4<f32>(1.0, 2.0, 3.0, 4.0))');
        });

        it('应该正确跟踪依赖', () =>
        {
            const v = vec4(1.0, 2.0, 3.0, 4.0);
            const result = exp(v);

            expect(result.dependencies).toContain(v);
        });
    });
});

