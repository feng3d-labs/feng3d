import { describe, expect, it } from 'vitest';
import { dot } from '../../src/vector/dot';
import { vec2 } from '../../src/types/vector/vec2';
import { vec3 } from '../../src/types/vector/vec3';

describe('dot', () =>
{
    describe('Vec2 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const a = vec2(1.0, 2.0);
            const b = vec2(3.0, 4.0);
            const result = dot(a, b);

            expect(result.toGLSL()).toBe('dot(vec2(1.0, 2.0), vec2(3.0, 4.0))');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const a = vec2(1.0, 2.0);
            const b = vec2(3.0, 4.0);
            const result = dot(a, b);

            expect(result.toWGSL()).toBe('dot(vec2<f32>(1.0, 2.0), vec2<f32>(3.0, 4.0))');
        });

        it('应该正确跟踪依赖', () =>
        {
            const a = vec2(1.0, 2.0);
            const b = vec2(3.0, 4.0);
            const result = dot(a, b);

            expect(result.dependencies).toContain(a);
            expect(result.dependencies).toContain(b);
        });

        it('返回值应该是 Float 类型', () =>
        {
            const a = vec2(1.0, 2.0);
            const b = vec2(3.0, 4.0);
            const result = dot(a, b);

            expect(result.glslType).toBe('float');
            expect(result.wgslType).toBe('f32');
        });
    });

    describe('Vec3 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const a = vec3(1.0, 2.0, 3.0);
            const b = vec3(4.0, 5.0, 6.0);
            const result = dot(a, b);

            expect(result.toGLSL()).toBe('dot(vec3(1.0, 2.0, 3.0), vec3(4.0, 5.0, 6.0))');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const a = vec3(1.0, 2.0, 3.0);
            const b = vec3(4.0, 5.0, 6.0);
            const result = dot(a, b);

            expect(result.toWGSL()).toBe('dot(vec3<f32>(1.0, 2.0, 3.0), vec3<f32>(4.0, 5.0, 6.0))');
        });

        it('应该正确跟踪依赖', () =>
        {
            const a = vec3(1.0, 2.0, 3.0);
            const b = vec3(4.0, 5.0, 6.0);
            const result = dot(a, b);

            expect(result.dependencies).toContain(a);
            expect(result.dependencies).toContain(b);
        });
    });
});

