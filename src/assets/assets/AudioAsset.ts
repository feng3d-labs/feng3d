namespace feng3d
{
    /**
     * 音效资源
     */
    export class AudioAsset extends ArrayBufferAsset
    {
        readonly assetType = AssetType.audio;
        // readonly extenson: ".ogg" | ".mp3" | ".wav" = ".mp3";
    }
}