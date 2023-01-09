import { AssetType } from '../../core/assets/AssetType';
import { RegisterAsset } from '../../core/assets/FileAsset';
import { TextureCube } from '../../core/textures/TextureCube';
import { oav } from '../../objectview/ObjectView';
import { ObjectAsset } from '../ObjectAsset';

declare module '../../core/assets/FileAsset'
{
    interface AssetMap
    {
        TextureCubeAsset: TextureCubeAsset;
    }
}

/**
 * 立方体纹理资源
 */
@RegisterAsset('TextureCubeAsset')
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

