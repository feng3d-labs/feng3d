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

    }
}