import { AssetType, setAssetTypeClass, TextureCube } from '@feng3d/core';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/serialization';
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
@decoratorRegisterClass()
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
