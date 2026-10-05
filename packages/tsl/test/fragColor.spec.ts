import { describe, expect, it } from 'vitest';
import { fragColor, FragColor } from '../src/glsl/fragColor';
import { gl_FragColor } from '../src/glsl/builtin/builtins';
import { vec4 } from '../src/types/vector/vec4';
import { fragment } from '../src/shader/fragment';
import { precision } from '../src/glsl/precision';

describe('fragColor', () =>
{
    describe('fragColor 函数', () =>
    {
        it('应该能够创建 FragColor 实例', () =>
        {
            const fc = fragColor(0);

            expect(fc).toBeInstanceOf(FragColor);
            expect(fc.location).toBe(0);
        });

        it('应该支持不同的 location 值', () =>
        {
            const fc0 = fragColor(0);
            const fc1 = fragColor(1);
            const fc2 = fragColor(2);

            expect(fc0.location).toBe(0);
            expect(fc1.location).toBe(1);
            expect(fc2.location).toBe(2);
        });

        it('toGLSL 应该返回 fragColorX 格式', () =>
        {
            const fc0 = fragColor(0);
            const fc1 = fragColor(1);

            expect(fc0.toGLSL()).toBe('fragColor0');
            expect(fc1.toGLSL()).toBe('fragColor1');
        });

        it('toWGSL 应该返回 fragColorX 格式', () =>
        {
            const fc0 = fragColor(0);
            const fc1 = fragColor(1);

            expect(fc0.toWGSL()).toBe('fragColor0');
            expect(fc1.toWGSL()).toBe('fragColor1');
        });
    });

    describe('fragColor 与 vec4 结合使用', () =>
    {
        it('应该能够创建 vec4(fragColor) 并获取依赖', () =>
        {
            const fc = fragColor(0);
            const v = vec4(fc);

            expect(v.dependencies).toContain(fc);
        });
    });

    describe('fragColor GLSL 生成', () =>
    {
        it('应该生成单个 fragColor 输出声明', () =>
        {
            const color0 = vec4(fragColor(0));

            const frag = fragment('main', () =>
            {
                precision('highp', 'float');
                color0.assign(vec4(1.0, 0.0, 0.0, 1.0));
            });

            const glsl = frag.toGLSL(2);

            expect(glsl).toContain('#version 300 es');
            expect(glsl).toContain('layout(location = 0) out vec4 fragColor0;');
            expect(glsl).toContain('fragColor0 = vec4(1.0, 0.0, 0.0, 1.0);');
        });

        it('应该生成多个 fragColor 输出声明', () =>
        {
            const color0 = vec4(fragColor(0));
            const color1 = vec4(fragColor(1));

            const frag = fragment('main', () =>
            {
                precision('highp', 'float');
                color0.assign(vec4(1.0, 0.0, 0.0, 1.0));
                color1.assign(vec4(0.0, 0.0, 1.0, 1.0));
            });

            const glsl = frag.toGLSL(2);

            expect(glsl).toContain('layout(location = 0) out vec4 fragColor0;');
            expect(glsl).toContain('layout(location = 1) out vec4 fragColor1;');
            expect(glsl).toContain('fragColor0 = vec4(1.0, 0.0, 0.0, 1.0);');
            expect(glsl).toContain('fragColor1 = vec4(0.0, 0.0, 1.0, 1.0);');
        });

        it('应该按 location 顺序排序输出声明', () =>
        {
            const color2 = vec4(fragColor(2));
            const color0 = vec4(fragColor(0));
            const color1 = vec4(fragColor(1));

            const frag = fragment('main', () =>
            {
                precision('highp', 'float');
                color2.assign(vec4(0.0, 0.0, 1.0, 1.0));
                color0.assign(vec4(1.0, 0.0, 0.0, 1.0));
                color1.assign(vec4(0.0, 1.0, 0.0, 1.0));
            });

            const glsl = frag.toGLSL(2);

            // 验证声明顺序
            const loc0Index = glsl.indexOf('layout(location = 0)');
            const loc1Index = glsl.indexOf('layout(location = 1)');
            const loc2Index = glsl.indexOf('layout(location = 2)');

            expect(loc0Index).toBeLessThan(loc1Index);
            expect(loc1Index).toBeLessThan(loc2Index);
        });
    });

    describe('fragColor WGSL 生成', () =>
    {
        it('应该生成 FragmentOut 结构体和单个输出', () =>
        {
            const color0 = vec4(fragColor(0));

            const frag = fragment('main', () =>
            {
                precision('highp', 'float');
                color0.assign(vec4(1.0, 0.0, 0.0, 1.0));
            });

            const wgsl = frag.toWGSL();

            expect(wgsl).toContain('struct FragmentOut {');
            expect(wgsl).toContain('@location(0) fragColor0: vec4<f32>');
            expect(wgsl).toContain('fn main() -> FragmentOut {');
            expect(wgsl).toContain('var output: FragmentOut;');
            expect(wgsl).toContain('output.fragColor0 = vec4<f32>(1.0, 0.0, 0.0, 1.0);');
            expect(wgsl).toContain('return output;');
        });

        it('应该生成 FragmentOut 结构体和多个输出', () =>
        {
            const color0 = vec4(fragColor(0));
            const color1 = vec4(fragColor(1));

            const frag = fragment('main', () =>
            {
                precision('highp', 'float');
                color0.assign(vec4(1.0, 0.0, 0.0, 1.0));
                color1.assign(vec4(0.0, 0.0, 1.0, 1.0));
            });

            const wgsl = frag.toWGSL();

            expect(wgsl).toContain('struct FragmentOut {');
            expect(wgsl).toContain('@location(0) fragColor0: vec4<f32>');
            expect(wgsl).toContain('@location(1) fragColor1: vec4<f32>');
            expect(wgsl).toContain('output.fragColor0 = vec4<f32>(1.0, 0.0, 0.0, 1.0);');
            expect(wgsl).toContain('output.fragColor1 = vec4<f32>(0.0, 0.0, 1.0, 1.0);');
        });

        it('应该按 location 顺序排序结构体字段', () =>
        {
            const color2 = vec4(fragColor(2));
            const color0 = vec4(fragColor(0));
            const color1 = vec4(fragColor(1));

            const frag = fragment('main', () =>
            {
                precision('highp', 'float');
                color2.assign(vec4(0.0, 0.0, 1.0, 1.0));
                color0.assign(vec4(1.0, 0.0, 0.0, 1.0));
                color1.assign(vec4(0.0, 1.0, 0.0, 1.0));
            });

            const wgsl = frag.toWGSL();

            // 验证结构体字段顺序
            const loc0Index = wgsl.indexOf('@location(0)');
            const loc1Index = wgsl.indexOf('@location(1)');
            const loc2Index = wgsl.indexOf('@location(2)');

            expect(loc0Index).toBeLessThan(loc1Index);
            expect(loc1Index).toBeLessThan(loc2Index);
        });
    });

    describe('fragColor 与 fragmentOutput 对比', () =>
    {
        it('直接使用 fragColor 应该生成相同格式的 GLSL', () =>
        {
            // 直接使用 fragColor 的写法
            const color0 = vec4(fragColor(0));
            const color1 = vec4(fragColor(1));

            const frag = fragment('main', () =>
            {
                precision('highp', 'float');
                color0.assign(vec4(1.0, 0.0, 0.0, 1.0));
                color1.assign(vec4(0.0, 0.0, 1.0, 1.0));
            });

            const glsl = frag.toGLSL(2);

            // 验证生成的 GLSL 包含正确的输出声明
            expect(glsl).toContain('layout(location = 0) out vec4 fragColor0;');
            expect(glsl).toContain('layout(location = 1) out vec4 fragColor1;');
        });

        it('直接使用 fragColor 应该生成相同格式的 WGSL', () =>
        {
            // 直接使用 fragColor 的写法
            const color0 = vec4(fragColor(0));
            const color1 = vec4(fragColor(1));

            const frag = fragment('main', () =>
            {
                precision('highp', 'float');
                color0.assign(vec4(1.0, 0.0, 0.0, 1.0));
                color1.assign(vec4(0.0, 0.0, 1.0, 1.0));
            });

            const wgsl = frag.toWGSL();

            // 验证生成的 WGSL 包含正确的结构体和返回语句
            expect(wgsl).toContain('struct FragmentOut');
            expect(wgsl).toContain('-> FragmentOut');
            expect(wgsl).toContain('return output;');
        });
    });

    describe('WebGL 2.0 gl_FragColor 处理', () =>
    {
        it('应该在 WebGL 2.0 中将 gl_FragColor 替换为 color', () =>
        {
            const fragmentShader = fragment('main', () =>
            {
                gl_FragColor.assign(vec4(1.0, 0.0, 0.0, 1.0));
            });

            const glsl = fragmentShader.toGLSL(2);

            expect(glsl).toContain('layout(location = 0) out vec4 color;');
            expect(glsl).toContain('color = vec4(1.0, 0.0, 0.0, 1.0);');
            expect(glsl).not.toContain('gl_FragColor');
        });

        it('应该在 WebGL 1.0 中保留 gl_FragColor', () =>
        {
            const fragmentShader = fragment('main', () =>
            {
                gl_FragColor.assign(vec4(1.0, 0.0, 0.0, 1.0));
            });

            const glsl = fragmentShader.toGLSL(1);

            expect(glsl).toContain('gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);');
        });
    });
});
