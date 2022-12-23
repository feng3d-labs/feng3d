import { IReadFS } from './IReadFS';
import { ReadFS } from './ReadFS';

export class FS
{
    /**
     * 默认文件系统
     */
    static fs: ReadFS;

    /**
     * 默认基础文件系统
     */
    static basefs: IReadFS;
}
