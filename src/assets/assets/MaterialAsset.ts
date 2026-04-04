import { AssetType } from '../../core/assets/AssetType';
import { Material } from '../../core/core/Material';
import { StandardMaterial } from '../../core/3d/materials/standard/StandardMaterial';
import { oav } from '../../objectview/ObjectView';
import { RegisterAsset } from '../FileAsset';
import { ObjectAsset } from './ObjectAsset';

declare module '../FileAsset' { interface AssetMap { MaterialAsset: MaterialAsset; } }

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

