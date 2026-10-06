import { describe, expect, it } from 'vitest';
import { getCopyDepthTextureWGSL } from '../src/utils/copyDepthTextureWGSL';

/**
 * copyDepthTexture 的着色器（TSL 版）离线验收。
 *
 * 本次迁移是「把 TSL 引入 packages/webgpu」的第一个消费者，所以断言同时覆盖：
 * 1. 与手写 WGSL 的语义一致（textureSample + 过滤采样，不是 textureLoad）；
 * 2. TSL 的绑定展开约定（texture@0 + sampler@1），数据侧必须按这个顺序建 bindGroup。
 */
describe('copyDepthTexture 的着色器（TSL）', () =>
{
    const shader = getCopyDepthTextureWGSL();

    it('顶点：4 顶点全屏三角带（pos / tex 两组常量数组）', () =>
    {
        expect(shader.vertex).toContain('@builtin(vertex_index) vertexIndex: u32');
        expect(shader.vertex).toContain('array<vec2<f32>, 4>(vec2<f32>(-1.0, 1.0), vec2<f32>(1.0), vec2<f32>(-1.0), vec2<f32>(1.0, -1.0))[vertexIndex]');
        expect(shader.vertex).toContain('@location(0) vUV: vec2<f32>');
    });

    it('深度纹理与采样器是成对声明（texture@0 + sampler@1）', () =>
    {
        expect(shader.fragment).toContain('@binding(0) @group(0) var mySampler_texture: texture_depth_2d;');
        expect(shader.fragment).toContain('@binding(1) @group(0) var mySampler: sampler;');
    });

    it('回归：用 textureSample（过滤采样），不是 textureLoad', () =>
    {
        // 手写是 textureSample(myTexture, mySampler, Varys.vUV)——深度纹理经采样器过滤
        expect(shader.fragment).toContain('let color = textureSample(mySampler_texture, mySampler, input.vUV);');
        expect(shader.fragment).not.toContain('textureLoad(');
    });

    it('fragment 输出灰度（color 的 x 分量铺到 rgb）', () =>
    {
        expect(shader.fragment).toContain('return vec4<f32>(color.x, color.x, color.x, 1.0);');
    });
});
