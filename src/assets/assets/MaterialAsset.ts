import { AssetType } from '../../core/assets/AssetType';
import { RegisterAsset } from '../../core/assets/FileAsset';
import { Material } from '../../core/materials/Material';
import { StandardMaterial } from '../../core/materials/standard/StandardMaterial';
import { oav } from '../../objectview/ObjectView';
import { ObjectAsset } from '../ObjectAsset';

declare module '../../core/assets/FileAsset'
{
    interface AssetMap
    {
        MaterialAsset: MaterialAsset;
    }
}

/**
 * 材质资源
 */
@RegisterAsset('MaterialAsset')
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

