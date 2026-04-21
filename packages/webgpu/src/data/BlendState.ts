import { BlendComponent } from './BlendComponent';
import { Color } from './RenderPassColorAttachment';

/**
 * 混合状态。
 *
 * 定义如何混合到目标颜色中。
 *
 * @see https://gpuweb.github.io/gpuweb/#dictdef-gpublendstate
 */
export interface BlendState
{
    /**
     * 混合时使用的常量值，默认为 [0,0,0,0]。
     *
     * 当 {@link BlendComponent.srcFactor} {@link BlendComponent.dstFactor} 取值为 "constant" 或者 "one-minus-constant" 时生效。
     *
     * @see https://gpuweb.github.io/gpuweb/#dom-renderstate-blendconstant-slot
     *
     * 注：只取 renderPipeline.fragment?.targets?.[0]?.blend.constantColor 值。
     */
    readonly constantColor?: Color;

    /**
     * 为颜色通道定义相应渲染目标的混合行为。
     */
    readonly color?: BlendComponent;

    /**
     * 为alpha通道定义相应渲染目标的混合行为。
     */
    readonly alpha?: BlendComponent;
}

export class BlendState
{
    /**
     * 当混合系数用到了混合常量值时设置混合常量值。
     *
     * @param blend
     * @returns
     */
    static getBlendConstantColor(blendState: BlendState): Color | undefined
    {
        if (!blendState) return undefined;

        const { color, alpha } = blendState;

        // 当混合系数用到了混合常量值时设置混合常量值。
        if (0
            || color?.srcFactor === 'constant'
            || color?.srcFactor === 'one-minus-constant'
            || color?.dstFactor === 'constant'
            || color?.dstFactor === 'one-minus-constant'
            || alpha?.srcFactor === 'constant'
            || alpha?.srcFactor === 'one-minus-constant'
            || alpha?.dstFactor === 'constant'
            || alpha?.dstFactor === 'one-minus-constant'
        )
        {
            const constantColor = blendState.constantColor;

            if (constantColor)
            {
                return constantColor;
            }

            return constantColor ?? [0, 0, 0, 0];
        }

        return undefined;
    }
}
