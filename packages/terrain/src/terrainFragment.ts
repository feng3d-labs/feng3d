/**
 * 地形片段着色器（原 `TerrainMaterial.ts` 里 `terrainFragmentWGSL` 的 TSL 版）。
 *
 * 复用 `@feng3d/feng3d` 的标准片段数据流（`buildStandardFragment`），只做两处派生：
 * - uniform 结构换成 `TerrainUniforms`（多一个 `u_splatRepeats`）；
 * - 在 diffuse 之后插入 **splat 纹理混合**（`terrainMethod`）；
 * - **不含**环境反射步骤（地形无 envmap）。
 *
 * splat 混合对照 `src/shaders/modules/terrainDefault_pars_frag.glsl`：
 * 权重图 RGB 依次把三层 splat 按 `u_splatRepeats.y/z/w` 缩放的 UV 混合进来。
 * 非均匀控制流下用 `textureLod`（lod=0）替代 `textureSample`。
 */
import { float, let_, sampler2D, textureLod, uniform, var_, vec4 } from '@feng3d/tsl';
import { buildStandardFragment } from 'feng3d';

type Vec4Value = ReturnType<typeof vec4>;

/** 懒构建缓存 */
let cachedTerrainFragment: string | null = null;

/**
 * 获取地形片段着色器的 WGSL（首次调用时构建并缓存）。
 *
 * @returns WGSL 文本
 */
export function getTerrainFragmentWGSL(): string
{
    if (cachedTerrainFragment === null)
    {
        cachedTerrainFragment = buildTerrainFragment();
    }

    return cachedTerrainFragment;
}

function buildTerrainFragment(): string
{
    // splat 权重图与三层 splat 纹理（与手写一致的槽位）
    const s_blendTexture = sampler2D(uniform('s_blendTexture', 1, 4));
    const s_splatTexture1 = sampler2D(uniform('s_splatTexture1', 1, 6));
    const s_splatTexture2 = sampler2D(uniform('s_splatTexture2', 1, 8));
    const s_splatTexture3 = sampler2D(uniform('s_splatTexture3', 1, 10));

    return buildStandardFragment({
        materialStructName: 'TerrainUniforms',
        extraMaterialMembers: { u_splatRepeats: vec4 },
        withEnvMap: false,
        afterDiffuse: ({ diffuseColor, uv, material }) =>
        {
            // ---- terrainDefault_pars_frag: splat 混合 ----
            const blend = let_('blend', textureLod(s_blendTexture, uv, float(0.0)));
            const repeats = material.u_splatRepeats as unknown as Vec4Value;

            const t_uv = var_('t_uv', uv.multiply(repeats.y));
            const tColor = var_('tColor', textureLod(s_splatTexture1, t_uv, float(0.0)) as unknown as Vec4Value);
            diffuseColor.assign(tColor.subtract(diffuseColor).multiply(blend.x).add(diffuseColor));

            t_uv.assign(uv.multiply(repeats.z));
            tColor.assign(textureLod(s_splatTexture2, t_uv, float(0.0)) as unknown as Vec4Value);
            diffuseColor.assign(tColor.subtract(diffuseColor).multiply(blend.y).add(diffuseColor));

            t_uv.assign(uv.multiply(repeats.w));
            tColor.assign(textureLod(s_splatTexture3, t_uv, float(0.0)) as unknown as Vec4Value);
            diffuseColor.assign(tColor.subtract(diffuseColor).multiply(blend.z).add(diffuseColor));
        },
    });
}
