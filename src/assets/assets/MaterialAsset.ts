import { AssetType } from '../../core/assets/AssetType';
import { setAssetTypeClass } from '../../core/assets/FileAsset';
import { Material } from '../../core/materials/Material';
import { StandardMaterial } from '../../core/materials/standard/StandardMaterial';
import { oav } from '../../objectview/ObjectView';
import { decoratorRegisterClass } from '../../serialization/ClassUtils';
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
        this.data = this.data || new StandardMaterial();
    }
}

setAssetTypeClass('material', MaterialAsset);
