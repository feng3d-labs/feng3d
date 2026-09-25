import { AssetType } from '../../core/assets/AssetType';
import { GameObject } from '../../core/core/GameObject';
import { oav } from '../../objectview/ObjectView';
import { decoratorRegisterClass } from '../../polyfill/ClassUtils';
import { serialization } from '../../serialization/Serialization';
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
