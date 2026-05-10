import { describe, expect, it } from 'vitest';
import { dFdy } from '../../../src/glsl/derivative/dFdy';
import { float } from '../../../src/types/scalar/float';
import { vec2 } from '../../../src/types/vector/vec2';
import { vec3 } from '../../../src/types/vector/vec3';

describe('dFdy', () =>
{
    describe('Float 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const x = float(1.0);
            const result = dFdy(x);

            expect(result.toGLSL()).toBe('dFdy(1.0)');
        });

        it('应该生成正确的 WGSL 代码（取反以补偿 Y 轴方向差异）', () =>
        {
            const x = float(1.0);
            const result = dFdy(x);

            expect(result.toWGSL()).toBe('-dpdy(1.0)');
        });

        it('应该正确跟踪依赖', () =>
        {
            const x = float(1.0);
            const result = dFdy(x);

            expect(result.dependencies).toContain(x);
        });
    });

    describe('Vec2 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const v = vec2(1.0, 2.0);
            const result = dFdy(v);

            expect(result.toGLSL()).toBe('dFdy(vec2(1.0, 2.0))');
        });

        it('应该生成正确的 WGSL 代码（取反以补偿 Y 轴方向差异）', () =>
        {
            const v = vec2(1.0, 2.0);
            const result = dFdy(v);

            expect(result.toWGSL()).toBe('-dpdy(vec2<f32>(1.0, 2.0))');
        });

        it('应该正确跟踪依赖', () =>
        {
            const v = vec2(1.0, 2.0);
            const result = dFdy(v);

            expect(result.dependencies).toContain(v);
        });
    });

    describe('Vec3 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const v = vec3(1.0, 2.0, 3.0);
            const result = dFdy(v);

            expect(result.toGLSL()).toBe('dFdy(vec3(1.0, 2.0, 3.0))');
        });

        it('应该生成正确的 WGSL 代码（取反以补偿 Y 轴方向差异）', () =>
        {
            const v = vec3(1.0, 2.0, 3.0);
            const result = dFdy(v);

            expect(result.toWGSL()).toBe('-dpdy(vec3<f32>(1.0, 2.0, 3.0))');
        });

        it('应该正确跟踪依赖', () =>
        {
            const v = vec3(1.0, 2.0, 3.0);
            const result = dFdy(v);

            expect(result.dependencies).toContain(v);
        });
    });
});

