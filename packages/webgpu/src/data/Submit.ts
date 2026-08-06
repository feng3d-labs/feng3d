import { CommandEncoder } from './CommandEncoder';

/**
 * 一次 GPU 提交。
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/GPUQueue/submit
 */
export interface Submit
{
    /**
     * 命令编码器列表。
     */
    commandEncoders: CommandEncoder[];
}
