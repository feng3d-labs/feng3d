import { AssetType } from '@feng3d/core';
import { RegisterAsset } from '../FileAsset';
import { TextAsset } from './TextAsset';

declare module '../FileAsset' { interface AssetMap { JSAsset: JSAsset; } }

/**
 * JS资源
 */
@RegisterAsset('JSAsset')
export class JSAsset extends TextAsset
{
    static extenson = '.js';

    assetType = AssetType.js;

    declare textContent: string;

    initAsset()
    {
        this.textContent = this.textContent || '';
    }
}
