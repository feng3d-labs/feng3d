import { describe, expect, it } from 'vitest';
import { pow } from '../../../src/math/exponential/pow';
import { float } from '../../../src/types/scalar/float';
import { vec3 } from '../../../src/types/vector/vec3';
import { vec4 } from '../../../src/types/vector/vec4';

describe('pow', () =>
{
    describe('Float 类型', () =>
    {
        it('应该生成正确的 GLSL 代码（Float, Float）', () =>
        {
            const a = float(2.0);
            const b = float(3.0);
            const result = pow(a, b);

            expect(result.toGLSL()).toBe('pow(2.0, 3.0)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const a = float(2.0);
            const b = float(3.0);
            const result = pow(a, b);

            expect(result.toWGSL()).toBe('pow(2.0, 3.0)');
        });

        it('应该正确跟踪依赖（Float, Float）', () =>
        {
            const a = float(2.0);
            const b = float(3.0);
            const result = pow(a, b);

            expect(result.dependencies).toContain(a);
            expect(result.dependencies).toContain(b);
        });

        it('应该支持 number 类型参数', () =>
        {
            const result = pow(2.0, 3.0);

            expect(result.toGLSL()).toBe('pow(2.0, 3.0)');
            expect(result.dependencies).toEqual([]);
        });

        it('应该支持混合参数（Float, number）', () =>
        {
            const a = float(2.0);
            const result = pow(a, 3.0);

            expect(result.toGLSL()).toBe('pow(2.0, 3.0)');
            expect(result.dependencies).toContain(a);
        });

        it('应该支持混合参数（number, Float）', () =>
        {
            const b = float(3.0);
            const result = pow(2.0, b);

            expect(result.toGLSL()).toBe('pow(2.0, 3.0)');
            expect(result.dependencies).toContain(b);
        });
    });

    describe('Vec3 类型', () =>
    {
        it('应该生成正确的 GLSL 代码（Vec3, Vec3）', () =>
        {
            const a = vec3(2.0, 2.0, 2.0);
            const b = vec3(1.0, 2.0, 3.0);
            const result = pow(a, b);

            expect(result.toGLSL()).toBe('pow(vec3(2.0), vec3(1.0, 2.0, 3.0))');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const a = vec3(2.0, 2.0, 2.0);
            const b = vec3(1.0, 2.0, 3.0);
            const result = pow(a, b);

            expect(result.toWGSL()).toBe('pow(vec3<f32>(2.0), vec3<f32>(1.0, 2.0, 3.0))');
        });

        it('应该正确跟踪依赖（Vec3, Vec3）', () =>
        {
            const a = vec3(2.0, 2.0, 2.0);
            const b = vec3(1.0, 2.0, 3.0);
            const result = pow(a, b);

            expect(result.dependencies).toContain(a);
            expect(result.dependencies).toContain(b);
        });

        it('应该支持标量幂（Vec3, number）', () =>
        {
            const a = vec3(2.0, 3.0, 4.0);
            const result = pow(a, 2.0);

            expect(result.toGLSL()).toBe('pow(vec3(2.0, 3.0, 4.0), 2.0)');
            expect(result.dependencies).toContain(a);
        });

        it('应该支持 Float 幂（Vec3, Float）', () =>
        {
            const a = vec3(2.0, 3.0, 4.0);
            const b = float(2.0);
            const result = pow(a, b);

            expect(result.toGLSL()).toBe('pow(vec3(2.0, 3.0, 4.0), 2.0)');
            expect(result.dependencies).toContain(a);
            expect(result.dependencies).toContain(b);
        });
    });

    describe('Vec4 类型', () =>
    {
        it('应该生成正确的 GLSL 代码（Vec4, Vec4）', () =>
        {
            const a = vec4(2.0, 2.0, 2.0, 2.0);
            const b = vec4(1.0, 2.0, 3.0, 4.0);
            const result = pow(a, b);

            expect(result.toGLSL()).toBe('pow(vec4(2.0), vec4(1.0, 2.0, 3.0, 4.0))');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const a = vec4(2.0, 2.0, 2.0, 2.0);
            const b = vec4(1.0, 2.0, 3.0, 4.0);
            const result = pow(a, b);

            expect(result.toWGSL()).toBe('pow(vec4<f32>(2.0), vec4<f32>(1.0, 2.0, 3.0, 4.0))');
        });

        it('应该正确跟踪依赖（Vec4, Vec4）', () =>
        {
            const a = vec4(2.0, 2.0, 2.0, 2.0);
            const b = vec4(1.0, 2.0, 3.0, 4.0);
            const result = pow(a, b);

            expect(result.dependencies).toContain(a);
            expect(result.dependencies).toContain(b);
        });

        it('应该支持标量幂（Vec4, number）', () =>
        {
            const a = vec4(2.0, 3.0, 4.0, 5.0);
            const result = pow(a, 2.0);

            expect(result.toGLSL()).toBe('pow(vec4(2.0, 3.0, 4.0, 5.0), 2.0)');
            expect(result.dependencies).toContain(a);
        });

        it('应该支持 Float 幂（Vec4, Float）', () =>
        {
            const a = vec4(2.0, 3.0, 4.0, 5.0);
            const b = float(2.0);
            const result = pow(a, b);

            expect(result.toGLSL()).toBe('pow(vec4(2.0, 3.0, 4.0, 5.0), 2.0)');
            expect(result.dependencies).toContain(a);
            expect(result.dependencies).toContain(b);
        });
    });
});

