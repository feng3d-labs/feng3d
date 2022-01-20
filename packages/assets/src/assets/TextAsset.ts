namespace feng3d
{
    /**
     * 文本 资源
     */
    export class TextAsset extends FileAsset
    {
        static extenson = ".txt";

        assetType = AssetType.txt;

        @oav({ component: "OAVMultiText" })
        textContent: string;

        initAsset()
        {
            this.textContent = this.textContent || "";
        }

        saveFile(callback?: (err: Error) => void)
        {
            this.rs.fs.writeString(this.assetPath, this.textContent, callback);
        }

        /**
         * 读取文件
         * 
         * @param callback 完成回调
         */
        readFile(callback?: (err: Error) => void)
        {
            this.rs.fs.readString(this.assetPath, (err, data) =>
            {
                this.textContent = data;
                callback && callback(err);
            });
        }
    }

    export interface AssetTypeClassMap
    {
        "txt": new () => TextAsset;
    }
    setAssetTypeClass("txt", TextAsset);
}