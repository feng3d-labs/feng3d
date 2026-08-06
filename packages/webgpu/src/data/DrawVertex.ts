/**
 * Draws primitives.
 *
 * 根据顶点数据绘制图元。
 *
 * @see GPURenderCommandsMixin.draw
 */
export interface DrawVertex
{
    /**
     * 数据类型。
     */
    readonly __type__: 'DrawVertex';

    /**
     * The number of vertices to draw.
     */
    readonly vertexCount: number;

    /**
     * The number of instances to draw.
     *
     * 默认为 1 。
     */
    readonly instanceCount?: number;

    /**
     * Offset into the vertex buffers, in vertices, to begin drawing from.
     *
     * 默认为 0。
     */
    readonly firstVertex?: number;

    /**
     * First instance to draw.
     *
     * 默认为 0 。
     */
    readonly firstInstance?: number;
}
