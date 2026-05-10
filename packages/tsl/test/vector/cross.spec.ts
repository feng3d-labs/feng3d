import { describe, expect, it } from 'vitest';
import { cross } from '../../src/vector/cross';
import { vec3 } from '../../src/types/vector/vec3';

describe('cross', () =>
{
    it('应该生成正确的 GLSL 代码', () =>
    {
        const a = vec3(1.0, 0.0, 0.0);
        const b = vec3(0.0, 1.0, 0.0);
        const result = cross(a, b);

        expect(result.toGLSL()).toBe('cross(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0))');
    });

    it('应该生成正确的 WGSL 代码', () =>
    {
        const a = vec3(1.0, 0.0, 0.0);
        const b = vec3(0.0, 1.0, 0.0);
        const result = cross(a, b);

        expect(result.toWGSL()).toBe('cross(vec3<f32>(1.0, 0.0, 0.0), vec3<f32>(0.0, 1.0, 0.0))');
    });

    it('应该正确跟踪依赖', () =>
    {
        const a = vec3(1.0, 0.0, 0.0);
        const b = vec3(0.0, 1.0, 0.0);
        const result = cross(a, b);

        expect(result.dependencies).toContain(a);
        expect(result.dependencies).toContain(b);
    });

    it('返回值应该是 Vec3 类型', () =>
    {
        const a = vec3(1.0, 0.0, 0.0);
        const b = vec3(0.0, 1.0, 0.0);
        const result = cross(a, b);

        expect(result.glslType).toBe('vec3');
        expect(result.wgslType).toBe('vec3<f32>');
    });
});

