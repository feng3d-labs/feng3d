namespace feng3d
{
    export class ShaderFile extends ScriptFile
    {
        assetType = AssetExtension.shader;
    }
    Feng3dAssets.assetTypeClassMap[AssetExtension.shader] = ShaderFile;
}