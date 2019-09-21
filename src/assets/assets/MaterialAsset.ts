namespace feng3d
{
    /**
     * 材质资源
     */
    export class MaterialAsset extends ObjectAsset
    {
        static extenson = ".json";

        /**
         * 材质
         */
        @oav({ component: "OAVObjectView" })
        data: Material;

        assetType = AssetType.material;

        initAsset()
        {
            this.data = this.data || new Material();
            this.data.assetId = this.data.assetId || this.assetId;

            AssetData.addAssetData(this.assetId, this.data);
        }
    }
}