/**
 * points 示例的纹理片元着色器（原 `textured.frag.wgsl` 的 TSL 版）。
 *
 * 对照手写：
 * ```wgsl
 * @group(0) @binding(1) var s: sampler;
 * @group(0) @binding(2) var t: texture_2d<f32>;
 * @fragment fn fs(vsOut: VSOutput) -> @location(0) vec4f {
 *     let color = textureSample(t, s, vsOut.texcoord);
 *     if (color.a < 0.1) { discard; }
 *     return color;
 * }
 * ```
 */
import { discard, fragment, if_, let_, return_, sampler2D, texture, uniform, varying, vec2, vec4 } from '@feng3d/tsl';

/** 懒构建缓存 */
let cached: string | null = null;

/**
 * 获取纹理片元着色器的 WGSL。
 *
 * @returns WGSL 文本
 */
export function getPointsTexturedFragWGSL(): string
{
    if (cached === null)
    {
        const s = sampler2D(uniform('s', 0, 1));
        const t = sampler2D(uniform('t', 0, 2));
        const v_texcoord = vec2(varying('texcoord', 0));

        cached = fragment('fs', () =>
        {
            const color = let_('color', texture(t, v_texcoord));

            if_(color.a.lessThan(0.1), () =>
            {
                discard();
            });

            return_(color);
        }).toWGSL();
    }

    return cached;
}
