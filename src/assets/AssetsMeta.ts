namespace feng3d
{
    /**
     * 资源元标签文件后缀
     */
    export const metaSuffix = ".meta";

    /**
     * 资源元标签
     */
    export interface AssetsMeta
    {
        /**
         * 资源编号
         */
        guid: string;

        /**
         * 是否为文件夹，如果不是文件夹则为文件
         */
        isDirectory: boolean;

        /**
         * 修改时间（单位为ms）
         */
        mtimeMs: number;

        /**
         * 创建时间（单位为ms）
         */
        birthtimeMs: number;

        /**
         * 资源类型，由具体对象类型决定
         */
        assetType: AssetExtension;
    }
}