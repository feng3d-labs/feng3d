/**
 * reversedZ 示例的深度可视化片元着色器（原 `fragmentTextureQuad.wgsl` 的 TSL 版）。
 *
 * 对照手写：
 * ```wgsl
 * @group(0) @binding(0) var depthTexture: texture_depth_2d;
 * @fragment fn main(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
 *     let depthValue = textureLoad(depthTexture, vec2<i32>(floor(coord.xy)), 0);
 *     return vec4<f32>(depthValue, depthValue, depthValue, 1.0);
 * }
 * ```
 */
import { builtin, floor, fragment, ivec2, let_, return_, texelFetch, uniform, vec2, vec4, depthSampler } from '@feng3d/tsl';

/** 懒构建缓存 */
let cached: string | null = null;

/**
 * 获取片元着色器的 WGSL。
 *
 * @returns WGSL 文本
 */
export function getReversedZFragmentTextureQuadWGSL(): string
{
    if (cached === null)
    {
        const depthTexture = depthSampler(uniform('depthTexture', 0, 0));
        // fragment 里的 @builtin(position) 就是 gl_FragCoord
        const coord = vec2(builtin('gl_FragCoord'));

        cached = fragment('main', () =>
        {
            const depthValue = let_('depthValue', texelFetch(depthTexture, ivec2(floor(coord))));

            return_(vec4(depthValue, depthValue, depthValue, 1.0));
        }).toWGSL();
    }

    return cached;
}
