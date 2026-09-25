import { AssetType } from 'feng3d';
import { setAssetTypeClass } from '../FileAsset';
import { Texture } from '@feng3d/webgpu';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
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
    declare data: Texture;

    assetType = AssetType.texturecube;

    initAsset()
    {
        this.data = this.data || ({} as Texture);
    }
}

setAssetTypeClass('texturecube', TextureCubeAsset);
