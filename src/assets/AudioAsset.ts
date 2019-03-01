namespace feng3d
{
    /**
     * 音效资源
     */
    export class AudioAsset extends FileAsset
    {
        assetType = AssetExtension.audio;

        extenson: ".ogg" | ".mp3" | ".wav" = ".mp3";
    }
}