/**
 * deferredRendering 示例的 G-Buffer 调试视图片元（原 `fragmentGBuffersDebugView.wgsl` 的 TSL 版）。
 *
 * 对照手写：按屏幕横向三分之一，分别显示 position / normal / albedo 三张 G-Buffer；
 * normal 段额外做 [-1,1] → [0,1] 的重新映射。
 *
 * 四处说明：
 * 1. 三张 G-Buffer 是**裸纹理**（textureOnly）；
 * 2. `override canvasSizeWidth: f32;` 是**无默认值**的 override——声明用
 *    `{ overrides: { canvasSizeWidth: { type: 'f32' } } }`，表达式里用 overrideF32(name) 引用；
 * 3. 手写的 `else if` 用嵌套 `if_(...).else(...)` 表达；
 * 4. `result.x = ...` 是向量分量赋值（assign(result.x, ...)）。
 */
import { assign, builtin, float, floor, fragment, if_, ivec2, let_, overrideF32, return_, sampler2D, texelFetch, uniform, var_, vec2, vec4 } from '@feng3d/tsl';

type Vec2Value = ReturnType<typeof vec2>;
type Vec4Value = ReturnType<typeof vec4>;
type FloatValue = ReturnType<typeof float>;

/** 懒构建缓存 */
let cached: string | null = null;

/**
 * 获取 G-Buffer 调试视图片元的 WGSL。
 *
 * @returns WGSL 文本
 */
export function getFragmentGBuffersDebugViewWGSL(): string
{
    if (cached === null)
    {
        // 三张 G-Buffer：裸纹理
        const gBufferPosition = sampler2D(uniform('gBufferPosition', 0, 0), { textureOnly: true });
        const gBufferNormal = sampler2D(uniform('gBufferNormal', 0, 1), { textureOnly: true });
        const gBufferAlbedo = sampler2D(uniform('gBufferAlbedo', 0, 2), { textureOnly: true });

        const coord = vec4(builtin('gl_FragCoord'));

        cached = fragment('main', () =>
        {
            // c = coord.xy / vec2(canvasSizeWidth, canvasSizeHeight)
            const c = let_('c', (coord.xy as Vec2Value)
                .divide(vec2(overrideF32('canvasSizeWidth'), overrideF32('canvasSizeHeight'))) as Vec2Value) as Vec2Value;
            const texel = let_('texel', ivec2(floor(coord.xy as Vec2Value)));

            const result = var_('result', vec4(0.0, 0.0, 0.0, 0.0) as Vec4Value) as Vec4Value;

            if_(c.x.lessThan(0.33333), () =>
            {
                assign(result, texelFetch(gBufferPosition, texel) as Vec4Value);
            }).else(() =>
            {
                if_(c.x.lessThan(0.66667), () =>
                {
                    assign(result, texelFetch(gBufferNormal, texel) as Vec4Value);
                    // [-1,1] → [0,1]（逐分量）
                    assign(result.x as never, (result.x as FloatValue).add(float(1.0)).multiply(float(0.5)) as never);
                    assign(result.y as never, (result.y as FloatValue).add(float(1.0)).multiply(float(0.5)) as never);
                    assign(result.z as never, (result.z as FloatValue).add(float(1.0)).multiply(float(0.5)) as never);
                }).else(() =>
                {
                    assign(result, texelFetch(gBufferAlbedo, texel) as Vec4Value);
                });
            });

            return_(result);
        }, {
            overrides: {
                canvasSizeWidth: { type: 'f32' },
                canvasSizeHeight: { type: 'f32' },
            },
        }).toWGSL();
    }

    return cached;
}
