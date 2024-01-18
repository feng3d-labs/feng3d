import { AssetType, SourceTextureCube, TextureCube } from '@feng3d/core';
import { oav } from '@feng3d/objectview';
import { RegisterAsset } from '../FileAsset';
import { ObjectAsset } from './ObjectAsset';

declare module '../FileAsset' { interface AssetMap { TextureCubeAsset: TextureCubeAsset; } }

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
        this.data = this.data || new SourceTextureCube();
    }
}

