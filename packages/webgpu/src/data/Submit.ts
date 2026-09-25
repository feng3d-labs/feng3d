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

    /**
     * 提交版本号（按需呈现，框架设计文档 4.2）。
     *
     * 由上层在拉取 submit 时写入全局变更计数；{@link WebGPU.submit} 对比
     * 上次实际提交的版本号，相同则跳过编码与提交（画布保持最后呈现帧）。
     * 未设置（undefined）时不启用跳过逻辑。
     */
    version?: number;
}
