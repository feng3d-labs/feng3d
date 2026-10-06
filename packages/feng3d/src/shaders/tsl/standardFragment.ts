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
import { discard, float, fragment, func, if_, let_, normalize, pow, reflect, return_, sampler2D, samplerCube, struct, texture, uniform, var_, varying, vec2, vec3, vec4 } from '@feng3d/tsl';
import { StandardLightsContext, applyStandardLighting } from './standardLightingMain';
import { applyStandardFog } from './standardFogMain';
import { getStandardLightingPars } from './standardLightingPars';
import { createCameraUniforms, createGlobalUniforms } from './uniforms';

type Vec2Value = ReturnType<typeof vec2>;
type FloatValue = ReturnType<typeof float>;
type Vec3Value = ReturnType<typeof vec3>;

/**
 * 材质 uniform 的**共同成员**形状。
 *
 * StandardMaterial 与 TerrainMaterial 的 uniform struct 都含这些字段（terrain 另有 u_splatRepeats），
 * 而 TSL 的结构体成员类型是运行期从 `struct()` 定义推导的，所以这里给一个显式形状供内部使用。
 */
interface MaterialLike
{
    u_diffuse: Vec4Value;
    u_alphaThreshold: FloatValue;
    u_specular: Vec4Value;
    u_glossiness: FloatValue;
    u_ambient: Vec4Value;
    u_reflectivity: FloatValue;
    u_emissive: Vec4Value;
    u_fogMinDistance: FloatValue;
    u_fogMaxDistance: FloatValue;
    u_fogColor: Vec4Value;
    u_fogDensity: FloatValue;
    u_fogMode: FloatValue;
    [key: string]: unknown;
}

/** vec4 的实例类型（TSL 只导出构造函数） */
type Vec4Value = ReturnType<typeof vec4>;

/**
 * 标准片段的构建选项（terrain 用它派生自己的变体，避免复制整段数据流）。
 */
export interface StandardFragmentOptions
{
    /** 材质 uniform 的结构名（默认 `StandardUniforms`） */
    materialStructName?: string;
    /** 材质 uniform 的**额外**成员（如 terrain 的 `u_splatRepeats`） */
    extraMaterialMembers?: Record<string, unknown>;
    /**
     * 在 diffuse 之后、alphatest 之前插入的额外步骤（如 terrain 的 splat 混合）。
     *
     * @param ctx 当前颜色、uv 与材质 uniform 实例
     */
    afterDiffuse?: (ctx: { diffuseColor: Vec4Value; uv: Vec2Value; material: Record<string, unknown> }) => void;
    /** 是否包含环境反射步骤（默认 true；terrain 无 envmap） */
    withEnvMap?: boolean;
    /**
     * 是否按**线性色彩空间**做光照并编码输出（默认 false，即历史行为）。
     *
     * false（默认）：feng3d 不做色彩管理——材质颜色 / 顶点色 / 纹理采样值直接参与光照，
     *   结果直接输出（与 three.js 的 linear→sRGB 编码相比，亮面会偏暗，见示例 webgl_shadowmesh）。
     * true：把 diffuse（顶点色 × 颜色 × 纹理）解码到线性空间 → 光照 → 输出前编码回 sRGB，
     *   与 three.js 的色彩管理一致（intensity 因此可直接用 three 的取值并按需补 1/π）。
     */
    linearLighting?: boolean;
}

/** 懒构建缓存（StandardMaterial 的默认变体） */
let cachedStandardFragment: string | null = null;

/** 懒构建缓存（线性光照变体） */
let cachedLinearStandardFragment: string | null = null;

/**
 * 获取标准片段着色器的 WGSL（首次调用时构建并缓存）。
 *
 * @param linearLighting 是否取线性光照变体（见 {@link StandardFragmentOptions.linearLighting}），默认 false
 * @returns WGSL 文本
 */
export function getStandardFragmentWGSL(linearLighting = false): string
{
    if (linearLighting)
    {
        if (cachedLinearStandardFragment === null)
        {
            cachedLinearStandardFragment = buildStandardFragment({ linearLighting: true });
        }

        return cachedLinearStandardFragment;
    }

    if (cachedStandardFragment === null)
    {
        cachedStandardFragment = buildStandardFragment({});
    }

    return cachedStandardFragment;
}

/**
 * 按选项构建片段着色器（供 StandardMaterial 与 TerrainMaterial 共用数据流）。
 *
 * @param options 选项
 * @returns WGSL 文本
 */
export function buildStandardFragment(options: StandardFragmentOptions): string
{
    const withEnvMap = options.withEnvMap !== false;
    const linearLighting = options.linearLighting === true;

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
    const StandardUniforms = struct(options.materialStructName ?? 'StandardUniforms', {
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
        // 自发光颜色（three.js MeshLambertMaterial/MeshPhongMaterial 的 emissive）
        u_emissive: vec4,
        ...(options.extraMaterialMembers ?? {}),
    });
    const material = StandardUniforms(uniform('material_uniforms', 0, 3)) as unknown as MaterialLike;

    const s_diffuse = sampler2D(uniform('s_diffuse', 1, 0));
    const s_specular = sampler2D(uniform('s_specular', 1, 2));


    // pars 提供 struct/绑定声明、辅助函数对象，以及 lights / shadowData 的 uniform 实例
    const pars = getStandardLightingPars();
    const lights = pars.lights as StandardLightsContext;
    const shadowData = pars.shadowData as { u_shadowEnabled: ReturnType<typeof float> };

    // ---- envmap_pars_frag: 环境反射 ----
    // 对照 GLSL：finalColor.xyz *= envColor.xyz * u_reflectivity（乘法混合）。
    // 白色环境贴图（默认占位 cube）不改变原色；不要改成 mix()，见手写注释。
    // envmap 步骤只在需要时构建（terrain 不用，构建了会多出一份 s_envMap 绑定）
    const s_envMap = withEnvMap ? samplerCube(uniform('s_envMap', 1, 4)) : undefined;
    const envmapMethod = withEnvMap ? func(
        'envmapMethod',
        [['finalColor', vec4], ['worldPosition', vec3], ['normal', vec3]],
        vec4,
        (envFinalColor: Vec4Value, envWorldPosition: Vec3Value, envNormal: Vec3Value) =>
        {
            const cameraToVertex = let_('cameraToVertex', normalize(envWorldPosition.subtract(camera.u_cameraPos)));
            const reflectVec = let_('reflectVec', reflect(cameraToVertex, envNormal));
            const envColor = let_('envColor', texture(s_envMap!, reflectVec));

            return_(vec4(
                envFinalColor.xyz.multiply(envColor.xyz).multiply(material.u_reflectivity),
                envFinalColor.a,
            ));
        },
    ) : undefined;

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

        // 线性光照模式：顶点色 / 材质色 / 纹理采样都是 sRGB 编码值，先解码到线性空间再参与光照
        if (linearLighting)
        {
            const linearDiffuse = let_('linearDiffuse', pow(diffuseColor.xyz, vec3(2.2, 2.2, 2.2)));

            diffuseColor.assign(vec4(linearDiffuse.x, linearDiffuse.y, linearDiffuse.z, diffuseColor.a));
        }

        // ---- 可选的额外步骤 ----
        // **必须在 alphatest 之前**：手写的数据流是 diffuse → terrain_frag(splat) → alphatest
        options.afterDiffuse?.({ diffuseColor, uv: v_uv, material: material as unknown as Record<string, unknown> });

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
            linearLighting,
        });

        // ---- envmap_frag（u_reflectivity > 0 时生效；terrain 无此步）----
        if (envmapMethod)
        {
            if_(material.u_reflectivity.greaterThan(0.0), () =>
            {
                finalColor.assign(envmapMethod(finalColor, worldPosition, normal) as unknown as Vec4Value);
            });
        }

        // ---- fog_frag ----
        applyStandardFog({ material, camera, worldPosition, finalColor });

        // 线性光照模式：输出前编码回 sRGB（对应 three.js 的 linearToOutputTexel）
        if (linearLighting)
        {
            const encodedColor = let_('encodedColor', pow(finalColor.xyz, vec3(1 / 2.2, 1 / 2.2, 1 / 2.2)));

            finalColor.assign(vec4(encodedColor.x, encodedColor.y, encodedColor.z, finalColor.a));
        }

        return_(finalColor);
    });

    // 全部交给 TSL 的依赖收集：main 会引用 applyStandardLighting / applyStandardFog /
    // envmapMethod，而它们又引用 pars 的 4 个辅助函数与各个 struct/uniform/采样器声明，
    // 所以一次 toWGSL() 就能生成完整且**不重复**的着色器。
    // （曾经这里额外拼了一份 pars.wgsl，结果 struct 被定义两次。）
    void envmapMethod;
    void pars;

    return mainShader.toWGSL();
}
