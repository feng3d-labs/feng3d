import { describe, expect, it } from 'vitest';
import { array, float, fragment, let_, mat4, normalize, return_, sampler2D, struct, uniform, var_, varying, vec2, vec3, vec4 } from '@feng3d/tsl';
import { applyStandardLighting } from './standardLightingMain';
import { applyStandardFog } from './standardFogMain';
import { createCameraUniforms } from './uniforms';

/**
 * 光照主体（body 片段）的 TSL 生成验收（离线）。
 *
 * 三段（specular+ambient / 方向光+点光源 / 聚光灯+环境光+阴影）逐句对照手写。
 * 这里用真实的结构体与辅助函数（与 `standardLightingPars` 同形）来承载它。
 */
describe('光照主体 body 片段的 TSL 生成', () =>
{
    function buildLightingFragment(): string
    {
        const DirectionalLightData = struct('DirectionalLightData', { direction: vec3, intensity: float, color: vec3, _pad0: float });
        const PointLightData = struct('PointLightData', { position: vec3, range: float, color: vec3, intensity: float });
        const SpotLightData = struct('SpotLightData', { position: vec3, range: float, color: vec3, intensity: float, direction: vec3, coneCos: float, penumbraCos: float, _pad1: float });
        const LightsUniform = struct('LightsUniform', {
            u_directionalLight: DirectionalLightData, u_pointLightCount: float, _pad0: float, _pad1: float, _pad2: float,
            u_pointLights: array(PointLightData, 8), u_spotLight: SpotLightData,
        });
        const ShadowUniforms = struct('ShadowUniforms', { u_shadowVP: mat4, u_lightPosition: vec3, u_shadowCameraNear: float, u_shadowCameraFar: float, u_shadowBias: float, u_shadowEnabled: float, u_shadowType: float, u_shadowMapSize: vec2, u_shadowRadius: float });
        const StandardUniforms = struct('StandardUniforms', {
            u_specular: vec4, u_glossiness: float, u_ambient: vec4,
            // 自发光（StandardMaterial 的 u_emissive；缺它会在 applyStandardLighting 里读 undefined.xyz）
            u_emissive: vec4,
            u_fogMode: float, u_fogDensity: float, u_fogMinDistance: float, u_fogMaxDistance: float, u_fogColor: vec4,
        });
        const GlobalUniforms = struct('GlobalUniforms', { u_sceneAmbientColor: vec4 });

        const material = StandardUniforms(uniform('material_uniforms', 0, 3));
        const lights = LightsUniform(uniform('lights', 0, 4));
        const shadowData = ShadowUniforms(uniform('shadowData', 0, 5));
        const camera = createCameraUniforms();
        const globalUniforms = GlobalUniforms(uniform('globalUniforms', 0, 2));
        const s_specular = sampler2D(uniform('s_specular', 1, 2));
        const v_uv = vec2(varying('uv'));
        const v_worldPosition = vec3(varying('worldPosition'));
        const v_shadowPos = vec3(varying('shadowPos'));

        return fragment('main', () =>
        {
            const finalColor = var_('finalColor', vec4(1.0, 1.0, 1.0, 1.0));
            const normal = let_('normal', normalize(vec3(0.0, 1.0, 0.0)));
            const diffuseColor = var_('diffuseColor', vec4(1.0, 1.0, 1.0, 1.0));

            applyStandardLighting({
                // TSL 的 `Array.index()` 目前返回较宽的 ShaderValue（类型层），结构体成员的精确类型
                // 由 struct 定义在运行期给出；这里对上下文做一次窄断言（测试专用，不改生产类型）。
                material, lights: lights as unknown as Parameters<typeof applyStandardLighting>[0]['lights'],
                shadowData, camera, global: globalUniforms, s_specular,
                uv: v_uv, worldPosition: v_worldPosition, shadowPos: v_shadowPos,
                normal, diffuseColor, finalColor,
                // 这三段只是为了让生成的结构可断言；真实的辅助函数来自 standardLightingPars
                calculateLightDiffuse: () => let_('stubDiffuse', float(0.0)),
                calculateLightSpecular: () => let_('stubSpec', float(0.0)),
                computeDistanceLightFalloff: () => let_('stubFalloff', float(0.0)),
                getShadow: () => let_('stubShadow', float(1.0)),
            });
            applyStandardFog({ material, camera, worldPosition: v_worldPosition, finalColor });
            return_(finalColor);
        }).toWGSL();
    }

    const wgsl = buildLightingFragment();
    const main = wgsl.slice(wgsl.indexOf('fn main('));

    it('段 1：specular + ambient', () =>
    {
        expect(main).toContain('var glossiness = material_uniforms.u_glossiness;');
        expect(main).toContain('var specularColor = material_uniforms.u_specular.xyz;');
        expect(main).toContain('specularColor = specularMapColor.xyz;');
        expect(main).toContain('glossiness = glossiness * specularMapColor.a;');
        expect(main).toContain('let ambientColor = material_uniforms.u_ambient.a * material_uniforms.u_ambient.xyz * globalUniforms.u_sceneAmbientColor.xyz * globalUniforms.u_sceneAmbientColor.a;');
        expect(main).toContain('let viewDir = normalize(cameraUniforms.u_cameraPos - input.worldPosition);');
    });

    it('段 2：方向光 + 点光源（运行期上界循环，循环体里的 let 必须在循环内）', () =>
    {
        expect(main).toContain('if (lights.u_directionalLight.intensity > 0.0) {');
        expect(main).toContain('let count = u32(clamp(lights.u_pointLightCount, 0.0, 8.0));');
        expect(main).toContain('for (var i: u32 = 0u; i < count; i = i + 1u) {');

        // 回归：循环体里的 let 不能跑到循环外（曾经因为 let_ 没接 for 栈而出错）
        const forIdx = main.indexOf('for (var i: u32 = 0u;');
        const bodyIdx = main.indexOf('let lightOffset = lights.u_pointLights[i].position - input.worldPosition;');
        const closing = main.indexOf('\n    }', forIdx);
        expect(bodyIdx).toBeGreaterThan(forIdx);
        expect(bodyIdx).toBeLessThan(closing);
    });

    it('段 3：聚光灯（select 的参数顺序不能反）+ 环境光 + 阴影 + 覆盖判定', () =>
    {
        expect(main).toContain('if (lights.u_spotLight.intensity > 0.0) {');
        // 手写是 select(cosRange, 0.0001, cosRange < 0.0001)（WGSL 顺序）；
        // TSL 是 select(cond, t, f)，生成结果应与之等价
        expect(main).toContain('/ select(cosRange, 0.0001, cosRange < 0.0001)');
        expect(main).toContain('spotAngleAttenuation = spotAngleAttenuation * spotAngleAttenuation;');
        //
        // 环境光同样要乘 1/π：three 的间接光走 `BRDF_Lambert`（`RE_IndirectDiffuse`），
        //    indirectDiffuse += irradiance * BRDF_Lambert( diffuseColor )
        // 少这一项会让环境光增强 π 倍（实测地面过曝到 (+12.8, +35.6, +31.8)）。
        expect(main).toContain('resultColor = resultColor + ambientColor * diffuseColor.xyz * 0.3183098861837907;');
        expect(main).toContain('if (shadowData.u_shadowEnabled > 0.5) {');
        // 阴影**只遮蔽直射光**（three.js: directLight.color *= getShadow(...)）：
        // 方向光项乘 shadow，环境光项不乘
        expect(main).toContain('* lights.u_directionalLight.intensity) * shadow;');
        expect(main).toContain('resultColor = resultColor + ambientColor * diffuseColor.xyz * 0.3183098861837907;');
        // 旧的"整段乘阴影"写法不得再出现
        expect(main).not.toContain('resultColor = resultColor * shadow;');
        expect(main).toContain('finalColor = vec4<f32>(resultColor, diffuseColor.a);');
    });
});
