/**
 * 混合因子（R分量系数，G分量系数，B分量系数）
 *
 * 混合颜色的公式可以这样描述：color(RGBA) = (sourceColor * sfactor) + (destinationColor * dfactor)。这里的 RGBA 值均在0与1之间。
 *
 * The formula for the blending color can be described like this: color(RGBA) = (sourceColor * sfactor) + (destinationColor * dfactor). The RBGA values are between 0 and 1.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFunc
 */
export enum BlendFactor
{
    /**
     * Factor: 0,0,0,0
     *
     * 把所有颜色都乘以0。
     *
     * Multiplies all colors by 0.
     */
    ZERO = 'ZERO',

    /**
     * Factor: 1,1,1,1
     *
     * 把所有颜色都乘以1。
     *
     * Multiplies all colors by 1.
     */
    ONE = 'ONE',

    /**
     * Factor: Rs, Gs, Bs, As
     *
     * 将所有颜色乘以源颜色。
     *
     * Multiplies all colors by the source colors.
     */
    SRC_COLOR = 'SRC_COLOR',

    /**
     * Factor: 1-Rs, 1-Gs, 1-Bs, 1-As
     *
     * 将所有颜色乘以1减去每个源颜色。
     *
     * Multiplies all colors by 1 minus each source color.
     */
    ONE_MINUS_SRC_COLOR = 'ONE_MINUS_SRC_COLOR',

    /**
     * Factor: Rd, Gd, Bd, Ad
     *
     * 将所有颜色乘以目标颜色。
     *
     * Multiplies all colors by the destination color.
     */
    DST_COLOR = 'DST_COLOR',

    /**
     * Factor: 1-Rd, 1-Gd, 1-Bd, 1-Ad
     *
     * 将所有颜色乘以1减去每个目标颜色。
     *
     * Multiplies all colors by 1 minus each destination color.
     */
    ONE_MINUS_DST_COLOR = 'ONE_MINUS_DST_COLOR',

    /**
     * Factor: As, As, As, As
     *
     * 将所有颜色乘以源alpha值。
     *
     * Multiplies all colors by the source alpha value.
     */
    SRC_ALPHA = 'SRC_ALPHA',

    /**
     * Factor: 1-As, 1-As, 1-As, 1-As
     *
     * 将所有颜色乘以1减去源alpha值。
     *
     * Multiplies all colors by 1 minus the source alpha value.
     */
    ONE_MINUS_SRC_ALPHA = 'ONE_MINUS_SRC_ALPHA',

    /**
     * Factor: Ad, Ad, Ad, Ad
     *
     * 将所有颜色乘以目标alpha值。
     *
     * Multiplies all colors by the destination alpha value.
     */
    DST_ALPHA = 'DST_ALPHA',

    /**
     * Factor: 1-Ad, 1-Ad, 1-Ad, 1-Ad
     *
     * 将所有颜色乘以1减去目标alpha值。
     *
     * Multiplies all colors by 1 minus the destination alpha value.
     */
    ONE_MINUS_DST_ALPHA = 'ONE_MINUS_DST_ALPHA',

    /**
     * Factor: Rc, Gc, Bc, Ac
     *
     * 将所有颜色乘以一个常数颜色。
     *
     * Multiplies all colors by a constant color.
     */
    CONSTANT_COLOR = 'CONSTANT_COLOR',

    /**
     * Factor: 1-Rc, 1-Gc, 1-Bc, 1-Ac
     *
     * 所有颜色乘以1减去一个常数颜色。
     *
     * Multiplies all colors by 1 minus a constant color.
     */
    ONE_MINUS_CONSTANT_COLOR = 'ONE_MINUS_CONSTANT_COLOR',

    /**
     * Factor: Ac, Ac, Ac, Ac
     *
     * 将所有颜色乘以一个常量alpha值。
     *
     * Multiplies all colors by a constant alpha value.
     */
    CONSTANT_ALPHA = 'CONSTANT_ALPHA',

    /**
     * Factor: 1-Ac, 1-Ac, 1-Ac, 1-Ac
     *
     * 将所有颜色乘以1减去一个常数alpha值。
     *
     * Multiplies all colors by 1 minus a constant alpha value.
     */
    ONE_MINUS_CONSTANT_ALPHA = 'ONE_MINUS_CONSTANT_ALPHA',

    /**
     * Factor: min(As, 1 - Ad), min(As, 1 - Ad), min(As, 1 - Ad), 1
     *
     * 将RGB颜色乘以源alpha值与1减去目标alpha值的较小值。alpha值乘以1。
     *
     * Multiplies the RGB colors by the smaller of either the source alpha value or the value of 1 minus the destination alpha value. The alpha value is multiplied by 1.
     */
    SRC_ALPHA_SATURATE = 'SRC_ALPHA_SATURATE',
}
