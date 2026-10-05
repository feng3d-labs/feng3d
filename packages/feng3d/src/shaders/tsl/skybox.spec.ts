import { describe, expect, it } from 'vitest';
import { getSkyBoxShaderWGSL } from './skybox';

/**
 * 天空盒的 TSL 着色器生成验收（离线）。
 *
 * 迁移前的内联 `skyboxWGSL` 已删除，内容由本模块生成。
 */
describe('天空盒的 TSL 着色器', () =>
{
    const { vertex, fragment } = getSkyBoxShaderWGSL();

    it('顶点着色器用 @builtin(vertex_index) 与 36 个顶点的常量数组', () =>
    {
        expect(vertex).toContain('@builtin(vertex_index) vertexIndex: u32');
        expect(vertex).toContain('const pos: array<vec3<f32>, 36> = array<vec3<f32>, 36>(');
        expect(vertex).toContain('let p = pos[i32(vertexIndex)]');
        expect(vertex).toContain('@location(0) dir: vec3<f32>');
    });

    it('顶点着色器去掉视图矩阵的平移分量并取 xyww', () =>
    {
        expect(vertex).toContain('cameraUniforms.u_viewMatrix[0].xyz');
        expect(vertex).toContain('cameraUniforms.u_viewMatrix[1].xyz');
        expect(vertex).toContain('cameraUniforms.u_viewMatrix[2].xyz');
        expect(vertex).toContain('mat4x4<f32>(');
        expect(vertex).toContain('output.position = vec4<f32>(vec3<f32>(clipPos.xy, clipPos.w), clipPos.w);');
    });

    it('片元着色器声明 group 1 的 cube 采样器（TSL 展开格式）', () =>
    {
        expect(fragment).toContain('@binding(0) @group(1) var s_skyboxTexture_texture: texture_cube<f32>;');
        expect(fragment).toContain('@binding(1) @group(1) var s_skyboxTexture: sampler;');
        expect(fragment).toContain('textureSample(s_skyboxTexture_texture, s_skyboxTexture, input.dir)');
    });

    it('结果被缓存', () =>
    {
        expect(getSkyBoxShaderWGSL()).toBe(getSkyBoxShaderWGSL());
    });
});
