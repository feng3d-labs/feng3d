import { describe, expect, it } from 'vitest';
import { getTextureInvertYPremultiplyAlphaWGSL } from '../src/utils/textureInvertYPremultiplyAlphaWGSL';

/**
 * textureInvertYPremultiplyAlpha 的着色器（TSL 版）离线验收。
 */
describe('textureInvertYPremultiplyAlpha 的着色器（TSL）', () =>
{
    const shader = getTextureInvertYPremultiplyAlphaWGSL();

    it('两个 u32 override（原手写是 bool，但 WebGPU constants 只能传 number，无法覆盖 bool）', () =>
    {
        expect(shader.vertex).toContain('override invertY: u32 = 0u;');
        expect(shader.vertex).toContain('override premultiplyAlpha: u32 = 0u;');
    });

    it('纹理与采样器成对声明（texture@0 + sampler@1）且是过滤采样', () =>
    {
        expect(shader.fragment).toContain('@binding(0) @group(0) var mySampler_texture: texture_2d<f32>;');
        expect(shader.fragment).toContain('@binding(1) @group(0) var mySampler: sampler;');
        expect(shader.fragment).toContain('let color = textureSample(mySampler_texture, mySampler, input.vUV);');
        expect(shader.fragment).not.toContain('textureLoad(');
    });

    it('invertY 在顶点里翻转 vUV.y（分量赋值）', () =>
    {
        expect(shader.vertex).toContain('if ((invertY == 1u)) {');
        expect(shader.vertex).toContain('output.vUV.y = 1.0 - output.vUV.y;');
    });

    it('premultiplyAlpha 在片元里预乘 alpha', () =>
    {
        expect(shader.fragment).toContain('if ((premultiplyAlpha == 1u)) {');
        expect(shader.fragment).toContain('let a = color.w;');
        expect(shader.fragment).toContain('color = vec4<f32>(color.x * a, color.y * a, color.z * a, a);');
    });
});
