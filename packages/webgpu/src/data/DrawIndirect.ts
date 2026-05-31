import { Buffer } from './Buffer';

/**
 * 根据间接绘制缓冲区中的数据绘制图元（无索引）。
 *
 * @see GPURenderCommandsMixin.drawIndirect
 */
export interface DrawIndirect
{
    /**
     * 数据类型。
     */
    readonly __type__: 'DrawIndirect';

    /**
     * 包含绘制参数的间接缓冲区。
     *
     * 缓冲区必须包含以下连续的 4 个 32 位值：
     * - vertexCount: number（顶点数量）
     * - instanceCount: number（实例数量）
     * - firstVertex: number（起始顶点）
     * - firstInstance: number（起始实例）
     */
    readonly buffer: Buffer;

    /**
     * 间接缓冲区中的偏移量（字节）。
     *
     * 默认为 0。
     */
    readonly offset?: number;
}
