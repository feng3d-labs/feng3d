import { AssetType } from '../../core/assets/AssetType';
import { setAssetTypeClass } from '../../core/assets/FileAsset';
import { Serializable } from '../../serialization/Serializable';
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
@Serializable()
export class ShaderAsset extends ScriptAsset
{
    static extenson = '.ts';

    assetType = AssetType.shader;
}

setAssetTypeClass('shader', ShaderAsset);
