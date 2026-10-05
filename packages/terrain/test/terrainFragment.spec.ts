import { describe, expect, it } from 'vitest';
import { getTerrainFragmentWGSL } from '../src/terrainFragment';

/**
 * 地形片段着色器的 TSL 生成验收（离线）。
 *
 * 它复用 feng3d 的标准片段数据流（`buildStandardFragment`），只派生三处：
 * TerrainUniforms（多 u_splatRepeats）、diffuse 之后的 splat 混合、无 envmap。
 */
describe('地形片段着色器的 TSL 生成', () =>
{
    const wgsl = getTerrainFragmentWGSL();
    const main = wgsl.slice(wgsl.indexOf('fn main('));

    it('uniform 结构是 TerrainUniforms（含 u_splatRepeats）', () =>
    {
        expect(wgsl).toContain('struct TerrainUniforms');
        expect(wgsl).toContain('u_splatRepeats: vec4<f32>');
        expect(wgsl).toContain('@group(0) @binding(3) var<uniform> material_uniforms: TerrainUniforms;');
    });

    it('不包含 envmap 步骤（地形不反射；注意 u_reflectivity 字段本身仍在 uniform 里，与手写一致）', () =>
    {
        expect(wgsl).not.toContain('envmapMethod');
        expect(wgsl).not.toContain('s_envMap');
        expect(main).not.toContain('u_reflectivity');
    });

    it('splat 的三层混合与手写一致，且用 textureSampleLevel（lod=0）', () =>
    {
        expect(main).toContain('let blend = textureSampleLevel(s_blendTexture_texture, s_blendTexture, input.uv, 0.0);');
        expect(main).toContain('var t_uv = input.uv * material_uniforms.u_splatRepeats.y;');
        expect(main).toContain('t_uv = input.uv * material_uniforms.u_splatRepeats.z;');
        expect(main).toContain('t_uv = input.uv * material_uniforms.u_splatRepeats.w;');
        expect(main).toContain('diffuseColor = (tColor - diffuseColor) * blend.x + diffuseColor;');
        expect(main).toContain('diffuseColor = (tColor - diffuseColor) * blend.y + diffuseColor;');
        expect(main).toContain('diffuseColor = (tColor - diffuseColor) * blend.z + diffuseColor;');
    });

    it('splat 必须插在 diffuse 之后、alphatest 之前（回归）', () =>
    {
        const diffuseIdx = main.indexOf('textureSample(s_diffuse_texture, s_diffuse, input.uv)');
        const blendIdx = main.indexOf('let blend = textureSampleLevel(');
        const alphaIdx = main.indexOf('if (diffuseColor.a < material_uniforms.u_alphaThreshold)');
        expect(blendIdx).toBeGreaterThan(diffuseIdx);
        expect(blendIdx).toBeLessThan(alphaIdx);
    });

    it('仍复用标准片段的后续链路（光照 + 雾）', () =>
    {
        expect(main).toContain('let viewDir = normalize(cameraUniforms.u_cameraPos - input.worldPosition);');
        expect(main).toContain('if (shadowData.u_shadowEnabled > 0.5) {');
        expect(main).toContain('if (material_uniforms.u_fogMode > 0.0) {');
    });

    it('varying 的 @location 与顶点着色器对齐', () =>
    {
        expect(wgsl).toContain('@location(0) worldPosition: vec3<f32>');
        expect(wgsl).toContain('@location(6) shadowPos: vec3<f32>');
    });

    it('结果被缓存', () =>
    {
        expect(getTerrainFragmentWGSL()).toBe(wgsl);
    });
});
