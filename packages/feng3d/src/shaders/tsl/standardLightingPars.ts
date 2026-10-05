/**
 * 标准光照 / 阴影的 WGSL "pars" 片段（原 `StandardMaterial.ts` 里的 `standardLightingParsWGSL` 的 TSL 版）。
 *
 * 内容：`lights_pars_frag` 的 4 个数据 struct + `shadowmap_pars_frag` 的 ShadowUniforms
 * + 三个绑定声明 + 4 个纯函数（getShadow / computeDistanceLightFalloff /
 * calculateLightDiffuse / calculateLightSpecular）。
 *
 * **不含**入口函数——它只提供声明与工具函数，由各材质的片元着色器拼接使用
 * （`StandardMaterial` 与 `terrain` 的 `TerrainMaterial` 共用）。
 *
 * 为此用到 TSL 本批补齐的能力：**结构体数组**（`u_pointLights: array<PointLightData, 8>`）、
 * **比较采样器**（`s_shadowMap` → `texture_depth_2d` + `sampler_comparison`）与
 * `textureSampleCompare`。
 *
 * 构建结果懒加载并缓存（模块顶层不执行构建，见 AGENTS.md §15 R2）。
 */
import { array, clamp, dot, float, func, if_, let_, mat4, max, normalize, pow, return_, samplerComparison, select, struct, textureSampleCompare, uniform, var_, vec2, vec3 } from '@feng3d/tsl';
/** 构建结果：WGSL 文本 + 供 body 片段调用的函数对象 */
export interface StandardLightingPars
{
    /** 拼接用的 WGSL 文本（struct + 绑定声明 + 函数定义） */
    wgsl: string;
    /** `calculateLightDiffuse(normal, lightDir)` */
    calculateLightDiffuse: (...args: never[]) => ReturnType<typeof float>;
    /** `calculateLightSpecular(normal, lightDir, viewDir, glossiness)` */
    calculateLightSpecular: (...args: never[]) => ReturnType<typeof float>;
    /** `computeDistanceLightFalloff(lightDistance, range)` */
    computeDistanceLightFalloff: (...args: never[]) => ReturnType<typeof float>;
    /** `getShadow(shadowPos)` */
    getShadow: (...args: never[]) => ReturnType<typeof float>;
    /** `lights` uniform 实例（成员如 u_directionalLight / u_pointLights / u_spotLight） */
    lights: unknown;
    /** `shadowData` uniform 实例 */
    shadowData: unknown;
    /** `s_shadowMap` 比较采样器实例（贴图 + sampler_comparison） */
    s_shadowMap: unknown;
}

/** 懒构建缓存 */
let cachedStandardLightingPars: StandardLightingPars | null = null;

/**
 * 获取标准光照/阴影的 pars 片段 WGSL（首次调用时构建并缓存）。
 *
 * @returns WGSL 文本片段
 */
export function getStandardLightingParsWGSL(): string
{
    return getStandardLightingPars().wgsl;
}

/**
 * 获取 pars 的构建结果（WGSL 文本 + 函数对象）。
 *
 * body 片段需要**函数对象**来生成调用（而不是字符串），所以内部走这个入口；
 * 只想要文本的调用方用 {@link getStandardLightingParsWGSL}。
 *
 * @returns 构建结果
 */
export function getStandardLightingPars(): StandardLightingPars
{
    if (cachedStandardLightingPars === null)
    {
        cachedStandardLightingPars = buildStandardLightingPars();
    }

    return cachedStandardLightingPars;
}

function buildStandardLightingPars(): StandardLightingPars
{
    // ---- lights_pars_frag: 数据 struct ----
    const DirectionalLightData = struct('DirectionalLightData', {
        direction: vec3, intensity: float, color: vec3, _pad0: float,
    });
    const PointLightData = struct('PointLightData', {
        position: vec3, range: float, color: vec3, intensity: float,
    });
    const SpotLightData = struct('SpotLightData', {
        position: vec3, range: float, color: vec3, intensity: float,
        direction: vec3, coneCos: float, penumbraCos: float, _pad1: float,
    });
    const LightsUniform = struct('LightsUniform', {
        u_directionalLight: DirectionalLightData,
        u_pointLightCount: float,
        _pad0: float,
        _pad1: float,
        _pad2: float,
        u_pointLights: array(PointLightData, 8),
        u_spotLight: SpotLightData,
    });
    // ---- shadowmap_pars_frag ----
    const ShadowUniforms = struct('ShadowUniforms', {
        u_shadowVP: mat4,
        u_lightPosition: vec3,
        u_shadowCameraNear: float,
        u_shadowCameraFar: float,
        u_shadowBias: float,
        u_shadowEnabled: float,
        _pad0: float,
        _pad1: float,
    });
    const lights = LightsUniform(uniform('lights', 0, 4));
    const shadowData = ShadowUniforms(uniform('shadowData', 0, 5));

    // depth 纹理 + sampler_comparison（硬件 PCF 深度比较）
    const s_shadowMap = samplerComparison(uniform('s_shadowMap', 2, 0));

    // ---- getShadow：与手写逐行对应 ----
    const getShadow = func(
        'getShadow',
        [['shadowPos', vec3]],
        float,
        (shadowPos) =>
        {
            const uv = let_('uv', vec2(shadowPos.x, shadowPos.y));
            const depthRef = let_('depthRef', shadowPos.z.subtract(shadowData.u_shadowBias));
            const inFrustum = let_('inFrustum',
                uv.x.greaterThanOrEqual(0.0)
                    .and(uv.x.lessThanOrEqual(1.0))
                    .and(uv.y.greaterThanOrEqual(0.0))
                    .and(uv.y.lessThanOrEqual(1.0))
                    .and(depthRef.lessThanOrEqual(1.0))
                    .and(depthRef.greaterThanOrEqual(0.0)));
            const shadow = var_('shadow', textureSampleCompare(s_shadowMap, uv, depthRef));

            return_(select(inFrustum, shadow, 1.0));
        });

    // ---- 光照辅助函数 ----
    const computeDistanceLightFalloff = func(
        'computeDistanceLightFalloff',
        [['lightDistance', float], ['range', float]],
        float,
        (lightDistance, range) =>
        {
            return_(max(0.0, float(1.0).subtract(lightDistance.divide(range))));
        });

    const calculateLightDiffuse = func(
        'calculateLightDiffuse',
        [['normal', vec3], ['lightDir', vec3]],
        float,
        (normal, lightDir) =>
        {
            return_(clamp(dot(normal, lightDir), 0.0, 1.0));
        });

    const calculateLightSpecular = func(
        'calculateLightSpecular',
        [['normal', vec3], ['lightDir', vec3], ['viewDir', vec3], ['glossiness', float]],
        float,
        (normal, lightDir, viewDir, glossiness) =>
        {
            const halfVec = let_('halfVec', normalize(lightDir.add(viewDir)));
            const specComp = var_('specComp', max(dot(normal, halfVec), 0.0));
            // glossiness <= 0 视为完全粗糙（无高光）：直接返回 0，避免 pow(x, 0) 在部分 GPU 上返回 NaN
            if_(glossiness.lessThanOrEqual(0.0), () =>
            {
                return_(float(0.0));
            });

            return_(pow(specComp, glossiness));
        });

    // ---- 拼接（顺序与手写一致）----
    const sections: string[] = [
        '// ---- lights_pars_frag ----',
        DirectionalLightData._definition.toWGSLStruct(),
        PointLightData._definition.toWGSLStruct(),
        SpotLightData._definition.toWGSLStruct(),
        LightsUniform._definition.toWGSLStruct(),
        LightsUniform._definition.toWGSLUniform('lights', 0, 4),
        '// ---- shadowmap_pars_frag ----',
        ShadowUniforms._definition.toWGSLStruct(),
        ShadowUniforms._definition.toWGSLUniform('shadowData', 0, 5),
        s_shadowMap.toWGSL(),
        getShadow.toWGSL(),
        computeDistanceLightFalloff.toWGSL(),
        calculateLightDiffuse.toWGSL(),
        calculateLightSpecular.toWGSL(),
    ];

    return {
        wgsl: sections.join('\n\n') + '\n',
        calculateLightDiffuse: calculateLightDiffuse as unknown as StandardLightingPars['calculateLightDiffuse'],
        calculateLightSpecular: calculateLightSpecular as unknown as StandardLightingPars['calculateLightSpecular'],
        computeDistanceLightFalloff: computeDistanceLightFalloff as unknown as StandardLightingPars['computeDistanceLightFalloff'],
        getShadow: getShadow as unknown as StandardLightingPars['getShadow'],
        lights: lights as unknown,
        shadowData: shadowData as unknown,
        s_shadowMap: s_shadowMap as unknown,
    };
}
