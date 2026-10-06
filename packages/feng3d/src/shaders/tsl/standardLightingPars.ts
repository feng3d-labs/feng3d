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
import { array, clamp, dot, float, fract, func, if_, let_, mat4, max, mix, normalize, pow, return_, samplerComparison, select, struct, textureSampleCompare, uniform, var_, vec2, vec3 } from '@feng3d/tsl';
/** TSL 标量 / 二维向量值类型（`let_` 保持传入类型，这里用于收窄多态运算的返回类型） */
type FloatValue = ReturnType<typeof float>;
type Vec2Value = ReturnType<typeof vec2>;

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
    // 布局与 standardVertex.ts 的 ShadowVPUniforms **必须逐字段一致**（同一 group/binding 的
    // uniform 在两个阶段必须类型兼容）。字段位置：mat4(0) + vec3(64) + 5×f32(76..95)
    // + vec2(96) + f32(104) → 108，按 mat4 的 16 字节对齐补齐到 112（与原 _pad0/_pad1 布局同大小）。
    const ShadowUniforms = struct('ShadowUniforms', {
        u_shadowVP: mat4,
        u_lightPosition: vec3,
        u_shadowCameraNear: float,
        u_shadowCameraFar: float,
        u_shadowBias: float,
        u_shadowEnabled: float,
        /** 阴影类型（ShadowType：1=硬、2=PCF、3=PCF_SOFT） */
        u_shadowType: float,
        /** 阴影贴图尺寸（宽 × 高，像素）：PCF 用它换算纹素步长 */
        u_shadowMapSize: vec2,
        /** 阴影采样半径（three.js 的 shadow.radius） */
        u_shadowRadius: float,
    });
    const lights = LightsUniform(uniform('lights', 0, 4));
    const shadowData = ShadowUniforms(uniform('shadowData', 0, 5));

    // depth 纹理 + sampler_comparison（硬件 PCF 深度比较）
    const s_shadowMap = samplerComparison(uniform('s_shadowMap', 2, 0));

    // ---- getShadow：对齐 three.js 的 shadowmap_pars_fragment.glsl.js ----
    //
    // three 按 shadowMap.type 编译出三档实现，这里用运行期 uniform（u_shadowType）分派：
    //   Hard_Shadows(1)   ：单次比较（对应 three 的 `#else` 无 PCF 分支）
    //   PCF_Shadows(2)    ：17 次比较（3×3 网格 + 半步中点），偏移 = texel × shadowRadius
    //   PCF_Soft_Shadows(3)：9 次比较 + mix（按纹素内的亚像素位置做双线性插值）
    //
    // 条件全部来自 uniform，属 WGSL 的 uniform control flow——这是 `textureSampleCompare`
    // 允许出现在分支内的前提。
    const getShadow = func(
        'getShadow',
        [['shadowPos', vec3]],
        float,
        (shadowPos) =>
        {
            const uv = let_('uv', vec2(shadowPos.x, shadowPos.y)) as Vec2Value;
            const depthRef = let_('depthRef', shadowPos.z.subtract(shadowData.u_shadowBias)) as FloatValue;
            const inFrustum = let_('inFrustum',
                uv.x.greaterThanOrEqual(0.0)
                    .and(uv.x.lessThanOrEqual(1.0))
                    .and(uv.y.greaterThanOrEqual(0.0))
                    .and(uv.y.lessThanOrEqual(1.0))
                    .and(depthRef.lessThanOrEqual(1.0))
                    .and(depthRef.greaterThanOrEqual(0.0)));
            const shadow = var_('shadow', float(1.0)) as FloatValue;

            // ---- 硬阴影（ShadowType.Hard_Shadows = 1）----
            if_(shadowData.u_shadowType.lessThan(1.5), () =>
            {
                shadow.assign(textureSampleCompare(s_shadowMap, uv, depthRef));
            });

            // ---- PCF（ShadowType.PCF_Shadows = 2）：three 的 SHADOWMAP_TYPE_PCF ----
            if_(shadowData.u_shadowType.greaterThanOrEqual(1.5).and(shadowData.u_shadowType.lessThan(2.5)), () =>
            {
                const size = shadowData.u_shadowMapSize;
                const texelX = let_('pcfTexelX', float(1.0).divide(size.x)) as FloatValue;
                const texelY = let_('pcfTexelY', float(1.0).divide(size.y)) as FloatValue;
                const radius = let_('pcfRadius', shadowData.u_shadowRadius) as FloatValue;
                const scaledX = let_('pcfScaledX', texelX.multiply(radius)) as FloatValue;
                const scaledY = let_('pcfScaledY', texelY.multiply(radius)) as FloatValue;
                const dx0 = let_('pcfDx0', scaledX.multiply(-1.0)) as FloatValue;
                const dy0 = let_('pcfDy0', scaledY.multiply(-1.0)) as FloatValue;
                const dx1 = let_('pcfDx1', scaledX) as FloatValue;
                const dy1 = let_('pcfDy1', scaledY) as FloatValue;
                const dx2 = let_('pcfDx2', dx0.divide(2.0)) as FloatValue;
                const dy2 = let_('pcfDy2', dy0.divide(2.0)) as FloatValue;
                const dx3 = let_('pcfDx3', dx1.divide(2.0)) as FloatValue;
                const dy3 = let_('pcfDy3', dy1.divide(2.0)) as FloatValue;

                const pcfSum = var_('pcfSum', float(0.0)) as FloatValue;
                const tap = (dx: unknown, dy: unknown) =>
                {
                    pcfSum.assign(pcfSum.add(
                        textureSampleCompare(s_shadowMap, uv.add(vec2(dx as never, dy as never)), depthRef),
                    ));
                };

                tap(dx0, dy0);
                tap(0.0, dy0);
                tap(dx1, dy0);
                tap(dx2, dy2);
                tap(0.0, dy2);
                tap(dx3, dy2);
                tap(dx0, 0.0);
                tap(dx2, 0.0);
                tap(0.0, 0.0);
                tap(dx3, 0.0);
                tap(dx1, 0.0);
                tap(dx2, dy3);
                tap(0.0, dy3);
                tap(dx3, dy3);
                tap(dx0, dy1);
                tap(0.0, dy1);
                tap(dx1, dy1);
                shadow.assign(pcfSum.divide(17.0));
            });

            // ---- PCF Soft（ShadowType.PCF_Soft_Shadows = 3）：three 的 SHADOWMAP_TYPE_PCF_SOFT ----
            if_(shadowData.u_shadowType.greaterThanOrEqual(2.5), () =>
            {
                const size = shadowData.u_shadowMapSize;
                const texelX = let_('softTexelX', float(1.0).divide(size.x)) as FloatValue;
                const texelY = let_('softTexelY', float(1.0).divide(size.y)) as FloatValue;
                // f = fract(uv * shadowMapSize + 0.5)
                const fx = let_('softFractX', fract(uv.x.multiply(size.x).add(float(0.5)))) as FloatValue;
                const fy = let_('softFractY', fract(uv.y.multiply(size.y).add(float(0.5)))) as FloatValue;
                // uv -= f * texelSize
                const baseX = let_('softUvX', uv.x.subtract(fx.multiply(texelX))) as FloatValue;
                const baseY = let_('softUvY', uv.y.subtract(fy.multiply(texelY))) as FloatValue;
                const twoTexelX = let_('softTwoTexelX', texelX.multiply(2.0)) as FloatValue;
                const twoTexelY = let_('softTwoTexelY', texelY.multiply(2.0)) as FloatValue;

                const compareAt = (x: unknown, y: unknown) =>
                    textureSampleCompare(s_shadowMap, vec2(x as never, y as never), depthRef);
                const softSum = var_('softSum', float(0.0)) as FloatValue;
                const addTap = (value: unknown) =>
                {
                    softSum.assign(softSum.add(value as never));
                };

                addTap(compareAt(baseX, baseY));
                addTap(compareAt(baseX.add(texelX), baseY));
                addTap(compareAt(baseX, baseY.add(texelY)));
                addTap(compareAt(baseX.add(texelX), baseY.add(texelY)));
                addTap(mix(compareAt(baseX.subtract(texelX), baseY), compareAt(baseX.add(twoTexelX), baseY), fx as never));
                addTap(mix(compareAt(baseX.subtract(texelX), baseY.add(texelY)), compareAt(baseX.add(twoTexelX), baseY.add(texelY)), fx as never));
                addTap(mix(compareAt(baseX, baseY.subtract(texelY)), compareAt(baseX, baseY.add(twoTexelY)), fy as never));
                addTap(mix(compareAt(baseX.add(texelX), baseY.subtract(texelY)), compareAt(baseX.add(texelX), baseY.add(twoTexelY)), fy as never));
                addTap(mix(
                    mix(compareAt(baseX.subtract(texelX), baseY.subtract(texelY)), compareAt(baseX.add(twoTexelX), baseY.subtract(texelY)), fx as never),
                    mix(compareAt(baseX.subtract(texelX), baseY.add(twoTexelY)), compareAt(baseX.add(twoTexelX), baseY.add(twoTexelY)), fx as never),
                    fy as never,
                ));

                shadow.assign(softSum.divide(9.0));
            });

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
