namespace feng3d
{
    export interface GameObjectAsset
    {
        getAssetData(callback?: (result: GameObject) => void): GameObject;
    }

    /**
     * 游戏对象资源
     */
    export class GameObjectAsset extends ObjectAsset
    {
        /**
         * 材质
         */
        @oav({ component: "OAVObjectView" })
        data: GameObject;

        assetType = AssetType.gameobject;

        static extenson = ".json";

        initAsset()
        {
            this.data = this.data || new GameObject();
            this.data.assetId = this.data.assetId || this.assetId;
        }

        protected _getAssetData()
        {
            var gameobject = serialization.clone(this.data);
            delete gameobject.assetId;
            gameobject.prefabId = this.assetId;
            return gameobject;
        }
    }
}