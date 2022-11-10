import { AssetType, Material, setAssetTypeClass } from '@feng3d/core';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/serialization';
import { ObjectAsset } from '../ObjectAsset';

declare global
{
    export interface MixinsAssetTypeClassMap
    {
        'material': new () => MaterialAsset;
    }
}

/**
 * 材质资源
 */
@decoratorRegisterClass()
export class MaterialAsset extends ObjectAsset
{
    static extenson = '.json';

    /**
     * 材质
     */
    @oav({ component: 'OAVObjectView' })
    declare data: Material;

    assetType = AssetType.material;

    initAsset()
    {
        this.data = this.data || new Material();
    }
}

setAssetTypeClass('material', MaterialAsset);
