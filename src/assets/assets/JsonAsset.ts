namespace feng3d
{
    /**
     * JSON 资源
     */
    export class JsonAsset extends StringAsset
    {
        static extenson = ".json";

        assetType = AssetType.json;

        textContent = "{}";
    }
}