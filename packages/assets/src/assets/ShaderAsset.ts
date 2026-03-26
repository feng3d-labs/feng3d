import { AssetType } from '@feng3d/core';
import { RegisterAsset } from '../FileAsset';
import { ScriptAsset } from './ScriptAsset';

declare module '../FileAsset' { interface AssetMap { ShaderAsset: ShaderAsset; } }

/**
 * 着色器 资源
 */
@RegisterAsset('ShaderAsset')
export class ShaderAsset extends ScriptAsset
{
    static extenson = '.ts';

    assetType = AssetType.shader;
}

