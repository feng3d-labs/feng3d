import { AssetType } from '../../core/assets/AssetType';
import { Object3D } from '../../core/core/Object3D';
import { oav } from '../../objectview/ObjectView';
import { serializable } from '../../serialization/ClassUtils';
import { serialization } from '../../serialization/Serialization';
import { ObjectAsset } from '../ObjectAsset';

export interface Object3DAsset
{
    getAssetData(): Promise<Object3D>;
}

/**
 * 游戏对象资源
 */
@serializable()
export class Object3DAsset extends ObjectAsset
{
    /**
     * 材质
     */
    @oav({ component: 'OAVObjectView' })
    declare data: Object3D;

    assetType = AssetType.object3D;

    static extenson = '.json';

    initAsset()
    {
        this.data = this.data || new Object3D();
        this.data.assetId = this.data.assetId || this.assetId;
    }

    protected _getAssetData()
    {
        const object3D = serialization.clone(this.data);
        delete object3D.assetId;
        object3D.prefabId = this.assetId;

        return object3D;
    }
}
