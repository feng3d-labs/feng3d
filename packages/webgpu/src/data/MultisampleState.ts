import { RenderPassDescriptor } from './RenderPassDescriptor';

/**
 * 多重采样阶段描述。
 *
 * 多重采样次数将由 {@link RenderPassDescriptor.sampleCount} 覆盖。
 */
export interface MultisampleState
{
    /**
     * Mask determining which samples are written to.
     *
     * 默认为 0xFFFFFFFF 。
     */
    readonly mask?: GPUSampleMask;

    /**
     * When `true` indicates that a fragment's alpha channel should be used to generate a sample
     * coverage mask.
     *
     * 默认为 `false` 。
     */
    readonly alphaToCoverageEnabled?: boolean;
}