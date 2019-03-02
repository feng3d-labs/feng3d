namespace feng3d
{
    /**
     * JSON 资源
     */
    export class JsonAsset extends StringAsset
    {
        assetType = AssetType.json;

        extenson = ".json";

        textContent = "{}";
    }
}