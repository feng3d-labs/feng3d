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

        /**
         * 根据路径获取资源
         * @param path 资源路径
         */
        static getAssetsByPath(path: string, callback: (assets: any) => void)
        {
            var assetsObj = this._lib.getValues().reduce((pv, cv) => { if (cv.path == path) pv = cv; return pv; }, null);
            if (assetsObj)
                callback(assetsObj);
            else
            {
                assets.readFileAsString(path, (err, content: string) =>
                {
                    var json = JSON.parse(content);
                    assetsObj = feng3d.serialization.deserialize(json);
                    assetsObj.path = path;
                    callback(assetsObj);
                });
            }
        }

        private static _lib = new Map<string, Feng3dAssets>();
    }
}
