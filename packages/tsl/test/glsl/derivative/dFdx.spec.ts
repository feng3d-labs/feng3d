import { describe, expect, it } from 'vitest';
import { dFdx } from '../../../src/glsl/derivative/dFdx';
import { float } from '../../../src/types/scalar/float';
import { vec2 } from '../../../src/types/vector/vec2';
import { vec3 } from '../../../src/types/vector/vec3';

describe('dFdx', () =>
{
    describe('Float 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const x = float(1.0);
            const result = dFdx(x);

            expect(result.toGLSL()).toBe('dFdx(1.0)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const x = float(1.0);
            const result = dFdx(x);

            expect(result.toWGSL()).toBe('dpdx(1.0)');
        });

        it('应该正确跟踪依赖', () =>
        {
            const x = float(1.0);
            const result = dFdx(x);

            expect(result.dependencies).toContain(x);
        });
    });

    describe('Vec2 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const v = vec2(1.0, 2.0);
            const result = dFdx(v);

            expect(result.toGLSL()).toBe('dFdx(vec2(1.0, 2.0))');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const v = vec2(1.0, 2.0);
            const result = dFdx(v);

            expect(result.toWGSL()).toBe('dpdx(vec2<f32>(1.0, 2.0))');
        });

        it('应该正确跟踪依赖', () =>
        {
            const v = vec2(1.0, 2.0);
            const result = dFdx(v);

            expect(result.dependencies).toContain(v);
        });
    });

    describe('Vec3 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const v = vec3(1.0, 2.0, 3.0);
            const result = dFdx(v);

            expect(result.toGLSL()).toBe('dFdx(vec3(1.0, 2.0, 3.0))');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const v = vec3(1.0, 2.0, 3.0);
            const result = dFdx(v);

            expect(result.toWGSL()).toBe('dpdx(vec3<f32>(1.0, 2.0, 3.0))');
        });

        it('应该正确跟踪依赖', () =>
        {
            const v = vec3(1.0, 2.0, 3.0);
            const result = dFdx(v);

            expect(result.dependencies).toContain(v);
        });
    });
});

