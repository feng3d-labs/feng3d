namespace feng3d
{
    /**
     * 立方体纹理资源
     */
    export class TextureCubeAsset extends ObjectAsset
    {
        static extenson = ".json";

        /**
         * 材质
         */
        @oav({ component: "OAVObjectView" })
        data: TextureCube;

        assetType = AssetType.texturecube;

        initAsset()
        {
            this.data = this.data || new TextureCube();
        }
    }

    export interface AssetTypeClassMap
    {
        "texturecube": new () => TextureCubeAsset;
    }
    setAssetTypeClass("texturecube", TextureCubeAsset);
}