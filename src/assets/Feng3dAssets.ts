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
        @serialize
        @watch("assetsIdChanged")
        // @oav({ componentParam: { editable: false } })
        assetsId: string;

        /**
         * 名称
         */
        @serialize
        @oav()
        name = "";

        /**
         * 资源类型，由具体对象类型决定
         */
        assetType: AssetExtension;

        /**
         * 资源路径，由资源编号决定
         */
        path: string;

        constructor()
        {
            super();
        }

        protected assetsIdChanged()
        {
            this.path = Feng3dAssets.getPath(this.assetsId);
        }

        /**
         * 获取资源路径
         * @param assetsId 资源编号
         */
        static getPath(assetsId: string): any
        {
            return "Library/" + assetsId + "/.json";
        }

        static setAssets(assets: Feng3dAssets)
        {
            this._lib.set(assets.assetsId, assets);
        }

        /**
         * 获取资源
         * @param assetsId 资源编号
         */
        static getAssets(assetsId: string)
        {
            return this._lib.get(assetsId);
        }

        /**
         * 获取指定类型资源
         * @param type 资源类型
         */
        static getAssetsByType<T extends Feng3dAssets>(type: Constructor<T>): T[]
        {
            return <any>this._lib.getValues().filter(v => v instanceof type);
        }

        private static _lib = new Map<string, Feng3dAssets>();
    }
}
