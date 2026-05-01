import { Buffer } from './Buffer';

/**
 * 根据间接绘制缓冲区中的数据绘制图元。
 *
 * @see GPURenderCommandsMixin.drawIndexedIndirect
 */
export interface DrawIndexedIndirect
{
    /**
     * 数据类型。
     */
    readonly __type__: 'DrawIndexedIndirect';

    /**
     * 包含绘制参数的间接缓冲区。
     *
     * 缓冲区必须包含以下连续的 5 个 32 位值：
     * - indexCount: number（索引数量）
     * - instanceCount: number（实例数量）
     * - firstIndex: number（起始索引）
     * - baseVertex: number（顶点偏移）
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
