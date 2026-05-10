import { describe, expect, it } from 'vitest';
import { reflect } from '../../src/vector/reflect';
import { vec3 } from '../../src/types/vector/vec3';

describe('reflect', () =>
{
    it('应该生成正确的 GLSL 代码', () =>
    {
        const incident = vec3(1.0, -1.0, 0.0);
        const normal = vec3(0.0, 1.0, 0.0);
        const result = reflect(incident, normal);

        expect(result.toGLSL()).toBe('reflect(vec3(1.0, -1.0, 0.0), vec3(0.0, 1.0, 0.0))');
    });

    it('应该生成正确的 WGSL 代码', () =>
    {
        const incident = vec3(1.0, -1.0, 0.0);
        const normal = vec3(0.0, 1.0, 0.0);
        const result = reflect(incident, normal);

        expect(result.toWGSL()).toBe('reflect(vec3<f32>(1.0, -1.0, 0.0), vec3<f32>(0.0, 1.0, 0.0))');
    });

    it('应该正确跟踪依赖', () =>
    {
        const incident = vec3(1.0, -1.0, 0.0);
        const normal = vec3(0.0, 1.0, 0.0);
        const result = reflect(incident, normal);

        expect(result.dependencies).toContain(incident);
        expect(result.dependencies).toContain(normal);
    });

    it('返回值应该是 Vec3 类型', () =>
    {
        const incident = vec3(1.0, -1.0, 0.0);
        const normal = vec3(0.0, 1.0, 0.0);
        const result = reflect(incident, normal);

        expect(result.glslType).toBe('vec3');
        expect(result.wgslType).toBe('vec3<f32>');
    });
});

