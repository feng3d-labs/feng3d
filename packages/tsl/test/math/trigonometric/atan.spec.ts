import { describe, expect, it } from 'vitest';
import { atan } from '../../../src/math/trigonometric/atan';
import { float } from '../../../src/types/scalar/float';
import { vec2 } from '../../../src/types/vector/vec2';

describe('atan', () =>
{
    describe('单参数 number 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const result = atan(0.5);

            expect(result.toGLSL()).toBe('atan(0.5)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const result = atan(0.5);

            expect(result.toWGSL()).toBe('atan(0.5)');
        });

        it('依赖应该为空', () =>
        {
            const result = atan(0.5);

            expect(result.dependencies).toEqual([]);
        });
    });

    describe('单参数 Float 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const x = float(0.5);
            const result = atan(x);

            expect(result.toGLSL()).toBe('atan(0.5)');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const x = float(0.5);
            const result = atan(x);

            expect(result.toWGSL()).toBe('atan(0.5)');
        });

        it('应该正确跟踪依赖', () =>
        {
            const x = float(0.5);
            const result = atan(x);

            expect(result.dependencies).toContain(x);
        });
    });

    describe('Vec2 类型', () =>
    {
        it('应该生成正确的 GLSL 代码', () =>
        {
            const v = vec2(0.5, 1.0);
            const result = atan(v);

            expect(result.toGLSL()).toBe('atan(vec2(0.5, 1.0))');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const v = vec2(0.5, 1.0);
            const result = atan(v);

            expect(result.toWGSL()).toBe('atan(vec2<f32>(0.5, 1.0))');
        });

        it('应该正确跟踪依赖', () =>
        {
            const v = vec2(0.5, 1.0);
            const result = atan(v);

            expect(result.dependencies).toContain(v);
        });
    });

    describe('双参数（atan2）', () =>
    {
        it('应该生成正确的 GLSL 代码（Float, Float）', () =>
        {
            const y = float(1.0);
            const x = float(2.0);
            const result = atan(y, x);

            expect(result.toGLSL()).toBe('atan(1.0, 2.0)');
        });

        it('应该生成正确的 WGSL 代码（使用 atan2）', () =>
        {
            const y = float(1.0);
            const x = float(2.0);
            const result = atan(y, x);

            expect(result.toWGSL()).toBe('atan2(1.0, 2.0)');
        });

        it('应该正确跟踪依赖（Float, Float）', () =>
        {
            const y = float(1.0);
            const x = float(2.0);
            const result = atan(y, x);

            expect(result.dependencies).toContain(y);
            expect(result.dependencies).toContain(x);
        });

        it('应该支持 number 参数', () =>
        {
            const result = atan(1.0, 2.0);

            expect(result.toGLSL()).toBe('atan(1.0, 2.0)');
            expect(result.toWGSL()).toBe('atan2(1.0, 2.0)');
            expect(result.dependencies).toEqual([]);
        });

        it('应该支持混合参数（Float, number）', () =>
        {
            const y = float(1.0);
            const result = atan(y, 2.0);

            expect(result.toGLSL()).toBe('atan(1.0, 2.0)');
            expect(result.dependencies).toContain(y);
        });

        it('应该支持混合参数（number, Float）', () =>
        {
            const x = float(2.0);
            const result = atan(1.0, x);

            expect(result.toGLSL()).toBe('atan(1.0, 2.0)');
            expect(result.dependencies).toContain(x);
        });
    });
});

