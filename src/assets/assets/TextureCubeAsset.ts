namespace feng3d
{
    /**
     * 立方体纹理资源
     */
    export class TextureCubeAsset extends ObjectAsset
    {
        /**
         * 材质
         */
        @oav({ component: "OAVObjectView" })
        data: TextureCube;

        extenson = ".json";

        assetType = AssetType.texturecube;
    }
}