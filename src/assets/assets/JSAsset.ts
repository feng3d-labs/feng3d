namespace feng3d
{
    /**
     * JS资源
     */
    export class JSAsset extends StringAsset
    {
        static extenson = ".js";

        assetType = AssetType.js;

        textContent: string;

        initAsset()
        {
            this.textContent = this.textContent || "";
        }
    }
}