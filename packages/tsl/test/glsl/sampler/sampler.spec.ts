import { describe, expect, it } from 'vitest';
import { fragment } from '../../../src/shader/fragment';
import { sampler2D } from '../../../src/glsl/sampler/sampler2D';
import { sampler2DArray } from '../../../src/glsl/sampler/sampler2DArray';
import { sampler3D } from '../../../src/glsl/sampler/sampler3D';
import { depthSampler } from '../../../src/glsl/sampler/depthSampler';
import { usampler2D } from '../../../src/glsl/sampler/usampler2D';
import { uniform } from '../../../src/variables/uniform';
import { texture } from '../../../src/glsl/texture/texture';
import { vec2 } from '../../../src/types/vector/vec2';
import { vec3 } from '../../../src/types/vector/vec3';
import { return_ } from '../../../src/control/return';

describe('Sampler 类型', () =>
{
    describe('sampler2D', () =>
    {
        it('应该生成正确的 GLSL 声明', () =>
        {
            const diffuse = sampler2D(uniform('diffuse'));
            const coord = vec2(0.5, 0.5);

            const frag = fragment('main', () =>
            {
                return_(texture(diffuse, coord));
            });

            const glsl = frag.toGLSL(2);
            expect(glsl).toContain('uniform sampler2D diffuse;');
        });

        it('应该生成正确的 WGSL 声明', () =>
        {
            const diffuse = sampler2D(uniform('diffuse'));
            const coord = vec2(0.5, 0.5);

            const frag = fragment('main', () =>
            {
                return_(texture(diffuse, coord));
            });

            const wgsl = frag.toWGSL();
            expect(wgsl).toContain('var diffuse_texture: texture_2d<f32>;');
            expect(wgsl).toContain('var diffuse: sampler;');
        });
    });

    describe('sampler2DArray', () =>
    {
        it('应该生成正确的 GLSL 声明', () =>
        {
            const diffuse = sampler2DArray(uniform('diffuse'));
            const coord = vec3(0.5, 0.5, 0.0);

            const frag = fragment('main', () =>
            {
                return_(texture(diffuse, coord));
            });

            const glsl = frag.toGLSL(2);
            expect(glsl).toContain('uniform sampler2DArray diffuse;');
        });

        it('应该生成正确的 WGSL 声明', () =>
        {
            const diffuse = sampler2DArray(uniform('diffuse'));
            const coord = vec3(0.5, 0.5, 0.0);

            const frag = fragment('main', () =>
            {
                return_(texture(diffuse, coord));
            });

            const wgsl = frag.toWGSL();
            expect(wgsl).toContain('var diffuse_texture: texture_2d_array<f32>;');
        });
    });

    describe('sampler3D', () =>
    {
        it('应该创建 Sampler3D 实例', () =>
        {
            const volume = sampler3D(uniform('volume'));

            expect(volume).toBeDefined();
            expect(volume.uniform.name).toBe('volume');
        });

        it('应该返回正确的 GLSL 类型', () =>
        {
            const volume = sampler3D(uniform('volume'));

            // 测试 GLSL 采样器类型
            expect(volume['getGLSLSamplerType']()).toBe('sampler3D');
        });

        it('应该返回正确的 WGSL 纹理类型', () =>
        {
            const volume = sampler3D(uniform('volume'));

            // 测试 WGSL 纹理类型
            expect(volume['getWGSLTextureType']()).toBe('texture_3d<f32>');
        });
    });

    describe('depthSampler', () =>
    {
        it('应该创建 DepthSampler 实例', () =>
        {
            const depth = depthSampler(uniform('depthMap'));

            expect(depth).toBeDefined();
            expect(depth.uniform.name).toBe('depthMap');
        });

        it('应该返回正确的 GLSL 类型', () =>
        {
            const depth = depthSampler(uniform('depthMap'));

            // 深度纹理在 GLSL 中使用 sampler2D
            expect(depth['getGLSLSamplerType']()).toBe('sampler2D');
        });

        it('应该返回正确的 WGSL 纹理类型', () =>
        {
            const depth = depthSampler(uniform('depthMap'));

            // 深度纹理在 WGSL 中使用 texture_depth_2d
            expect(depth['getWGSLTextureType']()).toBe('texture_depth_2d');
        });

        it('应该标识为深度纹理', () =>
        {
            const depth = depthSampler(uniform('depthMap'));

            expect(depth.isDepthTexture()).toBe(true);
        });
    });

    describe('usampler2D', () =>
    {
        it('应该创建 USampler2D 实例', () =>
        {
            const data = usampler2D(uniform('dataTexture'));

            expect(data).toBeDefined();
            expect(data.uniform.name).toBe('dataTexture');
        });

        it('应该返回正确的 GLSL 类型', () =>
        {
            const data = usampler2D(uniform('dataTexture'));

            expect(data['getGLSLSamplerType']()).toBe('usampler2D');
        });

        it('应该返回正确的 WGSL 纹理类型', () =>
        {
            const data = usampler2D(uniform('dataTexture'));

            expect(data['getWGSLTextureType']()).toBe('texture_2d<u32>');
        });

        it('应该标识为无符号整数纹理', () =>
        {
            const data = usampler2D(uniform('dataTexture'));

            expect(data.isUintTexture()).toBe(true);
        });
    });
});

