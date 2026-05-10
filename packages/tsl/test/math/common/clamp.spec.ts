import { describe, expect, it } from 'vitest';
import { clamp } from '../../../src/math/common/clamp';
import { float } from '../../../src/types/scalar/float';
import { vec2 } from '../../../src/types/vector/vec2';
import { vec3 } from '../../../src/types/vector/vec3';
import { vec4 } from '../../../src/types/vector/vec4';

describe('clamp', () =>
{
    describe('Float 类型', () =>
    {
        it('应该生成正确的 GLSL 代码（Float, Float, Float）', () =>
        {
            const a = float(1.5);
            const min = float(0.0);
            const max = float(1.0);
            const result = clamp(a, min, max);

            expect(result.toGLSL()).toBe('clamp(1.5, 0.0, 1.0)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const a = float(1.5);
            const min = float(0.0);
            const max = float(1.0);
            const result = clamp(a, min, max);

            expect(result.toWGSL()).toBe('clamp(1.5, 0.0, 1.0)');
        });

        it('应该正确跟踪依赖', () =>
        {
            const a = float(1.5);
            const min = float(0.0);
            const max = float(1.0);
            const result = clamp(a, min, max);

            expect(result.dependencies).toContain(a);
            expect(result.dependencies).toContain(min);
            expect(result.dependencies).toContain(max);
        });

        it('应该支持全部 number 参数', () =>
        {
            const result = clamp(1.5, 0.0, 1.0);

            expect(result.toGLSL()).toBe('clamp(1.5, 0.0, 1.0)');
            expect(result.dependencies).toEqual([]);
        });

        it('应该支持混合参数（Float, number, number）', () =>
        {
            const a = float(1.5);
            const result = clamp(a, 0.0, 1.0);

            expect(result.toGLSL()).toBe('clamp(1.5, 0.0, 1.0)');
            expect(result.dependencies).toContain(a);
        });

        it('应该支持混合参数（number, Float, Float）', () =>
        {
            const min = float(0.0);
            const max = float(1.0);
            const result = clamp(1.5, min, max);

            expect(result.toGLSL()).toBe('clamp(1.5, 0.0, 1.0)');
            expect(result.dependencies).toContain(min);
            expect(result.dependencies).toContain(max);
        });

        it('应该支持混合参数（number, number, Float）', () =>
        {
            const max = float(1.0);
            const result = clamp(1.5, 0.0, max);

            expect(result.toGLSL()).toBe('clamp(1.5, 0.0, 1.0)');
            expect(result.dependencies).toContain(max);
        });

        it('应该支持混合参数（number, Float, number）', () =>
        {
            const min = float(0.0);
            const result = clamp(1.5, min, 1.0);

            expect(result.toGLSL()).toBe('clamp(1.5, 0.0, 1.0)');
            expect(result.dependencies).toContain(min);
        });
    });

    describe('Vec2 类型', () =>
    {
        it('应该生成正确的 GLSL 代码（Vec2, number, number）', () =>
        {
            const a = vec2(0.5, 1.5);
            const result = clamp(a, 0.0, 1.0);

            expect(result.toGLSL()).toBe('clamp(vec2(0.5, 1.5), 0.0, 1.0)');
        });

        it('应该生成正确的 WGSL 代码（需要转换为向量）', () =>
        {
            const a = vec2(0.5, 1.5);
            const result = clamp(a, 0.0, 1.0);

            expect(result.toWGSL()).toBe('clamp(vec2<f32>(0.5, 1.5), vec2<f32>(0.0), vec2<f32>(1.0))');
        });

        it('应该支持向量参数', () =>
        {
            const a = vec2(0.5, 1.5);
            const min = vec2(0.0, 0.0);
            const max = vec2(1.0, 1.0);
            const result = clamp(a, min, max);

            expect(result.toGLSL()).toBe('clamp(vec2(0.5, 1.5), vec2(0.0), vec2(1.0))');
            expect(result.dependencies).toContain(a);
            expect(result.dependencies).toContain(min);
            expect(result.dependencies).toContain(max);
        });
    });

    describe('Vec3 类型', () =>
    {
        it('应该生成正确的 GLSL 代码（Vec3, number, number）', () =>
        {
            const a = vec3(0.5, 1.5, -0.5);
            const result = clamp(a, 0.0, 1.0);

            expect(result.toGLSL()).toBe('clamp(vec3(0.5, 1.5, -0.5), 0.0, 1.0)');
        });

        it('应该生成正确的 WGSL 代码（需要转换为向量）', () =>
        {
            const a = vec3(0.5, 1.5, -0.5);
            const result = clamp(a, 0.0, 1.0);

            expect(result.toWGSL()).toBe('clamp(vec3<f32>(0.5, 1.5, -0.5), vec3<f32>(0.0), vec3<f32>(1.0))');
        });

        it('应该支持向量参数', () =>
        {
            const a = vec3(0.5, 1.5, -0.5);
            const min = vec3(0.0, 0.0, 0.0);
            const max = vec3(1.0, 1.0, 1.0);
            const result = clamp(a, min, max);

            expect(result.toGLSL()).toBe('clamp(vec3(0.5, 1.5, -0.5), vec3(0.0), vec3(1.0))');
        });

        it('应该正确处理混合依赖（Vec3, number, Vec3）', () =>
        {
            const a = vec3(0.5, 1.5, -0.5);
            const max = vec3(1.0, 1.0, 1.0);
            const result = clamp(a, 0.0, max);

            expect(result.dependencies).toContain(a);
            expect(result.dependencies).toContain(max);
            expect(result.dependencies.length).toBe(2);
        });

        it('应该正确处理混合依赖（Vec3, Vec3, number）', () =>
        {
            const a = vec3(0.5, 1.5, -0.5);
            const min = vec3(0.0, 0.0, 0.0);
            const result = clamp(a, min, 1.0);

            expect(result.dependencies).toContain(a);
            expect(result.dependencies).toContain(min);
            expect(result.dependencies.length).toBe(2);
        });
    });

    describe('Vec4 类型', () =>
    {
        it('应该生成正确的 GLSL 代码（Vec4, number, number）', () =>
        {
            const a = vec4(0.5, 1.5, -0.5, 2.0);
            const result = clamp(a, 0.0, 1.0);

            expect(result.toGLSL()).toBe('clamp(vec4(0.5, 1.5, -0.5, 2.0), 0.0, 1.0)');
        });

        it('应该生成正确的 WGSL 代码（需要转换为向量）', () =>
        {
            const a = vec4(0.5, 1.5, -0.5, 2.0);
            const result = clamp(a, 0.0, 1.0);

            expect(result.toWGSL()).toBe('clamp(vec4<f32>(0.5, 1.5, -0.5, 2.0), vec4<f32>(0.0), vec4<f32>(1.0))');
        });

        it('应该支持向量参数', () =>
        {
            const a = vec4(0.5, 1.5, -0.5, 2.0);
            const min = vec4(0.0, 0.0, 0.0, 0.0);
            const max = vec4(1.0, 1.0, 1.0, 1.0);
            const result = clamp(a, min, max);

            expect(result.toGLSL()).toBe('clamp(vec4(0.5, 1.5, -0.5, 2.0), vec4(0.0), vec4(1.0))');
        });
    });
});

