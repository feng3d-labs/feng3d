/**
 * 标准片段着色器（原 `StandardMaterial.ts` 里 `standardFragmentWGSL` 的 TSL 版）。
 *
 * 它把此前几批交付的单元**接了起来**（收掉"单元先行、消费者延后"的欠账）：
 * - `getStandardLightingPars()`：struct + 绑定声明 + 4 个辅助函数（含函数对象与 uniform 实例）
 * - `applyStandardLighting(ctx)`：specular / ambient / lights / shadow
 * - `applyStandardFog(ctx)`：按 `u_fogMode` 混合雾色
 *
 * 数据流（与手写一致）：color → normal → diffuse → alphatest(discard) → lighting
 * → envmap（可选）→ fog → 输出。
 *
 * 采样器沿用 TSL 的展开约定（`sampler2D(uniform('s_diffuse', 1, 0))` →
 * `s_diffuse_texture` + `s_diffuse`），数据侧的键名需要与之一致。
 */
import { discard, float, fragment, func, if_, let_, normalize, reflect, return_, sampler2D, samplerCube, struct, texture, uniform, var_, varying, vec2, vec3, vec4 } from '@feng3d/tsl';
import { StandardLightsContext, applyStandardLighting } from './standardLightingMain';
import { applyStandardFog } from './standardFogMain';
import { getStandardLightingPars } from './standardLightingPars';
import { createCameraUniforms, createGlobalUniforms } from './uniforms';

type Vec2Value = ReturnType<typeof vec2>;

/** 懒构建缓存 */
let cachedStandardFragment: string | null = null;

/**
 * 获取标准片段着色器的 WGSL（首次调用时构建并缓存）。
 *
 * @returns WGSL 文本
 */
export function getStandardFragmentWGSL(): string
{
    if (cachedStandardFragment === null)
    {
        cachedStandardFragment = buildStandardFragment();
    }

    return cachedStandardFragment;
}

function buildStandardFragment(): string
{
    // ---- varying ----
    // **必须显式指定 location**：TSL 自动分配是按"使用顺序"来的，而这里必须与顶点着色器的
    // VertexOutput 严格对齐（0=worldPosition 1=worldNormal 2=worldTangent 3=worldBitangent
    // 4=uv 5=color 6=shadowPos），否则插值数据整体错位。
    // tangent/bitangent 当前不参与计算（法线贴图待后续），但必须保留以维持布局。
    const worldPosition = vec3(varying('worldPosition', 0));
    const worldNormal = vec3(varying('worldNormal', 1));
    vec3(varying('worldTangent', 2));
    vec3(varying('worldBitangent', 3));
    const v_uv: Vec2Value = vec2(varying('uv', 4));
    const v_color = vec4(varying('color', 5));
    const shadowPos = vec3(varying('shadowPos', 6));

    // ---- uniforms / 纹理 ----
    const camera = createCameraUniforms();
    const globalUniforms = createGlobalUniforms();
    const StandardUniforms = struct('StandardUniforms', {
        u_diffuse: vec4,
        u_alphaThreshold: float,
        u_specular: vec4,
        u_glossiness: float,
        u_ambient: vec4,
        u_reflectivity: float,
        u_fogMinDistance: float,
        u_fogMaxDistance: float,
        u_fogColor: vec4,
        u_fogDensity: float,
        u_fogMode: float,
    });
    const material = StandardUniforms(uniform('material_uniforms', 0, 3));

    const s_diffuse = sampler2D(uniform('s_diffuse', 1, 0));
    const s_specular = sampler2D(uniform('s_specular', 1, 2));
    const s_envMap = samplerCube(uniform('s_envMap', 1, 4));

    // pars 提供 struct/绑定声明、辅助函数对象，以及 lights / shadowData 的 uniform 实例
    const pars = getStandardLightingPars();
    const lights = pars.lights as StandardLightsContext;
    const shadowData = pars.shadowData as { u_shadowEnabled: ReturnType<typeof float> };

    // ---- envmap_pars_frag: 环境反射 ----
    // 对照 GLSL：finalColor.xyz *= envColor.xyz * u_reflectivity（乘法混合）。
    // 白色环境贴图（默认占位 cube）不改变原色；不要改成 mix()，见手写注释。
    const envmapMethod = func(
        'envmapMethod',
        [['finalColor', vec4], ['worldPosition', vec3], ['normal', vec3]],
        vec4,
        (envFinalColor, envWorldPosition, envNormal) =>
        {
            const cameraToVertex = let_('cameraToVertex', normalize(envWorldPosition.subtract(camera.u_cameraPos)));
            const reflectVec = let_('reflectVec', reflect(cameraToVertex, envNormal));
            const envColor = let_('envColor', texture(s_envMap, reflectVec));

            return_(vec4(
                envFinalColor.xyz.multiply(envColor.xyz).multiply(material.u_reflectivity),
                envFinalColor.a,
            ));
        },
    );

    // ---- main ----
    const mainShader = fragment('main', () =>
    {
        // 初始化
        const finalColor = var_('finalColor', vec4(1.0, 1.0, 1.0, 1.0));

        // ---- color_frag ----
        finalColor.assign(v_color.multiply(finalColor));

        // ---- normal_frag ----
        // 法线贴图待后续实现，暂用顶点法线
        const normal = let_('normal', normalize(worldNormal));

        // ---- diffuse_frag ----
        const diffuseColor = var_('diffuseColor', material.u_diffuse);
        diffuseColor.assign(finalColor.multiply(diffuseColor).multiply(texture(s_diffuse, v_uv)));

        // ---- alphatest_frag ----
        if_(diffuseColor.a.lessThan(material.u_alphaThreshold), () =>
        {
            discard();
        });

        // ---- finalColor = diffuseColor ----
        finalColor.assign(diffuseColor);

        // ---- specular + ambient + lights + shadow ----
        applyStandardLighting({
            material,
            lights,
            shadowData,
            camera,
            global: globalUniforms,
            s_specular,
            uv: v_uv,
            worldPosition,
            shadowPos,
            normal,
            diffuseColor,
            finalColor,
            calculateLightDiffuse: pars.calculateLightDiffuse,
            calculateLightSpecular: pars.calculateLightSpecular,
            computeDistanceLightFalloff: pars.computeDistanceLightFalloff,
            getShadow: pars.getShadow,
        });

        // ---- envmap_frag（u_reflectivity > 0 时生效）----
        if_(material.u_reflectivity.greaterThan(0.0), () =>
        {
            finalColor.assign(envmapMethod(finalColor, worldPosition, normal) as unknown as ReturnType<typeof vec4>);
        });

        // ---- fog_frag ----
        applyStandardFog({ material, camera, worldPosition, finalColor });

        return_(finalColor);
    });

    // 全部交给 TSL 的依赖收集：main 会引用 applyStandardLighting / applyStandardFog /
    // envmapMethod，而它们又引用 pars 的 4 个辅助函数与各个 struct/uniform/采样器声明，
    // 所以一次 toWGSL() 就能生成完整且**不重复**的着色器。
    // （曾经这里额外拼了一份 pars.wgsl，结果 struct 被定义两次。）
    // envmapMethod 必须先被引用到——它在上面的 if_ 里被调用，依赖已建立。
    void envmapMethod;
    void pars;

    return mainShader.toWGSL();
}
