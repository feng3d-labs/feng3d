import { describe, expect, it } from 'vitest';
import { attribute, fragment, return_, uniform, vec2, vec4, vertex } from '../../src/index';

describe('Vertex 和 Fragment', () =>
{
    describe('vertex() 和 fragment() 函数', () =>
    {
        it('应该能够使用 vertex() 和 fragment() 函数定义着色器', () =>
        {
            const position = attribute('position', vec2(), 0);
            const color = uniform('color', vec4(), 0, 0);

            const vertexShader = vertex('main', () =>
            {
                return_(vec4(position, 0.0, 1.0));
            });

            const fragmentShader = fragment('main', () =>
            {
                return_(color);
            });

            expect(vertexShader).toBeDefined();
            expect(fragmentShader).toBeDefined();
        });
    });

    describe('toGLSL', () =>
    {
        it('应该能够生成正确的 vertex shader GLSL 代码', () =>
        {
            const position = attribute('position', vec2(), 0);

            const vertexShader = vertex('main', () =>
            {
                return_(vec4(position, 0.0, 1.0));
            });

            const glsl = vertexShader.toGLSL();

            expect(glsl).toContain('attribute vec2 position;');
            expect(glsl).toContain('void main()');
            expect(glsl).toContain('gl_Position = vec4(position, 0.0, 1.0);');
        });

        it('应该能够生成正确的 fragment shader GLSL 代码', () =>
        {
            const color = uniform('color', vec4(), 0, 0);

            const fragmentShader = fragment('main', () =>
            {
                return_(color);
            });

            const glsl = fragmentShader.toGLSL();

            expect(glsl).toContain('uniform vec4 color;');
            expect(glsl).toContain('void main()');
            expect(glsl).toContain('gl_FragColor = color;');
        });

        it('应该只包含实际使用的 uniforms 和 attributes', () =>
        {
            const pos = attribute('pos', vec2(), 0);
            const uv = attribute('uv', vec2(), 1);
            const color = uniform('color', vec4(), 0, 0);
            const time = uniform('time', vec4(), 0, 1);

            const vertexShader = vertex('main', () =>
            {
                return_(vec4(pos, 0.0, 1.0));
            });

            const fragmentShader = fragment('main', () =>
            {
                return_(color);
            });

            const vertexGlsl = vertexShader.toGLSL();
            expect(vertexGlsl).toContain('attribute vec2 pos;');
            // uv 在 vertex shader 中没有使用，所以不应该包含
            expect(vertexGlsl).not.toContain('attribute vec2 uv;');
            // color 和 time 在 vertex shader 中没有使用，所以不应该包含
            expect(vertexGlsl).not.toContain('uniform');

            const fragmentGlsl = fragmentShader.toGLSL();
            expect(fragmentGlsl).toContain('uniform vec4 color;');
            // time 在 fragment shader 中没有使用，所以不应该包含
            expect(fragmentGlsl).not.toContain('uniform vec4 time;');
        });
    });

    describe('toWGSL', () =>
    {
        it('应该能够生成正确的 vertex shader WGSL 代码', () =>
        {
            const position = attribute('position', vec2(), 0);

            const vertexShader = vertex('main', () =>
            {
                return_(vec4(position, 0.0, 1.0));
            });

            const wgsl = vertexShader.toWGSL();

            expect(wgsl).toContain('@vertex');
            expect(wgsl).toContain('fn main');
            expect(wgsl).toContain('@location(0) position: vec2<f32>');
            expect(wgsl).toContain('return vec4<f32>(position, 0.0, 1.0);');
        });

        it('应该能够生成正确的 fragment shader WGSL 代码', () =>
        {
            const color = uniform('color', vec4(), 0, 0);

            const fragmentShader = fragment('main', () =>
            {
                return_(color);
            });

            const wgsl = fragmentShader.toWGSL();

            expect(wgsl).toContain('@fragment');
            expect(wgsl).toContain('fn main');
            expect(wgsl).toContain('color');
        });

        it('应该只包含实际使用的 uniforms 和 attributes', () =>
        {
            const position = attribute('position', vec2(), 0);
            const color = uniform('color', vec4(), 0, 0);
            const time = uniform('time', vec4(), 0, 1);

            const vertexShader = vertex('main', () =>
            {
                return_(vec4(position, 0.0, 1.0));
            });

            const fragmentShader = fragment('main', () =>
            {
                return_(color);
            });

            const vertexWgsl = vertexShader.toWGSL();
            expect(vertexWgsl).toContain('@location(0) position: vec2<f32>');
            // color 和 time 在 vertex shader 中没有使用，所以不应该包含
            expect(vertexWgsl).not.toContain('var<uniform> color');
            expect(vertexWgsl).not.toContain('var<uniform> time');

            const fragmentWgsl = fragmentShader.toWGSL();
            expect(fragmentWgsl).toContain('var<uniform> color : vec4<f32>');
            // time 在 fragment shader 中没有使用，所以不应该包含
            expect(fragmentWgsl).not.toContain('var<uniform> time');
        });
    });

});
