namespace feng3d
{
    /**
     * 游戏对象资源
     */
    export class GameObjectAsset extends ObjectAsset
    {
        /**
         * 材质
         */
        @oav({ component: "OAVObjectView" })
        data = new GameObject();

        assetType = AssetType.gameobject;

        extenson = ".json";
    }
}