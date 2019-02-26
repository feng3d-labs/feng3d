namespace feng3d
{
    export class JsonFile extends StringFile
    {
        assetType = AssetExtension.json;

        textContent = "{}";
    }

    Feng3dAssets.assetTypeClassMap[AssetExtension.json] = JsonFile;
}