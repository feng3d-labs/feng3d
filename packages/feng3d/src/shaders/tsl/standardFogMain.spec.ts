import { describe, expect, it } from 'vitest';
import { float, fragment, return_, struct, uniform, var_, varying, vec3, vec4 } from '@feng3d/tsl';
import { applyStandardFog } from './standardFogMain';
import { createCameraUniforms } from './uniforms';

/**
 * 雾 body 片段的 TSL 生成验收（离线）。
 *
 * `applyStandardFog` 是一个"body 片段"：它被调用时把自己的语句追加到**调用方的 shader body**上，
 * 并就地修改传入的可变 `finalColor`。所以这里用一个最小的 fragment 来承载它、再断言生成结果。
 */
describe('雾 body 片段的 TSL 生成', () =>
{
    function buildFogFragment(): string
    {
        const StandardUniforms = struct('StandardUniforms', {
            u_fogMode: float, u_fogDensity: float, u_fogMinDistance: float, u_fogMaxDistance: float, u_fogColor: vec4,
        });
        const material = StandardUniforms(uniform('material_uniforms', 0, 3));
        const camera = createCameraUniforms();
        const v_worldPosition = vec3(varying('worldPosition'));

        return fragment('main', () =>
        {
            const finalColor = var_('finalColor', vec4(1.0, 1.0, 1.0, 1.0));
            applyStandardFog({ material, camera, worldPosition: v_worldPosition, finalColor });
            return_(finalColor);
        }).toWGSL();
    }

    const wgsl = buildFogFragment();

    it('三种雾模式的公式与手写一致', () =>
    {
        expect(wgsl).toContain('if (material_uniforms.u_fogMode > 0.0) {');
        // 雾深度 = 视图空间深度（three.js 的 vFogDepth = -mvPosition.z），不是欧氏距离
        expect(wgsl).toContain('let viewPosition = cameraUniforms.u_viewMatrix * vec4<f32>(input.worldPosition, 1.0);');
        expect(wgsl).toContain('let dist = viewPosition.z * -1.0;');
        expect(wgsl).toContain('var fogFactor: f32;');
        expect(wgsl).toContain('fogFactor = 1.0 - exp(material_uniforms.u_fogDensity * dist * -1.0);');
        expect(wgsl).toContain('material_uniforms.u_fogDensity * material_uniforms.u_fogDensity * dist * dist *');
        // 线性雾是 smoothstep（three.js 的 fog_fragment），不是线性 clamp
        expect(wgsl).toContain('let range = max(material_uniforms.u_fogMaxDistance - material_uniforms.u_fogMinDistance, 0.0001);');
        expect(wgsl).toContain('let fogT = clamp((dist - material_uniforms.u_fogMinDistance) / range, 0.0, 1.0);');
        expect(wgsl).toContain('fogFactor = fogT * fogT * (3.0 - fogT * 2.0);');
        expect(wgsl).toContain('finalColor = vec4<f32>(mix(finalColor.xyz, material_uniforms.u_fogColor.xyz, fogFactor), finalColor.a);');
    });

    it('else-if 链条必须平级（回归：内层 if 不能落进第一个 if 的 body）', () =>
    {
        // 手写是 if / else if / else。TSL 生成 else { if ... else {...} }，两者语义等价；
        // 关键是 == 2.0 的那个 if 必须在 else 分支里，而不是在 == 1.0 的 body 里。
        const idx1 = wgsl.indexOf('u_fogMode == 1.0');
        const idx2 = wgsl.indexOf('u_fogMode == 2.0');
        const elseIdx = wgsl.indexOf('} else {', idx1);
        expect(idx2).toBeGreaterThan(elseIdx);
    });
});
