export { };

declare global
{
    export interface MixinsGlobalEvents
    {
        /**
         * 删除文件
         */
        'fs.delete': string;
        /**
         * 写文件
         */
        'fs.write': string;
    }
}
