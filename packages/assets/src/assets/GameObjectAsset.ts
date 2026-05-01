import { AssetType, GameObject } from '@feng3d/core';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialization } from '@feng3d/serialization';
import { ObjectAsset } from '../ObjectAsset';

export interface GameObjectAsset
{
    getAssetData(): Promise<GameObject>;
}

/**
 * 游戏对象资源
 */
@decoratorRegisterClass()
export class GameObjectAsset extends ObjectAsset
{
    /**
     * 材质
     */
    @oav({ component: 'OAVObjectView' })
    declare data: GameObject;

    assetType = AssetType.gameobject;

    static extenson = '.json';

    initAsset()
    {
        this.data = this.data || new GameObject();
        this.data.assetId = this.data.assetId || this.assetId;
    }

    protected _getAssetData()
    {
        const gameobject = serialization.clone(this.data);
        delete gameobject.assetId;
        gameobject.prefabId = this.assetId;

        return gameobject;
    }
}
