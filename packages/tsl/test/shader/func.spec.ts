import { describe, expect, it } from 'vitest';
import { Func, func } from '../../src/shader/func';
import { vec3 } from '../../src/types/vector/vec3';
import { float } from '../../src/types/scalar/float';
import { let_ } from '../../src/variables/let';
import { clamp } from '../../src/math/common/clamp';
import { mix } from '../../src/math/common/mix';
import { pow } from '../../src/math/exponential/pow';
import { lessThan } from '../../src/vector/lessThan';
import { fragment } from '../../src/shader/fragment';
import { return_ } from '../../src/control/return';
import { vec4 } from '../../src/types/vector/vec4';

describe('Func', () =>
{
    describe('Func 类', () =>
    {
        it('应该能够创建 Func 实例', () =>
        {
            const funcInstance = new Func('test', () => 'result');
            expect(funcInstance.name).toBe('test');
        });

    });

    describe('func 函数（着色器函数定义）', () =>
    {
        it('应该能够定义带参数和返回值的着色器函数', () =>
        {
            const rgbToSrgb = func('rgbToSrgb', [vec3, float], vec3, (colorRGB, gammaCorrection) =>
            {
                const clampedColorRGB = let_('clampedColorRGB', clamp(colorRGB, vec3(0.0), vec3(1.0)));

                return_(mix(
                    pow(clampedColorRGB, vec3(gammaCorrection)).multiply(1.055).subtract(vec3(0.055)),
                    clampedColorRGB.multiply(12.92),
                    lessThan(clampedColorRGB, vec3(0.0031308)),
                ));
            });

            // 验证返回的是一个可调用的函数
            expect(typeof rgbToSrgb).toBe('function');

            // 验证可以获取 ShaderFunc 实例
            expect((rgbToSrgb as any)._shaderFunc).toBeDefined();
        });

        it('应该能够生成正确的 GLSL 函数定义', () =>
        {
            const myFunc = func('myFunc', [vec3, float], vec3, (color, value) =>
            {
                return_(color.multiply(value));
            });

            const shaderFunc = (myFunc as any)._shaderFunc;
            const glsl = shaderFunc.toGLSL();

            expect(glsl).toContain('vec3 myFunc(');
            expect(glsl).toContain('in vec3 p0');
            expect(glsl).toContain('in float p1');
            expect(glsl).toContain('return');
        });

        it('应该能够生成正确的 WGSL 函数定义', () =>
        {
            const myFunc = func('myFunc', [vec3, float], vec3, (color, value) =>
            {
                return_(color.multiply(value));
            });

            const shaderFunc = (myFunc as any)._shaderFunc;
            const wgsl = shaderFunc.toWGSL();

            expect(wgsl).toContain('fn myFunc(');
            expect(wgsl).toContain('p0: vec3<f32>');
            expect(wgsl).toContain('p1: f32');
            expect(wgsl).toContain('-> vec3<f32>');
            expect(wgsl).toContain('return');
        });

        it('调用着色器函数应该返回正确的表达式', () =>
        {
            const myFunc = func('myFunc', [vec3, float], vec3, (color, value) =>
            {
                return_(color.multiply(value));
            });

            const inputColor = vec3(1.0, 0.5, 0.0);
            const result = myFunc(inputColor, 2.0);

            expect(result.toGLSL()).toBe('myFunc(vec3(1.0, 0.5, 0.0), 2.0)');
            expect(result.toWGSL()).toBe('myFunc(vec3<f32>(1.0, 0.5, 0.0), 2.0)');
        });

        it('着色器函数应该自动添加到片段着色器输出中', () =>
        {
            const myFunc = func('myFunc', [vec3, float], vec4, (color, value) =>
            {
                return vec4(color.multiply(value), 1.0);
            });

            const frag = fragment('main', () =>
            {
                const color = let_('color', vec3(1.0, 0.5, 0.0));
                const result = let_('result', myFunc(color, 2.0));
                return_(result);
            });

            const glsl = frag.toGLSL(2);
            const wgsl = frag.toWGSL();

            // 验证 GLSL 中包含函数定义
            expect(glsl).toContain('vec4 myFunc(');
            expect(glsl).toContain('vec4 result = myFunc(color, 2.0);');

            // 验证 WGSL 中包含函数定义
            expect(wgsl).toContain('fn myFunc(');
            expect(wgsl).toContain('let result = myFunc(color, 2.0);');
        });
    });
});

