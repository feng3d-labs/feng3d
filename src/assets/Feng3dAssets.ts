namespace feng3d
{
    /**
     * feng3d资源
     */
    export class Feng3dAssets extends Feng3dObject
    {
        /**
         * 资源编号
         */
        assetsId: string;

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

        constructor()
        {
            super();
            this.assetsId = FMath.uuid();
            Feng3dAssets._lib.set(this.assetsId, this);
        }

        private pathChanged()
        {
            // 更新名字
            this.name = pathUtils.getName(this.path);
        }

        /**
         * 获取资源
         * @param assetsId 资源编号
         */
        static getAssets(assetsId: string)
        {
            return this._lib.get(assetsId);
        }

        private static _lib = new Map<string, Feng3dAssets>();
    }
}
