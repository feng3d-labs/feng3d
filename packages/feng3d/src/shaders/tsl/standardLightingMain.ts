/**
 * 标准光照主体（原 `standardLightingMainWGSL` 的 TSL 版）。
 *
 * 与 {@link applyStandardFog} 一样是 **body 片段**：引用调用方的局部变量（`normal` / `diffuseColor` /
 * `finalColor`）与 varying，在 shader body 内调用时把语句挂到当前 body；
 * `finalColor` 由调用方用 `var_` 传入，本函数按"有任意光源时才覆盖"的约定 `assign`。
 *
 * 三段（逐句对照手写，务必保持运算顺序）：
 * 1. specular + ambient
 * 2. 方向光 + 点光源（运行期上界循环，用 `forU32_`）
 * 3. 聚光灯 + 环境光 + 阴影因子 + 覆盖判定
 *
 * 注意 `select` 的参数顺序：**WGSL 是 `select(f, t, cond)`，TSL 是 `select(cond, t, f)`**。
 */
import { Float, clamp, dot, float, forU32_, if_, length, let_, normalize, pow, sampler2D, select, texture, uint, var_, vec3, vec4 } from '@feng3d/tsl';

type Vec2Value = ReturnType<typeof import('@feng3d/tsl').vec2>;
type Vec3Value = ReturnType<typeof vec3>;
type Vec4Value = ReturnType<typeof import('@feng3d/tsl').vec4>;

/** `lights` uniform 的成员（与 `standardLightingPars` 的 struct 对应） */
export interface StandardLightsContext
{
    u_directionalLight: { direction: Vec3Value; intensity: Float; color: Vec3Value };
    u_pointLightCount: Float;
    u_pointLights: {
        index(i: unknown): { position: Vec3Value; range: Float; color: Vec3Value; intensity: Float };
    };
    u_spotLight: {
        position: Vec3Value;
        range: Float;
        color: Vec3Value;
        intensity: Float;
        direction: Vec3Value;
        coneCos: Float;
        penumbraCos: Float;
    };
}

/** 光照片段所需的上下文（都由调用方的着色器提供） */
export interface StandardLightingContext
{
    /** 材质 uniform */
    material: { u_specular: Vec4Value; u_glossiness: Float; u_ambient: Vec4Value; u_emissive: Vec4Value };
    /** 光照 uniform */
    lights: StandardLightsContext;
    /** 阴影 uniform */
    shadowData: { u_shadowEnabled: Float };
    /** 相机 uniform */
    camera: { u_cameraPos: Vec3Value };
    /** 全局 uniform */
    global: { u_sceneAmbientColor: Vec4Value };
    /** 镜面贴图采样器（调用方声明为 `@group(1) @binding(2/3)` 的 s_specular） */
    s_specular: ReturnType<typeof sampler2D>;
    /** 片元 uv（varying） */
    uv: Vec2Value;
    /** 片元世界坐标（varying） */
    worldPosition: Vec3Value;
    /** 光源空间投影坐标（varying） */
    shadowPos: Vec3Value;
    /** 顶点法线（调用方在 normal_frag 后赋值） */
    normal: Vec3Value;
    /** 漫反射色（调用方在 diffuse_frag 后赋值） */
    diffuseColor: Vec4Value;
    /** 累积颜色（`var_` 可变变量，本片段会覆盖其 rgb） */
    finalColor: Vec4Value;
    /** 光照辅助函数（来自 `standardLightingPars`） */
    calculateLightDiffuse(normal: Vec3Value, lightDir: Vec3Value): Float;
    /** 光照辅助函数 */
    calculateLightSpecular(normal: Vec3Value, lightDir: Vec3Value, viewDir: Vec3Value, glossiness: Float): Float;
    /** 距离衰减 */
    computeDistanceLightFalloff(lightDistance: Float, range: Float): Float;
    /** 阴影因子 */
    getShadow(shadowPos: Vec3Value): Float;
    /**
     * 是否处于线性光照模式（{@link StandardFragmentOptions.linearLighting}）。
     *
     * true 时调用方已把 diffuse 解码到线性空间、并会在输出前编码回 sRGB，
     * 因此自发光直接在线性空间相加（three 的 outgoingLight 语义）。
     */
    linearLighting?: boolean;
}

/**
 * 计算并回写光照结果（与手写片段逐句对应）。
 *
 * @param ctx 上下文
 */
export function applyStandardLighting(ctx: StandardLightingContext): void
{
    const material = ctx.material;
    const lights = ctx.lights;

    // ---- specular_frag ----
    const glossiness = var_('glossiness', material.u_glossiness);
    const specularColor = var_('specularColor', material.u_specular.xyz);
    const specularMapColor = let_('specularMapColor', texture(ctx.s_specular, ctx.uv));
    specularColor.assign(specularMapColor.xyz);
    glossiness.assign(glossiness.multiply(specularMapColor.a));

    // ---- ambient_frag ----
    const ambientColor = let_('ambientColor', material.u_ambient.a
        .multiply(material.u_ambient.xyz)
        .multiply(ctx.global.u_sceneAmbientColor.xyz)
        .multiply(ctx.global.u_sceneAmbientColor.a));

    // ---- lights_frag ----
    const viewDir = let_('viewDir', normalize(ctx.camera.u_cameraPos.subtract(ctx.worldPosition)));
    const resultColor = var_('resultColor', vec3(0.0, 0.0, 0.0));

    // 阴影因子：**只遮蔽直射光**（对应 three.js 在 lights_fragment_begin 里的
    // `directLight.color *= getShadow(...)`），环境光与自发光不受阴影影响。
    // 条件来自 uniform，满足 textureSampleCompare 的 uniform control flow 要求。
    const shadow = var_('shadow', float(1.0));

    if_(ctx.shadowData.u_shadowEnabled.greaterThan(0.5), () =>
    {
        shadow.assign(ctx.getShadow(ctx.shadowPos));
    });

    // 方向光
    // 注：手写这里是 `let dirLight = lights.u_directionalLight`。TSL 的 let_ 只接受 ShaderValue，
    // 结构体实例不能包，所以直接引用（生成的访问路径相同，只少一行 let；WGSL 语义等价）。
    const dirLight = lights.u_directionalLight;
    if_(dirLight.intensity.greaterThan(0.0), () =>
    {
        const lightDir = let_('lightDir', normalize(dirLight.direction.multiply(-1.0)));
        const diffuse = let_('diffuse', ctx.calculateLightDiffuse(ctx.normal, lightDir));
        const specular = let_('specular', ctx.calculateLightSpecular(ctx.normal, lightDir, viewDir, glossiness));
        resultColor.assign(resultColor.add(
            diffuse.multiply(ctx.diffuseColor.xyz).add(specular.multiply(specularColor))
                .multiply(dirLight.color).multiply(dirLight.intensity).multiply(shadow),
        ));
    });

    // 点光源（运行期上界）
    const count = let_('count', uint(clamp(lights.u_pointLightCount, 0.0, 8.0)));
    forU32_('i', 0, count, (i) =>
    {
        // 同上：结构体元素不包 let_（见 dirLight 的说明）
        const light = lights.u_pointLights.index(i);
        const lightOffset = let_('lightOffset', light.position.subtract(ctx.worldPosition));
        const lightDir = let_('lightDir', normalize(lightOffset));
        const falloff = let_('falloff', ctx.computeDistanceLightFalloff(length(lightOffset), light.range));
        const diffuse = let_('diffuse', ctx.calculateLightDiffuse(ctx.normal, lightDir));
        const specular = let_('specular', ctx.calculateLightSpecular(ctx.normal, lightDir, viewDir, glossiness));
        resultColor.assign(resultColor.add(
            diffuse.multiply(ctx.diffuseColor.xyz).add(specular.multiply(specularColor))
                .multiply(light.color).multiply(light.intensity).multiply(falloff),
        ));
    });

    // 聚光灯（取第一个）
    // 同上：结构体不包 let_（见 dirLight 的说明）
    const spot = lights.u_spotLight;
    if_(spot.intensity.greaterThan(0.0), () =>
    {
        const spotOffset = let_('spotOffset', ctx.worldPosition.subtract(spot.position));
        const spotDist = let_('spotDist', length(spotOffset));
        const spotLightDir = let_('spotLightDir', spotOffset.divide(spotDist));
        const spotFalloff = let_('spotFalloff', ctx.computeDistanceLightFalloff(spotDist, spot.range));
        const thetaCos = let_('thetaCos', dot(spotLightDir, normalize(spot.direction)));
        const cosRange = let_('cosRange', spot.penumbraCos.subtract(spot.coneCos));
        // 手写：clamp((thetaCos - coneCos) / select(cosRange, 0.0001, cosRange < 0.0001), 0.0, 1.0)
        // WGSL 的 select(f, t, cond) ↔ TSL 的 select(cond, t, f)
        const spotAngleAttenuation = var_('spotAngleAttenuation', clamp(
            thetaCos.subtract(spot.coneCos).divide(select(cosRange.lessThan(0.0001), 0.0001, cosRange)),
            0.0,
            1.0,
        ));
        spotAngleAttenuation.assign(spotAngleAttenuation.multiply(spotAngleAttenuation));
        const spotDiffuse = let_('spotDiffuse', ctx.calculateLightDiffuse(ctx.normal, spotLightDir));
        const spotSpecular = let_('spotSpecular', ctx.calculateLightSpecular(ctx.normal, spotLightDir, viewDir, glossiness));
        resultColor.assign(resultColor.add(
            spotDiffuse.multiply(ctx.diffuseColor.xyz).add(spotSpecular.multiply(specularColor))
                .multiply(spot.color).multiply(spot.intensity).multiply(spotFalloff).multiply(spotAngleAttenuation),
        ));
    });

    // 环境光
    resultColor.assign(resultColor.add(ambientColor.multiply(ctx.diffuseColor.xyz)));

    // 自发光（three.js：outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance）。
    // - 线性光照模式：调用方已在线性空间计算，直接相加（与 three 完全同域）。
    // - 默认（γ）模式：feng3d 不做输出色彩编码（光照结果就是输出），因此做等效合成
    //     out = (out_linear + emissive_linear)^(1/2.2)
    //   u_emissive 仍是**线性**值（与 three 的 material.emissive 同域），
    //   暗面（无光照）的输出恰为 (emissive_linear)^(1/2.2) = 该颜色的 sRGB 分量。
    // 注：WGSL 的 pow 只接受 (vecN, vecN) 或 (标量, 标量)，不能 vec3 配标量，故逐分量给指数
    if (ctx.linearLighting === true)
    {
        resultColor.assign(resultColor.add(ctx.material.u_emissive.xyz as unknown as Vec3Value));
    }
    else
    {
        resultColor.assign(pow(
            pow(resultColor, vec3(2.2, 2.2, 2.2)).add(ctx.material.u_emissive.xyz as unknown as Vec3Value),
            vec3(1 / 2.2, 1 / 2.2, 1 / 2.2),
        ));
    }

    // 覆盖判定：有任意光源时才用光照结果覆盖 finalColor
    if_(dirLight.intensity.greaterThan(0.0)
        .or(count.greaterThan(0))
        .or(spot.intensity.greaterThan(0.0)), () =>
    {
        ctx.finalColor.assign(vec4(resultColor, ctx.diffuseColor.a));
    });
}
