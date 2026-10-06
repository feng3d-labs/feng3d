import { describe, expect, it } from 'vitest';
import { getStandardLightingParsWGSL } from './standardLightingPars';

/**
 * 标准光照/阴影 pars 片段的 TSL 生成验收（离线）。
 *
 * 迁移前它是 `StandardMaterial.ts` 里的内联字符串（约 100 行），
 * `StandardMaterial` 与 terrain 的 `TerrainMaterial` 共用。
 */
describe('标准光照 pars 的 TSL 生成', () =>
{
    const wgsl = getStandardLightingParsWGSL();

    it('生成 4 个数据 struct 与 LightsUniform（含结构体数组）', () =>
    {
        expect(wgsl).toContain('struct DirectionalLightData');
        expect(wgsl).toContain('struct PointLightData');
        expect(wgsl).toContain('struct SpotLightData');
        expect(wgsl).toContain('struct LightsUniform');
        expect(wgsl).toContain('u_directionalLight: DirectionalLightData,');
        expect(wgsl).toContain('u_pointLights: array<PointLightData, 8>');
        expect(wgsl).toContain('u_spotLight: SpotLightData');
    });

    it('三个绑定声明与手写一致（含 sampler_comparison）', () =>
    {
        expect(wgsl).toContain('@group(0) @binding(4) var<uniform> lights: LightsUniform;');
        expect(wgsl).toContain('@group(0) @binding(5) var<uniform> shadowData: ShadowUniforms;');
        expect(wgsl).toContain('@binding(0) @group(2) var s_shadowMap_texture: texture_depth_2d;');
        expect(wgsl).toContain('@binding(1) @group(2) var s_shadowMap: sampler_comparison;');
    });

    it('getShadow 的 select 分支不能写反', () =>
    {
        // select(1.0, shadow, inFrustum)：inFrustum 为真时取 shadow，否则取 1.0
        expect(wgsl).toContain('return select(1.0, shadow, inFrustum);');
    });

    it('ShadowUniforms 带 PCF 需要的 u_shadowType / u_shadowMapSize / u_shadowRadius', () =>
    {
        expect(wgsl).toContain('u_shadowType: f32,');
        expect(wgsl).toContain('u_shadowMapSize: vec2<f32>,');
        // 最后一个字段不带尾随逗号（TSL 的 struct 生成风格）
        expect(wgsl).toContain('u_shadowRadius: f32');
    });

    it('getShadow 按 u_shadowType 分派三档，采样次数与 three.js 一致（1 / 17 / 16）', () =>
    {
        const hardStart = wgsl.indexOf('if (shadowData.u_shadowType < 1.5)');
        const pcfStart = wgsl.indexOf('if ((shadowData.u_shadowType >= 1.5)');
        const softStart = wgsl.indexOf('if (shadowData.u_shadowType >= 2.5)');
        const softEnd = wgsl.indexOf('fn computeDistanceLightFalloff');
        expect(wgsl.indexOf('fn getShadow(')).toBeGreaterThan(-1);
        expect(hardStart).toBeGreaterThan(-1);
        expect(pcfStart).toBeGreaterThan(hardStart);
        expect(softStart).toBeGreaterThan(pcfStart);
        expect(softEnd).toBeGreaterThan(softStart);

        const count = (s: string) => (s.match(/textureSampleCompare\(/g) || []).length;
        // three 的 getShadow：无 PCF 分支 1 次；SHADOWMAP_TYPE_PCF 17 次（3×3 + 半步中点）；
        // SHADOWMAP_TYPE_PCF_SOFT 16 次（9 项，其中 5 项是两次采样的 mix）
        expect(count(wgsl.slice(hardStart, pcfStart))).toBe(1);
        expect(count(wgsl.slice(pcfStart, softStart))).toBe(17);
        expect(count(wgsl.slice(softStart, softEnd))).toBe(16);
    });

    it('PCF 的纹素步长 / 半径 / 亚像素插值换算与 three.js 一致', () =>
    {
        // PCF：texelSize = 1 / shadowMapSize，偏移再乘 shadowRadius
        expect(wgsl).toContain('let pcfTexelX = 1.0 / shadowData.u_shadowMapSize.x;');
        expect(wgsl).toContain('let pcfScaledX = pcfTexelX * pcfRadius;');
        expect(wgsl).toContain('shadow = pcfSum / 17.0;');
        // PCF_SOFT：f = fract(uv * shadowMapSize + 0.5)；uv -= f * texelSize
        expect(wgsl).toContain('let softFractX = fract(uv.x * shadowData.u_shadowMapSize.x + 0.5);');
        expect(wgsl).toContain('let softUvX = uv.x - softFractX * softTexelX;');
        expect(wgsl).toContain('shadow = softSum / 9.0;');
    });

    it('光照辅助函数的运算顺序与手写一致', () =>
    {
        expect(wgsl).toContain('return max(0.0, 1.0 - lightDistance / range);');
        expect(wgsl).toContain('return clamp(dot(normal, lightDir), 0.0, 1.0);');
        expect(wgsl).toContain('return pow(specComp, glossiness);');
        expect(wgsl).toContain('if (glossiness <= 0.0) {');
        expect(wgsl).toContain('return 0.0;');
    });

    it('结果被缓存', () =>
    {
        expect(getStandardLightingParsWGSL()).toBe(wgsl);
    });
});
