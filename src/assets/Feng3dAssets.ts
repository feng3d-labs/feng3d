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
        path: string;

        /**
         * 文件(夹)名称
         */
        get name()
        {
            return this.path && pathUtils.getName(this.path);
        }

        /**
         * 扩展名
         */
        get extension(): AssetExtension
        {
            return <any>(this.path && pathUtils.getExtension(this.path));
        }

        constructor()
        {
            super();
            this.assetsId = FMath.uuid();
            Feng3dAssets._lib.set(this.assetsId, this);
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
