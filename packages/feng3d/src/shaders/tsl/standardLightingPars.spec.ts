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

    it('getShadow 的语义与手写一致（select 的分支不能写反）', () =>
    {
        expect(wgsl).toContain('var shadow = textureSampleCompare(s_shadowMap_texture, s_shadowMap, uv, depthRef);');
        // 手写是 select(1.0, shadow, inFrustum)：inFrustum 为真时取 shadow，否则取 1.0
        expect(wgsl).toContain('return select(1.0, shadow, inFrustum);');
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
