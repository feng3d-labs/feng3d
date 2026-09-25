import { AssetType, reactive } from 'feng3d';
import type { Object3D } from 'feng3d';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
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
        this.data = this.data || ({ __type__: 'Object3D' } as Object3D);
        reactive(this.data).assetId = this.data.assetId || this.assetId;
    }

    protected _getAssetData()
    {
        const object3D = serialization.clone(this.data);
        delete reactive(object3D).assetId;
        reactive(object3D).prefabId = this.assetId;

        return object3D;
    }
}
