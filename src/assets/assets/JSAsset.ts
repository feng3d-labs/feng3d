import { AssetType } from '../../core/assets/AssetType';
import { RegisterAsset } from '../../core/assets/FileAsset';
import { TextAsset } from './TextAsset';

declare module '../../core/assets/FileAsset'
{
    interface AssetMap
    {
        JSAsset: JSAsset;
    }
}

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
