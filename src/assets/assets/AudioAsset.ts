namespace feng3d
{
    /**
     * 音效资源
     */
    export class AudioAsset extends FileAsset
    {
        assetType = AssetType.audio;

        extenson: ".ogg" | ".mp3" | ".wav" = ".mp3";
    }
}