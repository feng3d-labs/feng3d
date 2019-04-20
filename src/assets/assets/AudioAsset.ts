namespace feng3d
{
    /**
     * 音效资源
     */
    export class AudioAsset extends FileAsset
    {
        readonly assetType = AssetType.audio;
        // readonly extenson: ".ogg" | ".mp3" | ".wav" = ".mp3";

        /**
         * 保存文件
         * @param callback 完成回调
         */
        saveFile(callback?: (err: Error) => void)
        {
            callback && callback(null);
        }

        /**
         * 读取文件
         * @param callback 完成回调
         */
        readFile(callback?: (err: Error) => void)
        {
            callback && callback(null);
        }
    }
}