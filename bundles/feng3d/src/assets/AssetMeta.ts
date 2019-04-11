namespace feng3d
{
    /**
     * 资源元标签
     */
    export interface AssetMeta
    {
        /**
         * 资源编号
         */
        guid: string;

        /**
         * 修改时间（单位为ms）
         */
        mtimeMs: number;

        /**
         * 创建时间（单位为ms）
         */
        birthtimeMs: number;

        /**
         * 资源类型，由具体对象类型决定；AssetExtension.folder 时为文件夹
         */
        assetType: AssetType;
    }
}