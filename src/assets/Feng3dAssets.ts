namespace feng3d
{
    /**
     * feng3d资源
     */
    export class Feng3dAssets
    {
        /**
         * 路径
         */
        @watch("pathChanged")
        path: string;

        /**
         * 文件(夹)名称
         */
        name: string;

        /**
         * 扩展名
         */
        extension: AssetExtension;

        private pathChanged()
        {
            // 更新名字
            this.name = pathUtils.getName(this.path);
        }
    }
}
