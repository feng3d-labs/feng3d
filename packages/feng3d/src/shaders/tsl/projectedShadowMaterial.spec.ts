import { describe, expect, it } from 'vitest';
import { getProjectedShadowShaderWGSL } from './projectedShadowMaterial';

/**
 * ProjectedShadowMaterial 的 TSL 着色器生成验收（离线）。
 *
 * 钉住与 three.js ShadowMesh 的变换顺序（世界 → 平面投影 → 相机投影）与
 * 片元输出（纯色 + 不透明度）；渲染像素一致性由 examples 的
 * webgl_shadowmesh 视觉回归另行验证。
 */
describe('ProjectedShadowMaterial 的 TSL 着色器', () =>
{
    const { vertex, fragment } = getProjectedShadowShaderWGSL();

    it('顶点着色器声明 a_position 与 transform / cameraUniforms 的同槽位绑定', () =>
    {
        expect(vertex).toContain('@location(0) a_position: vec3<f32>');
        expect(vertex).toContain('@group(0) @binding(0) var<uniform> transform: TransformUniforms;');
        expect(vertex).toContain('@group(0) @binding(1) var<uniform> cameraUniforms: CameraUniforms;');
    });

    it('顶点按「世界 → 平面投影 → 相机投影」变换（对应 three 的 shadowMatrix * meshMatrix）', () =>
    {
        expect(vertex).toContain('let worldPosition = transform.u_modelMatrix * vec4<f32>(a_position, 1.0);');
        expect(vertex).toContain('let shadowPosition = material_uniforms.u_shadowMatrix * worldPosition;');
        expect(vertex).toContain('output.position = cameraUniforms.u_viewProjection * shadowPosition;');
    });

    it('片元输出材质色与不透明度', () =>
    {
        expect(fragment).toContain('struct ProjectedShadowUniforms');
        expect(fragment).toContain('u_shadowMatrix: mat4x4<f32>');
        expect(fragment).toContain('@group(0) @binding(3) var<uniform> material_uniforms: ProjectedShadowUniforms;');
        expect(fragment).toContain('material_uniforms.u_color.x');
        expect(fragment).toContain('material_uniforms.u_opacity');
    });

    it('结果被缓存', () =>
    {
        expect(getProjectedShadowShaderWGSL()).toBe(getProjectedShadowShaderWGSL());
    });
});
