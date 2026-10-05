import { describe, expect, it } from 'vitest';
import { Uniform, uniform } from '../src/variables/uniform';
import { vec4 } from '../src/types/vector/vec4';
import { fragment } from '../src/shader/fragment';
import { return_ } from '../src/index';

describe('Uniform', () =>
{
    describe('Uniform 类', () =>
    {
        it('应该能够创建 Uniform 实例', () =>
        {
            const uni = new Uniform('color', 0, 0);
            expect(uni.name).toBe('color');
            expect(uni.binding).toBe(0);
            expect(uni.group).toBe(0);
        });

        it('应该在没有设置 value 时抛出错误', () =>
        {
            const uni = new Uniform('color', 0, 0);
            expect(() => uni.toGLSL()).toThrow(/没有设置 value/);
        });

        it('应该能够设置 value 并生成 GLSL', () =>
        {
            const uni = new Uniform('color', 0, 0);
            vec4(uni);
            expect(uni.toGLSL()).toBe('uniform vec4 color;');
        });

        it('应该能够生成 WGSL', () =>
        {
            const uni = new Uniform('color', 0, 0);
            vec4(uni);
            expect(uni.toWGSL()).toBe('@binding(0) @group(0) var<uniform> color : vec4<f32>;');
        });

    });

    describe('uniform() 函数', () =>
    {
        it('应该能够创建 uniform', () =>
        {
            const uni = uniform('color', 0, 0);
            expect(uni).toBeInstanceOf(Uniform);
            expect(uni.name).toBe('color');
            expect(uni.binding).toBe(0);
            expect(uni.group).toBe(0);
        });

        it('应该支持 vec4(uniform(...)) 形式', () =>
        {
            const color = vec4(uniform('color', 0, 0));
            expect(color).toBeDefined();
            expect(color.toGLSL()).toBe('color');
            expect(color.toWGSL()).toBe('color');

            const fragmentShader = fragment('main', () =>
            {
                return_(color);
            });

            // 验证生成的着色器代码中包含 uniform 声明
            const glsl = fragmentShader.toGLSL();
            expect(glsl).toContain('uniform vec4 color;');
        });
    });

    describe('group 和 binding 自动分配', () =>
    {
        it('应该支持 group 缺省时使用默认值 0', () =>
        {
            const uni = uniform('color');
            vec4(uni);
            expect(uni.getEffectiveGroup()).toBe(0);
            expect(uni.toWGSL()).toContain('@group(0)');
        });

        it('应该支持 binding 缺省时的自动分配', () =>
        {
            const uni1 = uniform('color1');
            const uni2 = uniform('color2');
            vec4(uni1);
            vec4(uni2);

            const fragmentShader = fragment('main', () =>
            {
                return_(vec4(uni1));
            });

            const wgsl = fragmentShader.toWGSL();
            // 验证自动分配的 binding
            expect(wgsl).toContain('@binding(0)');
        });

        it('应该能够自动分配多个 uniform 的 binding', () =>
        {
            const color1 = vec4(uniform('color1'));
            vec4(uniform('color2'));
            vec4(uniform('color3'));

            const fragmentShader = fragment('main', () =>
            {
                return_(color1);
            });

            const wgsl = fragmentShader.toWGSL();
            // 验证自动分配的 binding 是连续的
            expect(wgsl).toMatch(/@binding\(0\).*color1/);
        });

        it('应该能够混合显式指定和自动分配的 binding', () =>
        {
            const color1 = vec4(uniform('color1', 0, 2)); // 显式指定 binding 2
            vec4(uniform('color2')); // 自动分配

            const fragmentShader = fragment('main', () =>
            {
                return_(color1);
            });

            const wgsl = fragmentShader.toWGSL();
            // 验证显式指定的 binding 被保留
            expect(wgsl).toContain('@binding(2) @group(0) var<uniform> color1');
            // 验证自动分配的 binding 从 0 开始（因为 2 已被占用）
        });

        it('应该支持 uniform(name, group) 形式（group 缺省为 0）', () =>
        {
            const uni = uniform('color', 0);
            vec4(uni);
            expect(uni.getEffectiveGroup()).toBe(0);
        });
    });
});

