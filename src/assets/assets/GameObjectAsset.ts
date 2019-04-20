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

        createData()
        {
            this.data = new GameObject();
            this.data.assetId = this.assetId;

            AssetData.addAssetData(this.assetId, this.data);
        }

        protected _getAssetData()
        {
            var gameobject = new feng3d.GameObject();
            feng3d.serialization.setValue(gameobject, this.data);
            delete gameobject.assetId;
            gameobject.prefabId = this.assetId;
            return gameobject;
        }
    }
}