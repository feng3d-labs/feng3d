/**
 * shadowMapping 示例的阴影片元着色器（原 `fragment.wgsl` 的 TSL 版）。
 *
 * 对照手写：3x3 的 PCF（百分比接近过滤）——每像素做 9 次深度比较采样取平均；
 * 再做 Lambert + 环境光的照明合成。
 *
 * 四处说明：
 * 1. `override shadowDepthTextureSize: f32 = 1024.0` 用 TSL 新增的
 *    `fragment(name, body, { overrides })`（与 compute 的做法一致）；
 * 2. 两层 `for (var y = -1; y <= 1; y++)` 用 forRange_（from 可为负，to 取开区间——
 *    所以 `<= 1` 对应 `to = 2`）；
 * 3. 深度比较采样用 samplerComparison + textureSampleCompare；
 * 4. 中间值一律 let_（避免内联改变浮点结合顺序）。
 */
import { dot, float, forRange_, fragment, let_, mat4, max, min, normalize, return_, samplerComparison, struct, textureSampleCompare, uniform, var_, varying, vec2, vec3, vec4 } from '@feng3d/tsl';

type Vec2Value = ReturnType<typeof vec2>;
type Vec3Value = ReturnType<typeof vec3>;
type Vec4Value = ReturnType<typeof vec4>;
type FloatValue = ReturnType<typeof float>;

/** 手写的顶层常量 */
const ALBEDO = 0.9;
const AMBIENT_FACTOR = 0.2;

/** 懒构建缓存 */
let cached: string | null = null;

/**
 * 获取阴影片元的 WGSL。
 *
 * @returns WGSL 文本
 */
export function getShadowMappingFragmentWGSL(): string
{
    if (cached === null)
    {
        const Scene = struct('Scene', {
            lightViewProjMatrix: mat4,
            cameraViewProjMatrix: mat4,
            lightPos: vec3,
        });
        const scene = Scene(uniform('scene', 0, 0)) as unknown as { lightPos: Vec3Value };
        // 以 shadowMap 为宿主：TSL 展开成 shadowMap_texture（texture_depth_2d，binding 1）
        // + shadowMap（sampler_comparison，binding 2）——与手写的 shadowMap/shadowSampler 同槽位。
        const shadowSampler = samplerComparison(uniform('shadowMap', 0, 1));

        const v_shadowPos = vec3(varying('shadowPos', 0));
        const v_fragPos = vec3(varying('fragPos', 1));
        const v_fragNorm = vec3(varying('fragNorm', 2));

        cached = fragment('main', () =>
        {
            const visibility = var_('visibility', float(0.0)) as FloatValue;
            const oneOverSize = let_('oneOverShadowDepthTextureSize', float(1.0).divide(float(1024.0)) as FloatValue) as FloatValue;

            forRange_('y', -1, 2, (y) =>
            {
                forRange_('x', -1, 2, (x) =>
                {
                    const offset = let_('offset', vec2(float(x), float(y))
                        .multiply(vec2(oneOverSize, oneOverSize)) as Vec2Value) as Vec2Value;
                    // Vec3 没有 .xy，逐分量取
                    const coord = let_('coord', vec2(v_shadowPos.x, v_shadowPos.y).add(offset) as Vec2Value) as Vec2Value;
                    const depthRef = let_('depthRef', v_shadowPos.z.subtract(float(0.007)) as FloatValue) as FloatValue;
                    const sample = let_('sample', textureSampleCompare(shadowSampler, coord, depthRef) as FloatValue) as FloatValue;

                    visibility.assign(visibility.add(sample) as FloatValue);
                });
            });
            visibility.assign(visibility.divide(float(9.0)) as FloatValue);

            // lambertFactor = max(dot(normalize(lightPos - fragPos), fragNorm), 0.0)
            const lightDir = let_('lightDir', normalize((scene.lightPos as Vec3Value).subtract(v_fragPos) as Vec3Value) as Vec3Value) as Vec3Value;
            const lambertFactor = let_('lambertFactor', max(dot(lightDir, v_fragNorm), float(0.0)) as FloatValue) as FloatValue;
            // lightingFactor = min(ambient + visibility * lambert, 1.0)
            const lightingFactor = let_('lightingFactor', min(
                float(AMBIENT_FACTOR).add((visibility.multiply(lambertFactor) as FloatValue)) as FloatValue,
                float(1.0),
            ) as FloatValue) as FloatValue;

            return_(vec4(lightingFactor.multiply(float(ALBEDO)) as FloatValue, lightingFactor.multiply(float(ALBEDO)) as FloatValue, lightingFactor.multiply(float(ALBEDO)) as FloatValue, float(1.0)) as Vec4Value);
        }, { overrides: { shadowDepthTextureSize: '1024.0' } }).toWGSL();
    }

    return cached;
}
