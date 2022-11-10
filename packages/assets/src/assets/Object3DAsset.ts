import { AssetType, Object3D } from '@feng3d/core';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/serialization';
import { serialization } from '@feng3d/serialization';
import { ObjectAsset } from '../ObjectAsset';

export interface Object3DAsset
{
    getAssetData(): Promise<Object3D>;
}

/**
 * 游戏对象资源
 */
@decoratorRegisterClass()
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
