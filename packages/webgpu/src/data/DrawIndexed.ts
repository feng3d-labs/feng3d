/**
 * 根据索引数据绘制图元。
 *
 * @see GPURenderCommandsMixin.drawIndexed
 */
export interface DrawIndexed
{
    /**
     * 数据类型。
     */
    readonly __type__: 'DrawIndexed';

    /**
     * The number of indices to draw.
     *
     * 绘制的顶点索引数量。
     */
    readonly indexCount: number;

    /**
     * The number of instances to draw.
     *
     * 默认为 1 。
     */
    readonly instanceCount?: number;

    /**
     * Offset into the index buffer, in indices, begin drawing from.
     *
     * 默认为 0 。
     */
    readonly firstIndex?: number;

    /**
     * Added to each index value before indexing into the vertex buffers.
     *
     * 默认为 0 。
     */
    readonly baseVertex?: number;

    /**
     * First instance to draw.
     *
     * 默认为 0 。
     */
    readonly firstInstance?: number;
}
