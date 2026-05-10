import { describe, expect, it } from 'vitest';
import { mix } from '../../../src/math/common/mix';
import { float } from '../../../src/types/scalar/float';
import { vec3 } from '../../../src/types/vector/vec3';
import { vec4 } from '../../../src/types/vector/vec4';
import { BVec3 } from '../../../src/types/vector/bvec3';

describe('mix', () =>
{
    describe('Float 类型', () =>
    {
        it('应该生成正确的 GLSL 代码（Float, Float, Float）', () =>
        {
            const a = float(0.0);
            const b = float(1.0);
            const t = float(0.5);
            const result = mix(a, b, t);

            expect(result.toGLSL()).toBe('mix(0.0, 1.0, 0.5)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const a = float(0.0);
            const b = float(1.0);
            const t = float(0.5);
            const result = mix(a, b, t);

            expect(result.toWGSL()).toBe('mix(0.0, 1.0, 0.5)');
        });

        it('应该正确跟踪依赖', () =>
        {
            const a = float(0.0);
            const b = float(1.0);
            const t = float(0.5);
            const result = mix(a, b, t);

            expect(result.dependencies).toContain(a);
            expect(result.dependencies).toContain(b);
            expect(result.dependencies).toContain(t);
        });

        it('应该支持全部 number 参数', () =>
        {
            const result = mix(0.0, 1.0, 0.5);

            expect(result.toGLSL()).toBe('mix(0.0, 1.0, 0.5)');
            expect(result.dependencies).toEqual([]);
        });

        it('应该支持混合参数（Float, number, number）', () =>
        {
            const a = float(0.0);
            const result = mix(a, 1.0, 0.5);

            expect(result.toGLSL()).toBe('mix(0.0, 1.0, 0.5)');
            expect(result.dependencies).toContain(a);
        });

        it('应该支持混合参数（number, Float, number）', () =>
        {
            const b = float(1.0);
            const result = mix(0.0, b, 0.5);

            expect(result.toGLSL()).toBe('mix(0.0, 1.0, 0.5)');
            expect(result.dependencies).toContain(b);
        });

        it('应该支持混合参数（number, number, Float）', () =>
        {
            const t = float(0.5);
            const result = mix(0.0, 1.0, t);

            expect(result.toGLSL()).toBe('mix(0.0, 1.0, 0.5)');
            expect(result.dependencies).toContain(t);
        });
    });

    describe('Vec3 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const a = vec3(0.0, 0.0, 0.0);
            const b = vec3(1.0, 1.0, 1.0);
            const t = float(0.5);
            const result = mix(a, b, t);

            expect(result.toGLSL()).toBe('mix(vec3(0.0), vec3(1.0), 0.5)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const a = vec3(0.0, 0.0, 0.0);
            const b = vec3(1.0, 1.0, 1.0);
            const t = float(0.5);
            const result = mix(a, b, t);

            expect(result.toWGSL()).toBe('mix(vec3<f32>(0.0), vec3<f32>(1.0), 0.5)');
        });

        it('应该正确跟踪依赖', () =>
        {
            const a = vec3(0.0, 0.0, 0.0);
            const b = vec3(1.0, 1.0, 1.0);
            const t = float(0.5);
            const result = mix(a, b, t);

            expect(result.dependencies).toContain(a);
            expect(result.dependencies).toContain(b);
            expect(result.dependencies).toContain(t);
        });

        it('应该支持 number 类型的 t', () =>
        {
            const a = vec3(0.0, 0.0, 0.0);
            const b = vec3(1.0, 1.0, 1.0);
            const result = mix(a, b, 0.5);

            expect(result.toGLSL()).toBe('mix(vec3(0.0), vec3(1.0), 0.5)');
            expect(result.dependencies).toContain(a);
            expect(result.dependencies).toContain(b);
        });

        it('应该支持 BVec3 类型的 t（使用 select）', () =>
        {
            const a = vec3(0.0, 0.0, 0.0);
            const b = vec3(1.0, 1.0, 1.0);

            // 创建一个 BVec3 实例并设置 toGLSL/toWGSL
            const t = new BVec3();
            t.toGLSL = () => 'bvec3(true, false, true)';
            t.toWGSL = () => 'vec3<bool>(true, false, true)';

            const result = mix(a, b, t);

            expect(result.toGLSL()).toBe('mix(vec3(0.0), vec3(1.0), bvec3(true, false, true))');
            expect(result.toWGSL()).toBe('select(vec3<f32>(0.0), vec3<f32>(1.0), vec3<bool>(true, false, true))');
        });
    });

    describe('Vec4 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const a = vec4(0.0, 0.0, 0.0, 0.0);
            const b = vec4(1.0, 1.0, 1.0, 1.0);
            const t = float(0.5);
            const result = mix(a, b, t);

            expect(result.toGLSL()).toBe('mix(vec4(0.0), vec4(1.0), 0.5)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const a = vec4(0.0, 0.0, 0.0, 0.0);
            const b = vec4(1.0, 1.0, 1.0, 1.0);
            const t = float(0.5);
            const result = mix(a, b, t);

            expect(result.toWGSL()).toBe('mix(vec4<f32>(0.0), vec4<f32>(1.0), 0.5)');
        });

        it('应该正确跟踪依赖', () =>
        {
            const a = vec4(0.0, 0.0, 0.0, 0.0);
            const b = vec4(1.0, 1.0, 1.0, 1.0);
            const t = float(0.5);
            const result = mix(a, b, t);

            expect(result.dependencies).toContain(a);
            expect(result.dependencies).toContain(b);
            expect(result.dependencies).toContain(t);
        });

        it('应该支持 number 类型的 t', () =>
        {
            const a = vec4(0.0, 0.0, 0.0, 0.0);
            const b = vec4(1.0, 1.0, 1.0, 1.0);
            const result = mix(a, b, 0.5);

            expect(result.toGLSL()).toBe('mix(vec4(0.0), vec4(1.0), 0.5)');
        });
    });
});

