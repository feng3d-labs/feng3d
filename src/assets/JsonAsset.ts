namespace feng3d
{
    /**
     * JSON 资源
     */
    export class JsonAsset extends StringAsset
    {
        assetType = AssetExtension.json;

        extenson = ".json";

        textContent = "{}";
    }
}