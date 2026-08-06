import { CompareFunction, StencilFaceState } from './StencilFaceState';

/**
 * 深度模板阶段描述。
 *
 * `format` 将从深度附件 {@link IGPURenderPassDescriptor.depthStencilAttachment} 纹理上获取。
 *
 * {@link GPUDepthStencilState}
 *
 * @see https://www.orillusion.com/zh/webgpu.html#depth-stencil-state
 */
export interface DepthStencilState
{
    /**
     * 指示这个 GPURenderPipeline 是否可以修改 depthStencilAttachment 深度值。
     *
     * 默认为 `true` 。
     */
    readonly depthWriteEnabled?: boolean;

    /**
     * 用于测试片元深度与 depthStencilAttachment 深度值的比较操作。
     *
     * 默认 `'less'` 。
     */
    readonly depthCompare?: CompareFunction;

    /**
     * 定义了如何为朝前的图元执行模板比较和操作。
     *
     * 默认为 {}。
     */
    readonly stencilFront?: StencilFaceState;

    /**
     * 定义了如何为朝后的图元执行模板比较和操作。
     *
     * 默认为 {}。
     */
    readonly stencilBack?: StencilFaceState;

    /**
     * 模板测试时如果使用 "replace" ，则使用该值填充模板值。
     *
     * 默认为 0 。
     */
    readonly stencilReference?: number;

    /**
     * 掩码控制在执行模板比较测试时读取哪些 depthStencilAttachment 模板值位。
     *
     * 默认为 0xFFFFFFFF 。
     */
    readonly stencilReadMask?: number;

    /**
     * 掩码控制可以写入哪些 depthStencilAttachment 模板值位。
     *
     * 默认为 0xFFFFFFFF 。
     */
    readonly stencilWriteMask?: number;

    /**
     * 添加到每个片元的恒定深度偏差。
     *
     * 默认为 0 。
     */
    readonly depthBias?: number;

    /**
     * 与片元的斜率成比例的深度偏差。
     *
     * 默认为 0 。
     */
    readonly depthBiasSlopeScale?: number;

    /**
     * 片元的最大深度偏差。
     *
     * 默认为 0 。
     */
    readonly depthBiasClamp?: number;
}

/**
 * 如果任意模板测试结果使用了 "replace" 运算，则需要再渲染前设置 `stencilReference` 值。
 *
 * @param depthStencil
 * @returns
 */
export function getStencilReference(depthStencil?: DepthStencilState): number | undefined
{
    if (!depthStencil) return undefined;

    const { stencilFront, stencilBack } = depthStencil;

    // 如果开启了模板测试，则需要设置模板索引值
    let stencilReference: number;

    if (stencilFront)
    {
        const { failOp, depthFailOp, passOp } = stencilFront;

        if (failOp === 'replace' || depthFailOp === 'replace' || passOp === 'replace')
        {
            stencilReference = depthStencil?.stencilReference ?? 0;
        }
    }
    if (stencilBack)
    {
        const { failOp, depthFailOp, passOp } = stencilBack;

        if (failOp === 'replace' || depthFailOp === 'replace' || passOp === 'replace')
        {
            stencilReference = depthStencil?.stencilReference ?? 0;
        }
    }

    return stencilReference;
}
