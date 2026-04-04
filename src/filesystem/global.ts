export { };

declare module '@feng3d/event'
{
    interface GlobalEvents
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
