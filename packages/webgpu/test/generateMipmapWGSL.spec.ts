import { describe, expect, it } from 'vitest';
import { getGenerateMipmap3DWGSL, getGenerateMipmapWGSL } from '../src/utils/generateMipmapWGSL';

/**
 * generate-mipmap 的三段着色器（TSL 版）离线验收。
 */
describe('generate-mipmap 的着色器（TSL）', () =>
{
    const two = getGenerateMipmapWGSL(false);
    const array = getGenerateMipmapWGSL(true);
    const three = getGenerateMipmap3DWGSL('rgba8unorm');

    it('2D：单三角形 + UV 的 Y 翻转变换', () =>
    {
        expect(two.vertex).toContain('@builtin(vertex_index) vertexIndex: u32');
        expect(two.vertex).toContain('array<vec2<f32>, 3>(vec2<f32>(-1.0), vec2<f32>(-1.0, 3.0), vec2<f32>(3.0, -1.0))[vertexIndex]');
        expect(two.vertex).toContain('output.texcoord = xy * (vec2<f32>(0.5, -0.5)) + vec2<f32>(0.5);');
    });

    it('2D：texture_2d + 采样器，texcoord 直接用', () =>
    {
        expect(two.fragment).toContain('var ourSampler_texture: texture_2d<f32>;');
        expect(two.fragment).toContain('var ourSampler: sampler;');
        expect(two.fragment).toContain('return textureSample(ourSampler_texture, ourSampler, input.texcoord);');
    });

    it('2D-array：texture_2d_array + 采样坐标带 z 分量（等价于手写的 `, 0u`）', () =>
    {
        expect(array.fragment).toContain('var ourSampler_texture: texture_2d_array<f32>;');
        expect(array.fragment).toContain('return textureSample(ourSampler_texture, ourSampler, vec3<f32>(input.texcoord, 0.0));');
    });

    it('回归：2D-array 只能有一套纹理/采样器声明（分支漏写 else 会生成两套）', () =>
    {
        expect(array.fragment.match(/var ourSampler_texture/g)?.length).toBe(1);
        expect(array.fragment.match(/return textureSample/g)?.length).toBe(1);
    });

    it('3D：compute + 存储纹理 + 越界提前返回', () =>
    {
        expect(three).toContain('@compute @workgroup_size(4, 4, 4)');
        expect(three).toContain('var outputTexture: texture_storage_3d<rgba8unorm, write>;');
        expect(three).toContain('var inputTexture_texture: texture_3d<f32>;');
        expect(three).toContain('var inputTexture: sampler;');
        expect(three).toMatch(/if \([^\n]*\) \{\n\s+return;\n\s+\}/);
    });

    it('3D：归一化坐标 + textureSampleLevel + textureStore（用 let 缓存尺寸，避免重复求值）', () =>
    {
        expect(three).toContain('let outputSize = textureDimensions(outputTexture);');
        expect(three).toContain('let texCoord = (idF + vec3<f32>(0.5)) / sizeF;');
        expect(three).toContain('let color = textureSampleLevel(inputTexture_texture, inputTexture, texCoord, 0.0);');
        expect(three).toContain('textureStore(outputTexture, globalInvocationId, color);');
    });
});
