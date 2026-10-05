import { describe, expect, it } from 'vitest';
import { getShadowVertexShaderWGSL } from './shadow';

/**
 * 阴影 Pass 顶点着色器的 TSL 生成验收（离线）。
 *
 * 这是**文件级** WGSL 迁移的验收：迁移前的 `shaders/shadow.vertex.wgsl.ts` 已删除，
 * 其内容由本模块生成。
 */
describe('阴影 Pass 的 TSL 顶点着色器', () =>
{
    const wgsl = getShadowVertexShaderWGSL();

    it('保留 position 的 location 约定与 worldPosition varying', () =>
    {
        expect(wgsl).toContain('@location(0) a_position: vec3<f32>');
        expect(wgsl).toContain('@location(0) worldPosition: vec3<f32>');
        expect(wgsl).toContain('struct VertexOutput');
    });

    it('用精简的 ShadowCameraUniforms（只有 u_viewProjection）', () =>
    {
        expect(wgsl).toContain('struct ShadowCameraUniforms');
        expect(wgsl).toContain('u_viewProjection: mat4x4<f32>');
        expect(wgsl).toContain('@group(0) @binding(1) var<uniform> cameraUniforms: ShadowCameraUniforms;');
        // 不应出现完整相机结构体的其它字段
        expect(wgsl).not.toContain('u_projectionMatrix');
        expect(wgsl).not.toContain('u_cameraPos');
    });

    it('变换链与手写版本同形', () =>
    {
        expect(wgsl).toContain('let worldPosition = transform.u_modelMatrix * vec4<f32>(a_position, 1.0)');
        expect(wgsl).toContain('cameraUniforms.u_viewProjection * worldPosition');
        expect(wgsl).toContain('worldPosition.xyz');
        expect(wgsl).toContain('@vertex');
    });

    it('结果被缓存', () =>
    {
        expect(getShadowVertexShaderWGSL()).toBe(getShadowVertexShaderWGSL());
    });
});
