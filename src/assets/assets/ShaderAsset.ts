import { AssetType } from '../../core/assets/AssetType';
import { setAssetTypeClass } from '../../core/assets/FileAsset';
import { serializable } from '../../serialization/ClassUtils';
import { ScriptAsset } from './ScriptAsset';

declare global
{
    export interface MixinsAssetTypeClassMap
    {
        'shader': new () => ShaderAsset;
    }
}

/**
 * 着色器 资源
 */
@serializable()
export class ShaderAsset extends ScriptAsset
{
    static extenson = '.ts';

    assetType = AssetType.shader;
}

setAssetTypeClass('shader', ShaderAsset);
