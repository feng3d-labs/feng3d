namespace feng3d
{
    export class JsonFile extends StringFile
    {
        assetType = AssetExtension.json;

        extenson = ".json";

        textContent = "{}";
    }

    Feng3dAssets.assetTypeClassMap[AssetExtension.json] = JsonFile;
}