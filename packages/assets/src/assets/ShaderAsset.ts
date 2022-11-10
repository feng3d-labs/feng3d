import { AssetType, setAssetTypeClass } from '@feng3d/core';
import { decoratorRegisterClass } from '@feng3d/serialization';
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
@decoratorRegisterClass()
export class ShaderAsset extends ScriptAsset
{
    static extenson = '.ts';

    assetType = AssetType.shader;
}

setAssetTypeClass('shader', ShaderAsset);
