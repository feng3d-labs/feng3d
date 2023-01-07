import { AssetType } from '../../core/assets/AssetType';
import { setAssetTypeClass } from '../../core/assets/FileAsset';
import { Serializable } from '../../serialization/Serializable';
import { TextAsset } from './TextAsset';

declare module '../../core/assets/FileAsset'
{
    interface AssetTypeClassMap
    {
        'js': new () => JSAsset;
    }
}

/**
 * JS资源
 */
@Serializable('JSAsset')
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

setAssetTypeClass('js', JSAsset);
