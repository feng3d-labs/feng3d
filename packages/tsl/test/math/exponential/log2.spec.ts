import { describe, expect, it } from 'vitest';
import { log2 } from '../../../src/math/exponential/log2';
import { float } from '../../../src/types/scalar/float';
import { vec2 } from '../../../src/types/vector/vec2';
import { vec3 } from '../../../src/types/vector/vec3';
import { vec4 } from '../../../src/types/vector/vec4';

describe('log2', () =>
{
    describe('number 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const result = log2(8.0);

            expect(result.toGLSL()).toBe('log2(8.0)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const result = log2(8.0);

            expect(result.toWGSL()).toBe('log2(8.0)');
        });

        it('依赖应该为空', () =>
        {
            const result = log2(8.0);

            expect(result.dependencies).toEqual([]);
        });
    });

    describe('Float 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const x = float(8.0);
            const result = log2(x);

            expect(result.toGLSL()).toBe('log2(8.0)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const x = float(8.0);
            const result = log2(x);

            expect(result.toWGSL()).toBe('log2(8.0)');
        });

        it('应该正确跟踪依赖', () =>
        {
            const x = float(8.0);
            const result = log2(x);

            expect(result.dependencies).toContain(x);
        });
    });

    describe('Vec2 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const v = vec2(4.0, 8.0);
            const result = log2(v);

            expect(result.toGLSL()).toBe('log2(vec2(4.0, 8.0))');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const v = vec2(4.0, 8.0);
            const result = log2(v);

            expect(result.toWGSL()).toBe('log2(vec2<f32>(4.0, 8.0))');
        });

        it('应该正确跟踪依赖', () =>
        {
            const v = vec2(4.0, 8.0);
            const result = log2(v);

            expect(result.dependencies).toContain(v);
        });
    });

    describe('Vec3 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const v = vec3(2.0, 4.0, 8.0);
            const result = log2(v);

            expect(result.toGLSL()).toBe('log2(vec3(2.0, 4.0, 8.0))');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const v = vec3(2.0, 4.0, 8.0);
            const result = log2(v);

            expect(result.toWGSL()).toBe('log2(vec3<f32>(2.0, 4.0, 8.0))');
        });

        it('应该正确跟踪依赖', () =>
        {
            const v = vec3(2.0, 4.0, 8.0);
            const result = log2(v);

            expect(result.dependencies).toContain(v);
        });
    });

    describe('Vec4 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const v = vec4(1.0, 2.0, 4.0, 8.0);
            const result = log2(v);

            expect(result.toGLSL()).toBe('log2(vec4(1.0, 2.0, 4.0, 8.0))');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const v = vec4(1.0, 2.0, 4.0, 8.0);
            const result = log2(v);

            expect(result.toWGSL()).toBe('log2(vec4<f32>(1.0, 2.0, 4.0, 8.0))');
        });

        it('应该正确跟踪依赖', () =>
        {
            const v = vec4(1.0, 2.0, 4.0, 8.0);
            const result = log2(v);

            expect(result.dependencies).toContain(v);
        });
    });
});

