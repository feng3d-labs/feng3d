import { describe, expect, it } from 'vitest';
import { getTextureShaderWGSL } from './textureMaterial';

/** TextureMaterial 的 TSL 着色器生成验收（离线）。 */
describe('TextureMaterial 的 TSL 着色器', () =>
{
    const { vertex, fragment } = getTextureShaderWGSL();

    it('顶点着色器保留 attributes 的 location 约定（0 位置 / 3 uv）', () =>
    {
        expect(vertex).toContain('@location(0) a_position: vec3<f32>');
        expect(vertex).toContain('@location(3) a_uv: vec2<f32>');
        expect(vertex).toContain('let worldPosition = transform.u_modelMatrix * vec4<f32>(a_position, 1.0)');
        expect(vertex).toContain('@location(0) uv: vec2<f32>');
    });

    it('片元着色器声明材质 uniform 与 group 1 的采样器（TSL 展开格式）', () =>
    {
        expect(fragment).toContain('@group(0) @binding(3) var<uniform> material_uniforms: TextureUniforms;');
        expect(fragment).toContain('@binding(0) @group(1) var s_texture_texture: texture_2d<f32>;');
        expect(fragment).toContain('@binding(1) @group(1) var s_texture: sampler;');
    });

    it('片元着色器用 textureSample 采样并与 u_color 逐分量相乘', () =>
    {
        expect(fragment).toContain('textureSample(s_texture_texture, s_texture, input.uv)');
        expect(fragment).toContain('texColor.xyz * tint.xyz');
        expect(fragment).toContain('texColor.a');
    });

    it('结果被缓存', () =>
    {
        expect(getTextureShaderWGSL()).toBe(getTextureShaderWGSL());
    });
});
