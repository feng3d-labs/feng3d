import { AssetType } from '../../core/assets/AssetType';
import { setAssetTypeClass } from '../../core/assets/FileAsset';
import { TextureCube } from '../../core/textures/TextureCube';
import { oav } from '../../objectview/ObjectView';
import { Serializable } from '../../serialization/Serializable';
import { ObjectAsset } from '../ObjectAsset';

declare global
{
    export interface MixinsAssetTypeClassMap
    {
        'texturecube': new () => TextureCubeAsset;
    }
}

/**
 * 立方体纹理资源
 */
@Serializable()
export class TextureCubeAsset extends ObjectAsset
{
    static extenson = '.json';

    /**
     * 材质
     */
    @oav({ component: 'OAVObjectView' })
    declare data: TextureCube;

    assetType = AssetType.texturecube;

    initAsset()
    {
        this.data = this.data || new TextureCube();
    }
}

setAssetTypeClass('texturecube', TextureCubeAsset);
