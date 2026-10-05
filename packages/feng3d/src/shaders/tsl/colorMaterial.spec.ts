import { describe, expect, it } from 'vitest';
import { getColorShaderWGSL } from './colorMaterial';

/**
 * ColorMaterial 的 TSL 着色器生成验收（离线）。
 *
 * 断言生成结果保留迁移前手写版本的全部结构约定；渲染像素级一致由 examples 的
 * e2e「改动前后对比」另行验证（本机 3000 端口会被编辑器 dev server 占用）。
 */
describe('ColorMaterial 的 TSL 着色器', () =>
{
    const { vertex, fragment } = getColorShaderWGSL();

    it('顶点着色器保留 attributes 的 location 约定', () =>
    {
        expect(vertex).toContain('@location(0) a_position: vec3<f32>');
        expect(vertex).toContain('@location(1) a_color: vec4<f32>');
    });

    it('顶点着色器声明同槽位的 transform / cameraUniforms', () =>
    {
        expect(vertex).toContain('@group(0) @binding(0) var<uniform> transform: TransformUniforms;');
        expect(vertex).toContain('@group(0) @binding(1) var<uniform> cameraUniforms: CameraUniforms;');
    });

    it('顶点着色器把顶点色传给 varying', () =>
    {
        expect(vertex).toContain('transform.u_modelMatrix * vec4<f32>(a_position, 1.0)');
        expect(vertex).toContain('@location(0) color: vec4<f32>');
    });

    it('片元着色器声明材质 uniform 的 @binding(3)', () =>
    {
        expect(fragment).toContain('struct ColorUniforms');
        expect(fragment).toContain('u_diffuseInput: vec4<f32>');
        expect(fragment).toContain('@group(0) @binding(3) var<uniform> material_uniforms: ColorUniforms;');
    });

    it('片元逐分量相乘且 alpha 取顶点色（历史规避：uniform 的 alpha 恒为 0）', () =>
    {
        expect(fragment).toContain('input.color.r * material_uniforms.u_diffuseInput.r');
        expect(fragment).toContain('input.color.g * material_uniforms.u_diffuseInput.g');
        expect(fragment).toContain('input.color.b * material_uniforms.u_diffuseInput.b');
        expect(fragment).toContain('input.color.a');
    });

    it('结果被缓存', () =>
    {
        expect(getColorShaderWGSL()).toBe(getColorShaderWGSL());
    });
});
