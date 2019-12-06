namespace feng3d
{
    /**
     * 对象资源
     */
    export abstract class ObjectAsset extends FileAsset
    {
        /**
         * 资源对象
         */
        @oav({ component: "OAVObjectView" })
        get data()
        {
            return this._data;
        }
        set data(v)
        {
            if (this._data == v) return;
            if (this._data)
            {
                objectevent.off(this._data, "propertyValueChanged", this._onDataChanged, this);
            }
            this._data = v;
            if (this._data)
            {
                objectevent.on(this._data, "propertyValueChanged", this._onDataChanged, this);
            }

        }

        private _data: AssetData;

        saveFile(callback?: (err: Error) => void)
        {
            this.data.assetId = this.assetId;
            var d = serialization.serialize(this.data);
            this.rs.fs.writeObject(this.assetPath, d, (err) =>
            {
                callback && callback(err);
            });
        }

        /**
         * 读取文件
         * 
         * @param callback 完成回调
         */
        readFile(callback?: (err: Error) => void)
        {
            this.rs.fs.readObject(this.assetPath, (err, object) =>
            {
                this.rs.deserializeWithAssets(object, (data: AssetData) =>
                {
                    this.data = data;
                    console.assert(this.data.assetId == this.assetId);
                    callback && callback(err);
                });
            });
        }

        private _onDataChanged()
        {
            this.write();
        }
    }
}