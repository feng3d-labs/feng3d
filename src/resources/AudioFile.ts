namespace feng3d
{
    export class AudioFile extends Feng3dFile
    {
        assetType = AssetExtension.audio;

        extenson: ".ogg" | ".mp3" | ".wav" = ".mp3";
    }

    Feng3dAssets.assetTypeClassMap[AssetExtension.audio] = AudioFile;
}