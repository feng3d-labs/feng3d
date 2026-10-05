import { describe, expect, it } from 'vitest';
import { Float, array, discard, float, forRange_, fragment, if_, int, let_, return_, samplerComparison, struct, textureSampleCompare, uniform, var_, vec2, vec3, vec4 } from '../src/index';

/**
 * 本批为 TSL 补齐的三项能力（#710 / #711）：for 循环、向量动态索引、f32→i32 转换。
 * 它们原先都缺失，导致蒙皮逻辑无法用 TSL 表达。
 */
describe('TSL 的 for 循环（forRange_）', () =>
{
    it('生成 WGSL 的 for (var i = 0; i < n; i = i + 1)', () =>
    {
        const f = fragment('main', () =>
        {
            const acc = var_('acc', vec4(0.0, 0.0, 0.0, 0.0));
            forRange_('i', 0, 4, (i) =>
            {
                acc.assign(acc.add(vec4(i.toWGSL() === 'i' ? 1.0 : 0.0)));
            });
            return_(acc);
        });
        const wgsl = f.toWGSL();

        expect(wgsl).toContain('for (var i = 0; i < 4; i = i + 1) {');
        expect(wgsl).toContain('acc = acc + vec4<f32>(1.0);');
    });

    it('循环体里的语句挂在循环内（缩进一层）', () =>
    {
        const f = fragment('main', () =>
        {
            forRange_('j', 1, 3, () =>
            {
                return_(vec4(0.0));
            });
        });

        expect(f.toWGSL()).toContain('    return vec4<f32>(0.0);');
    });
});

describe('向量动态索引与 f32→i32 转换', () =>
{
    it('vec4 的 index(i) 生成 v[i]（原先只有 swizzle 分量）', () =>
    {
        const f = fragment('main', () =>
        {
            const v = var_('v', vec4(1.0, 2.0, 3.0, 4.0));
            const acc = var_('acc', vec4(0.0, 0.0, 0.0, 0.0));
            forRange_('i', 0, 4, (i) =>
            {
                // 循环变量直接当索引（蒙皮的 skinIndices[i] 就是这个形态）
                acc.assign(vec4(v.index(i), v.index(i), v.index(i), v.index(i)));
            });
            return_(acc);
        });

        const wgsl = f.toWGSL();
        expect(wgsl).toContain('v[i]');
    });

    it('int(f32) 生成 i32(...)', () =>
    {
        const value = new Float(1.0);

        expect(int(value).toWGSL()).toBe('i32(1.0)');
        expect(int(value).toGLSL()).toBe('int(1.0)');
    });
});

describe('discard 与比较采样器（#710，StandardMaterial 片元的前置）', () =>
{
    it('discard 生成 discard;，并挂在当前 if 体内', () =>
    {
        const f = fragment('main', () =>
        {
            const c = var_('c', vec4(1.0, 1.0, 1.0, 1.0));
            if_(c.a.lessThan(0.5), () =>
            {
                discard();
            });
            return_(c);
        });
        const wgsl = f.toWGSL();

        expect(wgsl).toContain('if (c.a < 0.5) {');
        expect(wgsl).toContain('        discard;');
    });

    it('比较采样器声明为 texture_depth_2d + sampler_comparison（TSL 展开格式）', () =>
    {
        const s = samplerComparison(uniform('s_shadowMap', 2, 0));

        expect(s.toWGSL()).toBe('@binding(0) @group(2) var s_shadowMap_texture: texture_depth_2d;\n@binding(1) @group(2) var s_shadowMap: sampler_comparison;');
    });

    it('textureSampleCompare 生成硬件深度比较调用', () =>
    {
        const s = samplerComparison(uniform('s_shadowMap', 2, 0));
        const expr = textureSampleCompare(s, vec2(0.5, 0.5), new Float(0.25));

        expect(expr.toWGSL()).toBe('textureSampleCompare(s_shadowMap_texture, s_shadowMap, vec2<f32>(0.5), 0.25)');
    });
});

describe('结构体数组（#710，standardLightingParsWGSL 的前置）', () =>
{
    it('结构体数组作为 UBO 成员：生成嵌套 struct 定义与 array<Struct, N>', () =>
    {
        const PointLightData = struct('PointLightData', { position: vec3, range: float, color: vec3, intensity: float });
        const LightsUniform = struct('LightsUniform', {
            u_directionalLight: vec3,
            u_pointLightCount: float,
            u_pointLights: array(PointLightData, 8),
        });
        const lights = LightsUniform(uniform('lights', 0, 4));

        const f = fragment('main', () =>
        {
            const v = let_('v', lights.u_pointLights.index(0).position);
            return_(vec4(v, 1.0));
        });
        const wgsl = f.toWGSL();

        // 嵌套结构体定义要一起生成（否则 array<PointLightData, 8> 引用不到）
        expect(wgsl).toContain('struct PointLightData');
        expect(wgsl).toContain('struct LightsUniform');
        expect(wgsl).toContain('u_pointLights: array<PointLightData, 8>');
        expect(wgsl).toContain('@group(0) @binding(4) var<uniform> lights: LightsUniform;');
        // 元素访问要带上下标（成员路径挂在它上面）
        expect(wgsl).toContain('lights.u_pointLights[0].position');
    });
});
