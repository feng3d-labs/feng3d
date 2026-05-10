import { describe, expect, it } from 'vitest';
import { step } from '../../../src/math/common/step';
import { float } from '../../../src/types/scalar/float';
import { vec3 } from '../../../src/types/vector/vec3';
import { vec4 } from '../../../src/types/vector/vec4';

describe('step', () =>
{
    describe('Float 类型', () =>
    {
        it('应该生成正确的 GLSL 代码（Float, Float）', () =>
        {
            const edge = float(0.5);
            const x = float(0.7);
            const result = step(edge, x);

            expect(result.toGLSL()).toBe('step(0.5, 0.7)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const edge = float(0.5);
            const x = float(0.7);
            const result = step(edge, x);

            expect(result.toWGSL()).toBe('step(0.5, 0.7)');
        });

        it('应该正确跟踪依赖（Float, Float）', () =>
        {
            const edge = float(0.5);
            const x = float(0.7);
            const result = step(edge, x);

            expect(result.dependencies).toContain(edge);
            expect(result.dependencies).toContain(x);
        });

        it('应该支持 number 类型参数', () =>
        {
            const result = step(0.5, 0.7);

            expect(result.toGLSL()).toBe('step(0.5, 0.7)');
            expect(result.dependencies).toEqual([]);
        });

        it('应该支持混合参数（number, Float）', () =>
        {
            const x = float(0.7);
            const result = step(0.5, x);

            expect(result.toGLSL()).toBe('step(0.5, 0.7)');
            expect(result.dependencies).toContain(x);
        });

        it('应该支持混合参数（Float, number）', () =>
        {
            const edge = float(0.5);
            const result = step(edge, 0.7);

            expect(result.toGLSL()).toBe('step(0.5, 0.7)');
            expect(result.dependencies).toContain(edge);
        });
    });

    describe('Vec3 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const edge = vec3(0.5, 0.5, 0.5);
            const x = vec3(0.3, 0.7, 0.5);
            const result = step(edge, x);

            // vec3(0.5, 0.5, 0.5) 会被优化为 vec3(0.5)
            expect(result.toGLSL()).toBe('step(vec3(0.5), vec3(0.3, 0.7, 0.5))');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const edge = vec3(0.5, 0.5, 0.5);
            const x = vec3(0.3, 0.7, 0.5);
            const result = step(edge, x);

            // vec3(0.5, 0.5, 0.5) 会被优化为 vec3<f32>(0.5)
            expect(result.toWGSL()).toBe('step(vec3<f32>(0.5), vec3<f32>(0.3, 0.7, 0.5))');
        });

        it('应该正确跟踪依赖', () =>
        {
            const edge = vec3(0.5, 0.5, 0.5);
            const x = vec3(0.3, 0.7, 0.5);
            const result = step(edge, x);

            expect(result.dependencies).toContain(edge);
            expect(result.dependencies).toContain(x);
        });

        it('应该支持标量 edge', () =>
        {
            const x = vec3(0.3, 0.7, 0.5);
            const result = step(0.5, x);

            expect(result.toGLSL()).toBe('step(0.5, vec3(0.3, 0.7, 0.5))');
        });
    });

    describe('Vec4 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const edge = vec4(0.5, 0.5, 0.5, 0.5);
            const x = vec4(0.3, 0.7, 0.5, 1.0);
            const result = step(edge, x);

            // vec4(0.5, 0.5, 0.5, 0.5) 会被优化为 vec4(0.5)
            expect(result.toGLSL()).toBe('step(vec4(0.5), vec4(0.3, 0.7, 0.5, 1.0))');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const edge = vec4(0.5, 0.5, 0.5, 0.5);
            const x = vec4(0.3, 0.7, 0.5, 1.0);
            const result = step(edge, x);

            // vec4(0.5, 0.5, 0.5, 0.5) 会被优化为 vec4<f32>(0.5)
            expect(result.toWGSL()).toBe('step(vec4<f32>(0.5), vec4<f32>(0.3, 0.7, 0.5, 1.0))');
        });

        it('应该支持标量 edge', () =>
        {
            const x = vec4(0.3, 0.7, 0.5, 1.0);
            const result = step(0.5, x);

            expect(result.toGLSL()).toBe('step(0.5, vec4(0.3, 0.7, 0.5, 1.0))');
        });
    });
});

