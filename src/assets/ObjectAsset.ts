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
        @watch("_dataChanged")
        $data: AssetData;

        saveFile(callback?: (err: Error) => void)
        {
            this.$data.assetId = this.assetId;
            var d = serialization.serialize(this.$data);
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
                    this.$data = data;
                    debuger && console.assert(this.$data.assetId == this.assetId);
                    callback && callback(err);
                });
            });
        }

        private _dataChanged(property, oldValue, newValue)
        {
            if (oldValue)
            {
                objectevent.off(oldValue, "propertyValueChanged", this._onDataChanged, this);
            }
            if (newValue)
            {
                objectevent.on(newValue, "propertyValueChanged", this._onDataChanged, this);
            }
        }

        private _onDataChanged()
        {
            this.write();
        }
    }
}