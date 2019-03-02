namespace feng3d
{
    /**
     * 材质资源
     */
    export class MaterialAsset extends ObjectAsset
    {
        /**
         * 材质
         */
        @oav({ component: "OAVObjectView" })
        data: Material;

        assetType = AssetType.material;

        extenson = ".json";
    }
}