namespace feng3d
{
    /**
     * 资源数据
     * 
     * 该对象可由资源文件中读取，或者保存为资源
     */
    export class AssetData extends Feng3dObject
    {
        /**
         * 资源名称
         */
        @serialize
        get name()
        {
            if (!this._name)
            {
                var asset = rs.getAsset(this.assetId);
                if (asset) return asset.fileName;
            }
            return this._name;
        }
        set name(v) { this._name = v; }
        private _name: string;

        /**
         * 资源编号
         */
        @serialize
        get assetId()
        {
            return this._assetId;
        }
        set assetId(v)
        {
            if (this._assetId == v) return;

            if (this._assetId != undefined) { debug.debuger && console.error(`不允许修改 assetId`); return; }

            this._assetId = v;
        }
        private _assetId: string;

        /**
         * 资源类型，由具体对象类型决定
         */
        assetType: AssetType;
    }
}