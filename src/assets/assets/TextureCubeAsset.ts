import { oav } from '@feng3d/objectview';
import { SourceTextureCube } from '../../textures/SourceTextureCube';
import { TextureCube } from '../../textures/TextureCube';
import { AssetType } from '../AssetType';
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

