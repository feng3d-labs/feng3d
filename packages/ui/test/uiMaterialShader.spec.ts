/**
 * UI 材质着色器（TSL 版）离线验收。
 *
 * 这是 feng3d 侧**最后一份**内联手写 WGSL——迁完后 feng3d / ui 的内联 WGSL 清零。
 */
import { describe, expect, it } from 'vitest';
import { getUIMaterialShaderWGSL } from '../src/core/uiMaterialShader';

describe('UI 材质着色器（TSL）', () =>
{
    const shader = getUIMaterialShaderWGSL();

    it('绑定点位与手写一致（transform@0 / camera@1 / global@2 / material@3）', () =>
    {
        expect(shader.vertex).toContain('@group(0) @binding(0) var<uniform> transform: TransformUniforms;');
        expect(shader.vertex).toContain('@group(0) @binding(1) var<uniform> cameraUniforms: CameraUniforms;');
        expect(shader.vertex).toContain('@group(0) @binding(2) var<uniform> globalUniforms: GlobalUniforms;');
        expect(shader.vertex).toContain('@group(0) @binding(3) var<uniform> material_uniforms: UIUniforms;');
    });

    it('顶点输入与 varying 与手写一致', () =>
    {
        expect(shader.vertex).toContain('@location(0) a_position: vec3<f32>');
        expect(shader.vertex).toContain('@location(3) a_uv: vec2<f32>');
        expect(shader.vertex).toContain('@location(0) uv: vec2<f32>');
    });

    it('两条投影路径（世界空间镜像 y / 屏幕空间 NDC）', () =>
    {
        expect(shader.vertex).toContain('if (material_uniforms.u_projection.x > 0.5) {');
        expect(shader.vertex).toContain('cameraUniforms.u_viewProjection * vec4<f32>(worldPosition.x, 0.0 - worldPosition.y');
        expect(shader.vertex).toContain('worldPosition.x / globalUniforms.u_Viewport.x * 2.0 - 1.0');
        expect(shader.vertex).toContain('1.0 - worldPosition.y / globalUniforms.u_Viewport.y * 2.0');
    });

    it('采样器展开：texture 在 binding 0、sampler 在 binding 1（与手写相反，数据侧已跟着改）', () =>
    {
        expect(shader.fragment).toContain('@binding(0) @group(1) var s_texture_texture: texture_2d<f32>;');
        expect(shader.fragment).toContain('@binding(1) @group(1) var s_texture: sampler;');
        expect(shader.fragment).toContain('textureSample(s_texture_texture, s_texture, input.uv)');
    });

    it('片元逐分量相乘（规避 uniform alpha 为 0 的老坑）', () =>
    {
        for (const c of ['x', 'y', 'z', 'w'])
        {
            expect(shader.fragment).toContain(`textureColor.${c} * material_uniforms.u_color.${c}`);
        }
    });
});
