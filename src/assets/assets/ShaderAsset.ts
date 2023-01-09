import { AssetType } from '../../core/assets/AssetType';
import { RegisterAsset } from '../../core/assets/FileAsset';
import { ScriptAsset } from './ScriptAsset';

declare module '../../core/assets/FileAsset'
{
    interface AssetTypeClassMap
    {
        ShaderAsset: ShaderAsset;
    }
}

/**
 * 着色器 资源
 */
@RegisterAsset('ShaderAsset')
export class ShaderAsset extends ScriptAsset
{
    static extenson = '.ts';

    assetType = AssetType.shader;
}

