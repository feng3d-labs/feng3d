import { BlendState } from './BlendState';

/**
 * 属性 `format` 将由渲染通道中附件给出。
 *
 * @see https://gpuweb.github.io/gpuweb/#dictdef-gpucolortargetstate
 */
export interface ColorTargetState
{
    /**
     * The blending behavior for this color target. If left undefined, disables blending for this
     * color target.
     *
     * 定义如何混合到目标颜色中。
     *
     * 默认 `undefined`，表示不进行混合。
     */
    readonly blend?: BlendState;

    /**
     * 控制那些颜色分量是否可以被写入到颜色中。
     *
     * [red: boolean, green: boolean, blue: boolean, alpha: boolean]
     *
     * 默认 [true,true,true,true]
     */
    readonly writeMask?: WriteMask;
}

export type WriteMask = readonly [red: boolean, green: boolean, blue: boolean, alpha: boolean];
