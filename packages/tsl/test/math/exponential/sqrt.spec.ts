import { describe, expect, it } from 'vitest';
import { sqrt } from '../../../src/math/exponential/sqrt';
import { float } from '../../../src/types/scalar/float';
import { vec2 } from '../../../src/types/vector/vec2';
import { vec3 } from '../../../src/types/vector/vec3';
import { vec4 } from '../../../src/types/vector/vec4';

describe('sqrt', () =>
{
    describe('number 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const result = sqrt(4.0);

            expect(result.toGLSL()).toBe('sqrt(4.0)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const result = sqrt(4.0);

            expect(result.toWGSL()).toBe('sqrt(4.0)');
        });

        it('依赖应该为空', () =>
        {
            const result = sqrt(4.0);

            expect(result.dependencies).toEqual([]);
        });
    });

    describe('Float 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const x = float(4.0);
            const result = sqrt(x);

            expect(result.toGLSL()).toBe('sqrt(4.0)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const x = float(4.0);
            const result = sqrt(x);

            expect(result.toWGSL()).toBe('sqrt(4.0)');
        });

        it('应该正确跟踪依赖', () =>
        {
            const x = float(4.0);
            const result = sqrt(x);

            expect(result.dependencies).toContain(x);
        });
    });

    describe('Vec2 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const v = vec2(4.0, 9.0);
            const result = sqrt(v);

            expect(result.toGLSL()).toBe('sqrt(vec2(4.0, 9.0))');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const v = vec2(4.0, 9.0);
            const result = sqrt(v);

            expect(result.toWGSL()).toBe('sqrt(vec2<f32>(4.0, 9.0))');
        });

        it('应该正确跟踪依赖', () =>
        {
            const v = vec2(4.0, 9.0);
            const result = sqrt(v);

            expect(result.dependencies).toContain(v);
        });
    });

    describe('Vec3 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const v = vec3(4.0, 9.0, 16.0);
            const result = sqrt(v);

            expect(result.toGLSL()).toBe('sqrt(vec3(4.0, 9.0, 16.0))');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const v = vec3(4.0, 9.0, 16.0);
            const result = sqrt(v);

            expect(result.toWGSL()).toBe('sqrt(vec3<f32>(4.0, 9.0, 16.0))');
        });

        it('应该正确跟踪依赖', () =>
        {
            const v = vec3(4.0, 9.0, 16.0);
            const result = sqrt(v);

            expect(result.dependencies).toContain(v);
        });
    });

    describe('Vec4 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const v = vec4(4.0, 9.0, 16.0, 25.0);
            const result = sqrt(v);

            expect(result.toGLSL()).toBe('sqrt(vec4(4.0, 9.0, 16.0, 25.0))');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const v = vec4(4.0, 9.0, 16.0, 25.0);
            const result = sqrt(v);

            expect(result.toWGSL()).toBe('sqrt(vec4<f32>(4.0, 9.0, 16.0, 25.0))');
        });

        it('应该正确跟踪依赖', () =>
        {
            const v = vec4(4.0, 9.0, 16.0, 25.0);
            const result = sqrt(v);

            expect(result.dependencies).toContain(v);
        });
    });
});

