namespace feng3d
{
    export class AudioFile extends Feng3dFile
    {
        assetType = AssetExtension.audio;
    }

    Feng3dAssets.assetTypeClassMap[AssetExtension.audio] = AudioFile;
}