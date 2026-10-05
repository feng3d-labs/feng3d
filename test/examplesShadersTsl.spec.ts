import { describe, expect, it } from 'vitest';
import { getBasicVertWGSL } from '../packages/webgpu/examples/src/shaders-tsl/basicVert';
import { getBlackFragWGSL } from '../packages/webgpu/examples/src/shaders-tsl/blackFrag';
import { getFullscreenTexturedQuadWGSL } from '../packages/webgpu/examples/src/shaders-tsl/fullscreenTexturedQuad';
import { getInstancedVertWGSL } from '../packages/webgpu/examples/src/shaders-tsl/instancedVert';
import { getSampleTextureFragWGSL } from '../packages/webgpu/examples/src/shaders-tsl/sampleTextureFrag';
import { getSampleTextureMixColorFragWGSL } from '../packages/webgpu/examples/src/shaders-tsl/sampleTextureMixColorFrag';
import { getTriangleVertWGSL } from '../packages/webgpu/examples/src/shaders-tsl/triangleVert';
import { getVertexPositionColorFragWGSL } from '../packages/webgpu/examples/src/shaders-tsl/vertexPositionColorFrag';

/**
 * examples 共享着色器的 TSL 版验收（issue #712）。
 *
 * 这些 TSL 版替代 `packages/webgpu/examples/src/shaders/*.wgsl`，断言的是与原手写文件
 * **逐行对应**的关键片段（binding / location / 表达式顺序）。
 *
 * 注：examples 的 webgpu 示例**没有 e2e 画面覆盖**（e2e 清单里 0 条 webgpu 示例），
 * 所以这里用离线断言守住"生成结果与手写一致"，画面验证是 #712 的已知欠账。
 */
describe('examples 共享着色器的 TSL 版（#712）', () =>
{
    it('black.frag：常量黑色输出', () =>
    {
        const wgsl = getBlackFragWGSL();
        expect(wgsl).toContain('@fragment');
        expect(wgsl).toContain('return vec4<f32>(0.0, 0.0, 0.0, 1.0);');
    });

    it('triangle.vert：vertex_index + 3 顶点常量数组', () =>
    {
        const wgsl = getTriangleVertWGSL();
        expect(wgsl).toContain('@builtin(vertex_index) vertexIndex: u32');
        expect(wgsl).toContain('var pos: array<vec2<f32>, 3> = array<vec2<f32>, 3>(');
        expect(wgsl).toContain('let p = pos[i32(vertexIndex)]');
        expect(wgsl).toContain('output.position = vec4<f32>(vec3<f32>(p, 0.0), 1.0);');
    });

    it('basic.vert：uniform + 两个 attribute + 两个 varying', () =>
    {
        const wgsl = getBasicVertWGSL();
        expect(wgsl).toContain('struct Uniforms');
        expect(wgsl).toContain('modelViewProjectionMatrix: mat4x4<f32>');
        expect(wgsl).toContain('@group(0) @binding(0) var<uniform> uniforms: Uniforms;');
        expect(wgsl).toContain('@location(0) position: vec4<f32>');
        expect(wgsl).toContain('@location(1) uv: vec2<f32>');
        expect(wgsl).toContain('@location(0) fragUV: vec2<f32>');
        expect(wgsl).toContain('@location(1) fragPosition: vec4<f32>');
        expect(wgsl).toContain('output.position = uniforms.modelViewProjectionMatrix * position;');
        expect(wgsl).toContain('(position + vec4<f32>(1.0)) * 0.5');
    });

    it('instanced.vert：mat4 数组 + instance_index', () =>
    {
        const wgsl = getInstancedVertWGSL();
        expect(wgsl).toContain('modelViewProjectionMatrix: array<mat4x4<f32>, 16>');
        expect(wgsl).toContain('@builtin(instance_index) instanceIndex: u32');
        expect(wgsl).toContain('uniforms.modelViewProjectionMatrix[i32(instanceIndex)] * position');
    });

    it('vertexPositionColor.frag：保留 fragUV 的 varying 声明（否则 location 错位）', () =>
    {
        const wgsl = getVertexPositionColorFragWGSL();
        expect(wgsl).toContain('@location(0) fragUV: vec2<f32>');
        expect(wgsl).toContain('@location(1) fragPosition: vec4<f32>');
        expect(wgsl).toContain('return input.fragPosition;');
    });

    it('sampleTexture.frag / sampleTextureMixColor.frag：纹理采样（TSL 展开格式）', () =>
    {
        const plain = getSampleTextureFragWGSL();
        expect(plain).toContain(': texture_2d<f32>;');
        expect(plain).toContain(': sampler;');
        expect(plain).toContain('textureSample(');

        const mix = getSampleTextureMixColorFragWGSL();
        expect(mix).toContain('* input.fragPosition');
    });

    it('fullscreenTexturedQuad：两个数组字面量 + vertex / fragment 两个入口', () =>
    {
        const wgsl = getFullscreenTexturedQuadWGSL();
        expect(wgsl).toContain('fn vert_main(');
        expect(wgsl).toContain('fn frag_main(');
        expect((wgsl.match(/var (pos|uv): array<vec2<f32>, 6> = array<vec2<f32>, 6>\(/g) ?? []).length).toBe(2);
    });
});
