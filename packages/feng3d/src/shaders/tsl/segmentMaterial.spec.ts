import { describe, expect, it } from 'vitest';
import { getSegmentShaderWGSL } from './segmentMaterial';

/** SegmentMaterial 的 TSL 着色器生成验收（离线）。 */
describe('SegmentMaterial 的 TSL 着色器', () =>
{
    const { vertex, fragment } = getSegmentShaderWGSL();

    it('顶点着色器与 ColorMaterial 同形（position + 顶点色 varying）', () =>
    {
        expect(vertex).toContain('@location(0) a_position: vec3<f32>');
        expect(vertex).toContain('@location(1) a_color: vec4<f32>');
        expect(vertex).toContain('@group(0) @binding(0) var<uniform> transform: TransformUniforms;');
        expect(vertex).toContain('@location(0) color: vec4<f32>');
    });

    it('片元着色器声明 SegmentUniforms 的 @binding(3)', () =>
    {
        expect(fragment).toContain('struct SegmentUniforms');
        expect(fragment).toContain('u_segmentColor: vec4<f32>');
        expect(fragment).toContain('@group(0) @binding(3) var<uniform> material_uniforms: SegmentUniforms;');
    });

    it('片元逐分量相乘且 alpha 取顶点色', () =>
    {
        expect(fragment).toContain('input.color.r * material_uniforms.u_segmentColor.r');
        expect(fragment).toContain('input.color.a');
    });

    it('结果被缓存', () =>
    {
        expect(getSegmentShaderWGSL()).toBe(getSegmentShaderWGSL());
    });
});
