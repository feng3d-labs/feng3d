import { describe, expect, it } from 'vitest';
import { getPointShaderWGSL } from './pointMaterial';

/** PointMaterial 的 TSL 着色器生成验收（离线）。 */
describe('PointMaterial 的 TSL 着色器', () =>
{
    const { vertex, fragment } = getPointShaderWGSL();

    it('顶点着色器保留三个 attribute 的 location 约定', () =>
    {
        expect(vertex).toContain('@location(0) a_position: vec3<f32>');
        expect(vertex).toContain('@location(1) a_color: vec4<f32>');
        expect(vertex).toContain('@location(2) a_uv: vec2<f32>');
    });

    it('顶点着色器声明四个同槽位 uniform（transform / camera / global / material）', () =>
    {
        expect(vertex).toContain('@group(0) @binding(0) var<uniform> transform: TransformUniforms;');
        expect(vertex).toContain('@group(0) @binding(1) var<uniform> cameraUniforms: CameraUniforms;');
        expect(vertex).toContain('@group(0) @binding(2) var<uniform> globalUniforms: GlobalUniforms;');
        expect(vertex).toContain('@group(0) @binding(3) var<uniform> material_uniforms: PointUniforms;');
    });

    it('顶点着色器做 billboard 展开（NDC 偏移 + 透视修正）', () =>
    {
        // 三个中间值都用 let_ 生成 WGSL 局部变量（与手写版本同形；否则会被内联成重复表达式、并改变浮点结合顺序）
        expect(vertex).toContain('let clipPos = cameraUniforms.u_viewProjection * worldPosition');
        expect(vertex).toContain('let ndcOffset = a_uv * material_uniforms.u_PointSize / globalUniforms.u_Viewport * 2');
        expect(vertex).toContain('clipPos.xy + ndcOffset * clipPos.w');
        expect(vertex).toContain('let worldPosition = transform.u_modelMatrix');
    });

    it('片元着色器用 u_color 与顶点色相乘、alpha 取顶点色', () =>
    {
        expect(fragment).toContain('struct PointUniforms');
        expect(fragment).toContain('u_PointSize: f32');
        expect(fragment).toContain('input.color.xyz * material_uniforms.u_color.xyz');
        expect(fragment).toContain('input.color.a');
    });

    it('结果被缓存', () =>
    {
        expect(getPointShaderWGSL()).toBe(getPointShaderWGSL());
    });
});
