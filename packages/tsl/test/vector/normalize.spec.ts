import { describe, expect, it } from 'vitest';
import { normalize } from '../../src/vector/normalize';
import { vec2 } from '../../src/types/vector/vec2';
import { vec3 } from '../../src/types/vector/vec3';
import { vec4 } from '../../src/types/vector/vec4';

describe('normalize', () =>
{
    describe('Vec2 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const v = vec2(3.0, 4.0);
            const result = normalize(v);

            expect(result.toGLSL()).toBe('normalize(vec2(3.0, 4.0))');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const v = vec2(3.0, 4.0);
            const result = normalize(v);

            expect(result.toWGSL()).toBe('normalize(vec2<f32>(3.0, 4.0))');
        });

        it('应该正确跟踪依赖', () =>
        {
            const v = vec2(3.0, 4.0);
            const result = normalize(v);

            expect(result.dependencies).toContain(v);
        });

        it('返回值应该是 Vec2 类型', () =>
        {
            const v = vec2(3.0, 4.0);
            const result = normalize(v);

            expect(result.glslType).toBe('vec2');
            expect(result.wgslType).toBe('vec2<f32>');
        });
    });

    describe('Vec3 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const v = vec3(1.0, 2.0, 2.0);
            const result = normalize(v);

            expect(result.toGLSL()).toBe('normalize(vec3(1.0, 2.0, 2.0))');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const v = vec3(1.0, 2.0, 2.0);
            const result = normalize(v);

            expect(result.toWGSL()).toBe('normalize(vec3<f32>(1.0, 2.0, 2.0))');
        });

        it('应该正确跟踪依赖', () =>
        {
            const v = vec3(1.0, 2.0, 2.0);
            const result = normalize(v);

            expect(result.dependencies).toContain(v);
        });

        it('返回值应该是 Vec3 类型', () =>
        {
            const v = vec3(1.0, 2.0, 2.0);
            const result = normalize(v);

            expect(result.glslType).toBe('vec3');
            expect(result.wgslType).toBe('vec3<f32>');
        });
    });

    describe('Vec4 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const v = vec4(1.0, 2.0, 2.0, 1.0);
            const result = normalize(v);

            expect(result.toGLSL()).toBe('normalize(vec4(1.0, 2.0, 2.0, 1.0))');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const v = vec4(1.0, 2.0, 2.0, 1.0);
            const result = normalize(v);

            expect(result.toWGSL()).toBe('normalize(vec4<f32>(1.0, 2.0, 2.0, 1.0))');
        });

        it('应该正确跟踪依赖', () =>
        {
            const v = vec4(1.0, 2.0, 2.0, 1.0);
            const result = normalize(v);

            expect(result.dependencies).toContain(v);
        });

        it('返回值应该是 Vec4 类型', () =>
        {
            const v = vec4(1.0, 2.0, 2.0, 1.0);
            const result = normalize(v);

            expect(result.glslType).toBe('vec4');
            expect(result.wgslType).toBe('vec4<f32>');
        });
    });
});

