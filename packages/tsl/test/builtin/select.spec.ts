import { describe, expect, it } from 'vitest';
import { select } from '../../src/control/select';
import { float } from '../../src/types/scalar/float';
import { vec2 } from '../../src/types/vector/vec2';
import { vec3 } from '../../src/types/vector/vec3';
import { vec4, Vec4 } from '../../src/types/vector/vec4';
import { Vec3 } from '../../src/types/vector/vec3';
import { Vec2 } from '../../src/types/vector/vec2';
import { Float } from '../../src/types/scalar/float';
import { fragment } from '../../src/shader/fragment';
import { fragColor } from '../../src/glsl/fragColor';
import { precision } from '../../src/glsl/precision';
import { varying } from '../../src/variables/varying';

describe('select', () =>
{
    describe('select 基本功能', () =>
    {
        it('应该返回正确的类型 - Vec4', () =>
        {
            const cond = float(1.0).greaterThan(0.5);
            const result = select(cond, vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 0.0, 1.0, 1.0));
            expect(result).toBeInstanceOf(Vec4);
        });

        it('应该返回正确的类型 - Vec3', () =>
        {
            const cond = float(1.0).greaterThan(0.5);
            const result = select(cond, vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0));
            expect(result).toBeInstanceOf(Vec3);
        });

        it('应该返回正确的类型 - Vec2', () =>
        {
            const cond = float(1.0).greaterThan(0.5);
            const result = select(cond, vec2(1.0, 0.0), vec2(0.0, 1.0));
            expect(result).toBeInstanceOf(Vec2);
        });

        it('应该返回正确的类型 - Float', () =>
        {
            const cond = float(1.0).greaterThan(0.5);
            const result = select(cond, float(1.0), float(0.0));
            expect(result).toBeInstanceOf(Float);
        });
    });

    describe('GLSL 输出', () =>
    {
        it('Vec4 类型应该生成正确的三元运算符', () =>
        {
            const cond = float(1.0).greaterThan(0.5);
            const result = select(cond, vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 0.0, 1.0, 1.0));
            expect(result.toGLSL()).toBe('(1.0 > 0.5 ? vec4(1.0, 0.0, 0.0, 1.0) : vec4(0.0, 0.0, 1.0, 1.0))');
        });

        it('Vec3 类型应该生成正确的三元运算符', () =>
        {
            const cond = float(1.0).greaterThan(0.5);
            const result = select(cond, vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0));
            expect(result.toGLSL()).toBe('(1.0 > 0.5 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 0.0, 1.0))');
        });

        it('Vec2 类型应该生成正确的三元运算符', () =>
        {
            const cond = float(1.0).greaterThan(0.5);
            const result = select(cond, vec2(1.0, 0.0), vec2(0.0, 1.0));
            expect(result.toGLSL()).toBe('(1.0 > 0.5 ? vec2(1.0, 0.0) : vec2(0.0, 1.0))');
        });

        it('Float 类型应该生成正确的三元运算符', () =>
        {
            const cond = float(1.0).greaterThan(0.5);
            const result = select(cond, float(1.0), float(0.0));
            expect(result.toGLSL()).toBe('(1.0 > 0.5 ? 1.0 : 0.0)');
        });
    });

    describe('WGSL 输出', () =>
    {
        it('Vec4 类型应该生成正确的 select() 函数调用', () =>
        {
            const cond = float(1.0).greaterThan(0.5);
            const result = select(cond, vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 0.0, 1.0, 1.0));
            // WGSL select(falseValue, trueValue, condition)
            expect(result.toWGSL()).toBe('select(vec4<f32>(0.0, 0.0, 1.0, 1.0), vec4<f32>(1.0, 0.0, 0.0, 1.0), 1.0 > 0.5)');
        });

        it('Vec3 类型应该生成正确的 select() 函数调用', () =>
        {
            const cond = float(1.0).greaterThan(0.5);
            const result = select(cond, vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0));
            expect(result.toWGSL()).toBe('select(vec3<f32>(0.0, 0.0, 1.0), vec3<f32>(1.0, 0.0, 0.0), 1.0 > 0.5)');
        });

        it('Vec2 类型应该生成正确的 select() 函数调用', () =>
        {
            const cond = float(1.0).greaterThan(0.5);
            const result = select(cond, vec2(1.0, 0.0), vec2(0.0, 1.0));
            expect(result.toWGSL()).toBe('select(vec2<f32>(0.0, 1.0), vec2<f32>(1.0, 0.0), 1.0 > 0.5)');
        });

        it('Float 类型应该生成正确的 select() 函数调用', () =>
        {
            const cond = float(1.0).greaterThan(0.5);
            const result = select(cond, float(1.0), float(0.0));
            expect(result.toWGSL()).toBe('select(0.0, 1.0, 1.0 > 0.5)');
        });
    });

    describe('数字字面量支持', () =>
    {
        it('应该支持数字作为 trueValue', () =>
        {
            const cond = float(1.0).greaterThan(0.5);
            const result = select(cond, 1.0, vec4(0.0, 0.0, 1.0, 1.0));
            expect(result.toGLSL()).toBe('(1.0 > 0.5 ? vec4(1.0) : vec4(0.0, 0.0, 1.0, 1.0))');
            expect(result.toWGSL()).toBe('select(vec4<f32>(0.0, 0.0, 1.0, 1.0), vec4<f32>(1.0), 1.0 > 0.5)');
        });

        it('应该支持数字作为 falseValue', () =>
        {
            const cond = float(1.0).greaterThan(0.5);
            const result = select(cond, vec4(1.0, 0.0, 0.0, 1.0), 0.0);
            expect(result.toGLSL()).toBe('(1.0 > 0.5 ? vec4(1.0, 0.0, 0.0, 1.0) : vec4(0.0))');
            expect(result.toWGSL()).toBe('select(vec4<f32>(0.0), vec4<f32>(1.0, 0.0, 0.0, 1.0), 1.0 > 0.5)');
        });

        it('应该支持两个数字字面量 (Float 类型)', () =>
        {
            const cond = float(1.0).greaterThan(0.5);
            const result = select(cond, 1.0, 0.0);
            expect(result).toBeInstanceOf(Float);
            expect(result.toGLSL()).toBe('(1.0 > 0.5 ? 1.0 : 0.0)');
            expect(result.toWGSL()).toBe('select(0.0, 1.0, 1.0 > 0.5)');
        });
    });

    describe('在着色器中使用 select', () =>
    {
        it('应该在片段着色器中正确生成 GLSL 代码', () =>
        {
            const color = vec4(fragColor(0, 'color'));
            const v_attr = float(varying('v_attr'));

            const fShader = fragment('main', () =>
            {
                precision('highp', 'float');

                const blue = vec4(0.0, 0.0, 1.0, 1.0);
                const yellow = vec4(1.0, 1.0, 0.0, 1.0);

                color.assign(select(v_attr.greaterThanOrEqual(0.0), blue, yellow));
            });

            const glsl = fShader.toGLSL(2);

            // 验证生成了三元运算符
            expect(glsl).toContain('color = (v_attr >= 0.0 ? vec4(0.0, 0.0, 1.0, 1.0) : vec4(1.0, 1.0, 0.0, 1.0));');
        });

        it('应该在片段着色器中正确生成 WGSL 代码', () =>
        {
            const color = vec4(fragColor(0, 'color'));
            const v_attr = float(varying('v_attr'));

            const fShader = fragment('main', () =>
            {
                precision('highp', 'float');

                const blue = vec4(0.0, 0.0, 1.0, 1.0);
                const yellow = vec4(1.0, 1.0, 0.0, 1.0);

                color.assign(select(v_attr.greaterThanOrEqual(0.0), blue, yellow));
            });

            const wgsl = fShader.toWGSL();

            // 验证生成了 select() 函数调用
            expect(wgsl).toContain('select(vec4<f32>(1.0, 1.0, 0.0, 1.0), vec4<f32>(0.0, 0.0, 1.0, 1.0), input.v_attr >= 0.0)');
        });
    });

    describe('复杂表达式', () =>
    {
        it('应该支持嵌套的 select 调用', () =>
        {
            const cond1 = float(1.0).greaterThan(0.5);
            const cond2 = float(0.3).lessThan(0.5);

            const inner = select(cond2, vec4(0.0, 1.0, 0.0, 1.0), vec4(0.0, 0.0, 1.0, 1.0));
            const result = select(cond1, vec4(1.0, 0.0, 0.0, 1.0), inner);

            // GLSL 应该生成嵌套的三元运算符
            expect(result.toGLSL()).toContain('?');
            expect(result.toGLSL()).toContain(':');

            // WGSL 应该生成嵌套的 select() 调用
            expect(result.toWGSL()).toContain('select(');
        });

        it('应该支持与其他运算符组合', () =>
        {
            const cond = float(1.0).greaterThan(0.5);
            const selected = select(cond, vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 0.0, 1.0, 1.0));
            const result = selected.multiply(0.5);

            expect(result.toGLSL()).toContain('?');
            expect(result.toGLSL()).toContain('* 0.5');

            expect(result.toWGSL()).toContain('select(');
            expect(result.toWGSL()).toContain('* 0.5');
        });
    });

    describe('比较运算符支持', () =>
    {
        it('应该支持 greaterThan 条件', () =>
        {
            const cond = float(1.0).greaterThan(0.5);
            const result = select(cond, vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 0.0, 1.0, 1.0));
            expect(result.toGLSL()).toContain('1.0 > 0.5');
            expect(result.toWGSL()).toContain('1.0 > 0.5');
        });

        it('应该支持 greaterThanOrEqual 条件', () =>
        {
            const cond = float(1.0).greaterThanOrEqual(0.5);
            const result = select(cond, vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 0.0, 1.0, 1.0));
            expect(result.toGLSL()).toContain('1.0 >= 0.5');
            expect(result.toWGSL()).toContain('1.0 >= 0.5');
        });

        it('应该支持 lessThan 条件', () =>
        {
            const cond = float(0.3).lessThan(0.5);
            const result = select(cond, vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 0.0, 1.0, 1.0));
            expect(result.toGLSL()).toContain('0.3 < 0.5');
            expect(result.toWGSL()).toContain('0.3 < 0.5');
        });

        it('应该支持 lessThanOrEqual 条件', () =>
        {
            const cond = float(0.5).lessThanOrEqual(0.5);
            const result = select(cond, vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 0.0, 1.0, 1.0));
            expect(result.toGLSL()).toContain('0.5 <= 0.5');
            expect(result.toWGSL()).toContain('0.5 <= 0.5');
        });

        it('应该支持 equals 条件', () =>
        {
            const cond = float(1.0).equals(1.0);
            const result = select(cond, vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 0.0, 1.0, 1.0));
            expect(result.toGLSL()).toContain('1.0 == 1.0');
            expect(result.toWGSL()).toContain('1.0 == 1.0');
        });

    });
});
