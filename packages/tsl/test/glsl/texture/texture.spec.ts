import { describe, expect, it } from 'vitest';
import { fragment } from '../../../src/shader/fragment';
import { sampler2D } from '../../../src/glsl/sampler/sampler2D';
import { sampler2DArray } from '../../../src/glsl/sampler/sampler2DArray';
import { texture } from '../../../src/glsl/texture/texture';
import { int } from '../../../src/types/scalar/int';
import { vec2 } from '../../../src/types/vector/vec2';
import { vec3 } from '../../../src/types/vector/vec3';
import { vec4 } from '../../../src/types/vector/vec4';
import { uniform } from '../../../src/variables/uniform';
import { return_ } from '../../../src/control/return';

describe('texture', () =>
{
    describe('texture 函数 - 2D纹理', () =>
    {
        it('应该能够使用 vec2 坐标采样2D纹理', () =>
        {
            const diffuse = sampler2D(uniform('diffuse'));
            const coord = vec2(0.5, 0.5);

            const frag = fragment('main', () =>
            {
                return_(texture(diffuse, coord));
            });

            const glsl = frag.toGLSL(2);
            expect(glsl).toContain('uniform sampler2D diffuse;');
            expect(glsl).toContain('color = texture(diffuse, vec2(0.5));');

            const wgsl = frag.toWGSL();
            expect(wgsl).toContain('var diffuse_texture: texture_2d<f32>;');
            expect(wgsl).toContain('textureSample(diffuse_texture, diffuse, vec2<f32>(0.5))');
        });

        it('应该在 WebGL 1.0 中使用 texture2D', () =>
        {
            const diffuse = sampler2D(uniform('diffuse'));
            const coord = vec2(0.5, 0.5);

            const frag = fragment('main', () =>
            {
                return_(texture(diffuse, coord));
            });

            const glsl = frag.toGLSL(1);
            expect(glsl).toContain('gl_FragColor = texture2D(diffuse, vec2(0.5));');
        });
    });

    describe('texture 函数 - 纹理数组（vec3坐标）', () =>
    {
        it('应该能够使用 vec3 坐标采样纹理数组', () =>
        {
            const diffuse = sampler2DArray(uniform('diffuse'));
            const coord = vec3(0.5, 0.5, 1.0);

            const frag = fragment('main', () =>
            {
                return_(texture(diffuse, coord));
            });

            const glsl = frag.toGLSL(2);
            expect(glsl).toContain('uniform sampler2DArray diffuse;');
            expect(glsl).toMatch(/color\s*=\s*texture\(diffuse,\s*vec3\(0\.5,\s*0\.5,\s*1\.0\)\)/);

            const wgsl = frag.toWGSL();
            expect(wgsl).toContain('var diffuse_texture: texture_2d_array<f32>;');
            expect(wgsl).toContain('textureSample(diffuse_texture, diffuse, vec3<f32>(0.5, 0.5, 1.0))');
        });
    });

    describe('texture 函数 - 纹理数组（vec2 + int）', () =>
    {
        it('应该能够使用 vec2 和 int 参数采样纹理数组', () =>
        {
            const diffuse = sampler2DArray(uniform('diffuse'));
            const coord = vec2(0.5, 0.5);
            const layer = uniform('layer', int());

            const frag = fragment('main', () =>
            {
                return_(texture(diffuse, coord, layer));
            });

            const glsl = frag.toGLSL(2);
            expect(glsl).toContain('uniform sampler2DArray diffuse;');
            expect(glsl).toContain('uniform int layer;');
            expect(glsl).toContain('color = texture(diffuse, vec3(vec2(0.5), float(layer)));');

            const wgsl = frag.toWGSL();
            expect(wgsl).toContain('var diffuse_texture: texture_2d_array<f32>;');
            expect(wgsl).toContain('var<uniform> layer : i32;');
            expect(wgsl).toContain('textureSample(diffuse_texture, diffuse, vec2<f32>(0.5), layer)');
        });

        it('应该能够使用 vec2 和 int 字面量采样纹理数组', () =>
        {
            const diffuse = sampler2DArray(uniform('diffuse'));
            const coord = vec2(0.5, 0.5);
            const layer = int(2);

            const frag = fragment('main', () =>
            {
                return_(texture(diffuse, coord, layer));
            });

            const glsl = frag.toGLSL(2);
            expect(glsl).toContain('uniform sampler2DArray diffuse;');
            expect(glsl).toContain('color = texture(diffuse, vec3(vec2(0.5), float(2)));');

            const wgsl = frag.toWGSL();
            expect(wgsl).toContain('var diffuse_texture: texture_2d_array<f32>;');
            expect(wgsl).toContain('textureSample(diffuse_texture, diffuse, vec2<f32>(0.5), 2);');
        });
    });
});

