namespace feng3d
{
    /**
     * JSON 资源
     */
    export class JsonAsset extends TextAsset
    {
        static extenson = ".json";

        assetType = AssetType.json;

        textContent: string;

        initAsset()
        {
            this.textContent = this.textContent || "{}";
        }
    }

    export interface AssetTypeClassMap
    {
        "json": new () => JsonAsset;
    }
    setAssetTypeClass("json", JsonAsset);
}