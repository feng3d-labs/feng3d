import { AssetType } from '../../core/assets/AssetType';
import { Node3D } from '../../core/core/Node3D';
import { oav } from '../../objectview/ObjectView';
import { Serializable } from '../../serialization/Serializable';
import { serialization } from '../../serialization/Serialization';
import { ObjectAsset } from '../ObjectAsset';

export interface Object3DAsset
{
    getAssetData(): Promise<Node3D>;
}

/**
 * 游戏对象资源
 */
@Serializable()
export class Object3DAsset extends ObjectAsset
{
    /**
     * 材质
     */
    @oav({ component: 'OAVObjectView' })
    declare data: Node3D;

    assetType = AssetType.node3d;

    static extenson = '.json';

    initAsset()
    {
        this.data = this.data || new Node3D();
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
