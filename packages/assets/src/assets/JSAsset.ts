namespace feng3d
{
    /**
     * JS资源
     */
    export class JSAsset extends TextAsset
    {
        static extenson = ".js";

        assetType = AssetType.js;

        textContent: string;

        initAsset()
        {
            this.textContent = this.textContent || "";
        }
    }

    export interface AssetTypeClassMap
    {
        "js": new () => JSAsset;
    }
    setAssetTypeClass("js", JSAsset);
}