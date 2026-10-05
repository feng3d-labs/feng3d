import { describe, expect, it } from 'vitest';
import { getBasicVertWGSL } from '../packages/webgpu/examples/src/shaders-tsl/basicVert';
import { getBlackFragWGSL } from '../packages/webgpu/examples/src/shaders-tsl/blackFrag';
import { getFullscreenTexturedQuadWGSL } from '../packages/webgpu/examples/src/shaders-tsl/fullscreenTexturedQuad';
import { getHelloTriangleWGSL } from '../packages/webgpu/examples/src/shaders-tsl/helloTriangle';
import { getMultipleCanvasesWGSL } from '../packages/webgpu/examples/src/shaders-tsl/multipleCanvases';
import { getRenderObjectChangesVariantWGSL } from '../packages/webgpu/examples/src/shaders-tsl/renderObjectChangesVariant';
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

    it('helloTriangle / RenderObjectChanges：裸 vec4 uniform + 最简三角形', () =>
    {
        const { vertex, fragment } = getHelloTriangleWGSL();
        expect(vertex).toContain('@location(0) position: vec2<f32>');
        expect(vertex).toContain('output.position = vec4<f32>(vec3<f32>(position, 0.0), 1.0);');
        expect(fragment).toContain('var<uniform> color : vec4<f32>;');
        expect(fragment).toContain('return color;');
    });

    it('multipleCanvases：vertex 与 fragment 各自自包含（同一 Uniforms 不去重）', () =>
    {
        const { vertex, fragment } = getMultipleCanvasesWGSL();
        expect(vertex).toContain('@vertex');
        expect(vertex).toContain('fn vs(');
        expect(vertex).toContain('worldViewProjectionMatrix');
        expect(fragment).toContain('@fragment');
        expect(fragment).toContain('fn fs(');
        // fragment 侧也带自己的 Uniforms 声明——引擎把两份 code 分别编译成两个 module，
        // 所以这不是重复定义（曾经把它们拼成一份导致全黑，见 PR 说明）
        expect(fragment).toContain('uniform> uni: Uniforms;');
    });

    it('RenderObjectChanges 的运行时替换变体：swizzle 赋值改成整体赋值', () =>
    {
        const { vertex, fragment } = getRenderObjectChangesVariantWGSL();
        expect(vertex).toContain('var pos = position;');
        expect(vertex).toContain('pos = vec2<f32>(position.x + 0.5, position.y);');
        expect(fragment).toContain('var col = color;');
        expect(fragment).toContain('col = vec4<f32>(0.5, 0.6, 0.7, color.w);');
    });
});
