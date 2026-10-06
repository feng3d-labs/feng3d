import { describe, expect, it } from 'vitest';
import { getStandardFragmentWGSL } from './standardFragment';

/**
 * 标准片段着色器的 TSL 生成验收（离线）。
 *
 * 这一版把之前几批交付的单元（pars / applyStandardLighting / applyStandardFog）**接了起来**，
 * 并替换掉 `StandardMaterial.ts` 里约 96 行的手写字符串。
 */
describe('标准片段着色器的 TSL 生成', () =>
{
    const wgsl = getStandardFragmentWGSL();

    it('varying 的 @location 必须与顶点着色器严格对齐（0..6）', () =>
    {
        // TSL 自动分配是按"使用顺序"来的，所以这里必须显式指定 location
        expect(wgsl).toContain('@location(0) worldPosition: vec3<f32>');
        expect(wgsl).toContain('@location(1) worldNormal: vec3<f32>');
        expect(wgsl).toContain('@location(4) uv: vec2<f32>');
        expect(wgsl).toContain('@location(5) color: vec4<f32>');
        expect(wgsl).toContain('@location(6) shadowPos: vec3<f32>');
    });

    it('结构体与绑定不重复、槽位与手写一致', () =>
    {
        // 每份声明只能出现一次（曾经因为额外拼了一份 pars.wgsl 而重复定义 struct）
        for (const name of ['StandardUniforms', 'GlobalUniforms', 'CameraUniforms', 'LightsUniform', 'ShadowUniforms'])
        {
            expect(wgsl.split(`struct ${name}`).length - 1).toBe(1);
        }
        expect(wgsl).toContain('@group(0) @binding(3) var<uniform> material_uniforms: StandardUniforms;');
        expect(wgsl).toContain('@group(0) @binding(1) var<uniform> cameraUniforms: CameraUniforms;');
        expect(wgsl).toContain('@group(0) @binding(4) var<uniform> lights: LightsUniform;');
        expect(wgsl).toContain('@group(0) @binding(5) var<uniform> shadowData: ShadowUniforms;');
    });

    it('纹理按 TSL 的采样器展开约定（_texture + 采样器），与数据侧键名一致', () =>
    {
        expect(wgsl).toContain('@binding(0) @group(1) var s_diffuse_texture: texture_2d<f32>;');
        expect(wgsl).toContain('@binding(1) @group(1) var s_diffuse: sampler;');
        expect(wgsl).toContain('@binding(2) @group(1) var s_specular_texture: texture_2d<f32>;');
        expect(wgsl).toContain('@binding(3) @group(1) var s_specular: sampler;');
        expect(wgsl).toContain('@binding(4) @group(1) var s_envMap_texture: texture_cube<f32>;');
        expect(wgsl).toContain('@binding(5) @group(1) var s_envMap: sampler;');
    });

    it('数据流与手写一致：color → normal → diffuse → discard → lighting → envmap → fog', () =>
    {
        expect(wgsl).toContain('finalColor = input.color * finalColor;');
        expect(wgsl).toContain('let normal = normalize(input.worldNormal);');
        expect(wgsl).toContain('diffuseColor = finalColor * diffuseColor * textureSample(s_diffuse_texture, s_diffuse, input.uv);');
        expect(wgsl).toContain('if (diffuseColor.a < material_uniforms.u_alphaThreshold) {');
        expect(wgsl).toContain('discard;');
        expect(wgsl).toContain('finalColor = diffuseColor;');
        // 光照（由 applyStandardLighting 生成）
        expect(wgsl).toContain('let viewDir = normalize(cameraUniforms.u_cameraPos - input.worldPosition);');
        expect(wgsl).toContain('if (shadowData.u_shadowEnabled > 0.5) {');
        // envmap
        expect(wgsl).toContain('if (material_uniforms.u_reflectivity > 0.0) {');
        expect(wgsl).toContain('envmapMethod(finalColor, input.worldPosition, normal)');
        // fog
        expect(wgsl).toContain('if (material_uniforms.u_fogMode > 0.0) {');
        expect(wgsl).toContain('finalColor = vec4<f32>(mix(finalColor.xyz, material_uniforms.u_fogColor.xyz, fogFactor), finalColor.a);');
    });

    it('结果被缓存', () =>
    {
        expect(getStandardFragmentWGSL()).toBe(wgsl);
    });
});

/**
 * 线性光照变体（StandardMaterial.linearLighting）的生成验收。
 *
 * 该变体把 sRGB 材质值解码到线性空间做光照、输出前再编码回 sRGB，
 * 用于与 three.js 的色彩管理对齐（示例 webgl_shadowmesh 使用）。
 */
describe('标准片段着色器的线性光照变体', () =>
{
    const linear = getStandardFragmentWGSL(true);

    it('diffuse 先解码到线性空间、输出前编码回 sRGB', () =>
    {
        expect(linear).toContain('let linearDiffuse = pow(diffuseColor.xyz, vec3<f32>(2.2));');
        expect(linear).toContain('diffuseColor = vec4<f32>(linearDiffuse.x, linearDiffuse.y, linearDiffuse.z, diffuseColor.a);');
        expect(linear).toContain('let encodedColor = pow(finalColor.xyz, vec3<f32>(0.45454545454545453));');
    });

    it('默认（γ）变体保持历史行为：不做解码与输出编码', () =>
    {
        const srgb = getStandardFragmentWGSL();

        expect(srgb).not.toContain('let linearDiffuse =');
        expect(srgb).not.toContain('let encodedColor =');
    });

    it('两种变体的自发光合成不同：线性变体直接相加、默认变体在 γ 空间做等效合成', () =>
    {
        expect(linear).toContain('resultColor = resultColor + material_uniforms.u_emissive.xyz;');
        expect(getStandardFragmentWGSL()).toContain('resultColor = pow(pow(resultColor, vec3<f32>(2.2)) + material_uniforms.u_emissive.xyz,');
    });
});
