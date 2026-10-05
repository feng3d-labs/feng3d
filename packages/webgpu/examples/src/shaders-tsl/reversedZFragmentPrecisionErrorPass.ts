/**
 * reversedZ 示例的精度误差可视化片元着色器（原 `fragmentPrecisionErrorPass.wgsl` 的 TSL 版）。
 *
 * 对照手写：
 * ```wgsl
 * @group(1) @binding(0) var depthTexture: texture_depth_2d;
 * @fragment fn main(@builtin(position) coord: vec4<f32>, @location(0) clipPos: vec4<f32>) -> @location(0) vec4<f32> {
 *     let depthValue = textureLoad(depthTexture, vec2<i32>(floor(coord.xy)), 0);
 *     let v: f32 = abs(clipPos.z / clipPos.w - depthValue) * 2000000.0;
 *     return vec4<f32>(v, v, v, 1.0);
 * }
 * ```
 */
import { abs, builtin, depthSampler, float, floor, fragment, ivec2, let_, return_, texelFetch, uniform, var_, varying, vec2, vec4 } from '@feng3d/tsl';

/** 懒构建缓存 */
let cached: string | null = null;

/**
 * 获取片元着色器的 WGSL。
 *
 * @returns WGSL 文本
 */
export function getReversedZFragmentPrecisionErrorPassWGSL(): string
{
    if (cached === null)
    {
        // 注意：手写里这个绑定在 group 1、binding 0
        const depthTexture = depthSampler(uniform('depthTexture', 1, 0));
        const coord = vec2(builtin('gl_FragCoord'));
        const v_clipPos = vec4(varying('clipPos', 0));

        cached = fragment('main', () =>
        {
            const depthValue = let_('depthValue', texelFetch(depthTexture, ivec2(floor(coord))));
            const v = var_('v', abs(v_clipPos.z.divide(v_clipPos.w).subtract(depthValue)).multiply(2000000.0));

            return_(vec4(v, v, v, float(1.0)));
        }).toWGSL();
    }

    return cached;
}
