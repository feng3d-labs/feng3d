import { AssetType } from '../../core/assets/AssetType';
import { RegisterAsset } from '../../core/assets/FileAsset';
import { Node3D } from '../../3d/Node3D';
import { oav } from '../../objectview/ObjectView';
import { $clone } from '../../serialization/Serialization';
import { ObjectAsset } from '../ObjectAsset';

export interface Object3DAsset
{
    getAssetData(): Promise<Node3D>;
}

declare module '../../core/assets/FileAsset' { interface AssetMap { Object3DAsset: Object3DAsset; } }

/**
 * 游戏对象资源
 */
@RegisterAsset('Object3DAsset')
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
        const node3d = $clone(this.data);
        delete node3d.assetId;
        node3d.prefabId = this.assetId;

        return node3d;
    }
}
