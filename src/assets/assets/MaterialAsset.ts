namespace feng3d
{
    /**
     * 材质资源
     */
    export class MaterialAsset extends FileAsset
    {
        /**
         * 材质
         */
        @oav({ component: "OAVObjectView" })
        data: Material;

        assetType = AssetType.material;

        extenson = ".json";

        protected saveFile(callback?: (err: Error) => void)
        {
            assign(this.data, "assetId", this.assetId);
            this.rs.fs.writeObject(this.assetPath, this.data, callback);
        }

        /**
         * 读取文件
         * @param fs 刻度资源管理系统
         * @param callback 完成回调
         */
        protected readFile(callback?: (err: Error) => void)
        {
            this.rs.fs.readObject(this.assetPath, (err, data: Material) =>
            {
                this.data = data;
                Object.setValue(this.data, { assetId: this.assetId });

                assign(this.data, "assetId", this.assetId);
                callback && callback(err);
            });
        }
    }

    /**
     * 给指定对象属性赋值
     * 
     * 可用于给只读对象赋值而不被编译器报错
     * 
     * @param host 被赋值对象
     * @param property 被赋值属性
     * @param value 属性值
     */
    function assign<T, K extends keyof T, V extends T[K]>(host: T, property: K, value: V)
    {
        host[property] = value;
    }
}