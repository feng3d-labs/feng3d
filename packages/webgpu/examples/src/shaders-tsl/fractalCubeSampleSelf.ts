/**
 * fractalCube 示例的自采样片元着色器（原 `sampleSelf.frag.wgsl` 的 TSL 版）。
 *
 * 对照手写：
 * ```wgsl
 * @binding(1) @group(0) var mySampler: sampler;
 * @binding(2) @group(0) var myTexture: texture_2d<f32>;
 * @fragment fn main(@location(0) fragUV: vec2<f32>, @location(1) fragPosition: vec4<f32>) -> @location(0) vec4<f32> {
 *     let texColor = textureSample(myTexture, mySampler, fragUV * 0.8 + vec2(0.1));
 *     let f = select(1.0, 0.0, length(texColor.rgb - vec3(0.5)) < 0.01);
 *     return f * texColor + (1.0 - f) * fragPosition;
 * }
 * ```
 *
 * **采样器展开顺序与手写相反**，数据侧已跟着改（见 fractalCube/index.ts）。
 */
import { float, fragment, length, let_, return_, sampler2D, select, texture2D, uniform, varying, vec2, vec3, vec4 } from '@feng3d/tsl';

type Vec2Value = ReturnType<typeof vec2>;
type Vec3Value = ReturnType<typeof vec3>;
type Vec4Value = ReturnType<typeof vec4>;

/** 懒构建缓存 */
let cached: string | null = null;

/**
 * 获取片元着色器的 WGSL。
 *
 * @returns WGSL 文本
 */
export function getFractalCubeSampleSelfWGSL(): string
{
    if (cached === null)
    {
        const myTexture = sampler2D(uniform('myTexture', 0, 1));
        const v_fragUV = vec2(varying('fragUV', 0));
        const v_fragPosition = vec4(varying('fragPosition', 1));

        cached = fragment('main', () =>
        {
            // fragUV * 0.8 + vec2(0.1)（TSL 的 vec2(x) 不做标量广播，写成 (x, x)）
            const uv = let_('uv', v_fragUV.multiply(vec2(0.8, 0.8)).add(vec2(0.1, 0.1)) as Vec2Value);
            const texColor = let_('texColor', texture2D(myTexture, uv) as Vec4Value);
            const f = let_('f', select(
                length((texColor.xyz as Vec3Value).subtract(vec3(0.5, 0.5, 0.5)) as Vec3Value).lessThan(0.01),
                float(0.0), float(1.0),
            ));

            return_(float(1.0).subtract(f).multiply(v_fragPosition).add(f.multiply(texColor)) as Vec4Value);
        }).toWGSL();
    }

    return cached;
}
