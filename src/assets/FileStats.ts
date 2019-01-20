namespace feng3d
{

    /**
     * 文件状态
     */
    export interface FileStats
    {
        /**
         * 是否为文件夹，如果不是文件夹则为文件
         */
        isDirectory: boolean;
        /**
         * 文件大小
         */
        size: number;
        /**
         * 修改时间（单位为ms）
         */
        mtimeMs: number;
        /**
         * 创建时间（单位为ms）
         */
        birthtimeMs: number;
    }
}