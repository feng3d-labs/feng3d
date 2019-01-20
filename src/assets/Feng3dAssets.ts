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
        assetsId: string;

        /**
         * 名称
         */
        @oav()
        @serialize
        name = "";

        /**
         * 资源类型，由具体对象类型决定
         */
        assetType: AssetExtension;

        constructor()
        {
            super();
        }

        /**
         * 保存文件
         * @param readWriteAssets 可读写资源管理系统
         * @param callback 完成回调
         */
        protected saveFile(readWriteAssets: ReadWriteAssetsFS, callback?: (err: Error) => void)
        {
            callback && callback(null);
        }

        /**
         * 读取文件
         * @param readAssets 刻度资源管理系统
         * @param callback 完成回调
         */
        protected readFile(readAssets: ReadAssetsFS, callback?: (err: Error) => void)
        {
            callback && callback(null);
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
