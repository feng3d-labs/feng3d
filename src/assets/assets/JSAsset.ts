import { AssetType } from '../../core/assets/AssetType';
import { setAssetTypeClass } from '../../core/assets/FileAsset';
import { Serializable } from '../../serialization/Serializable';
import { TextAsset } from './TextAsset';

declare global
{
    export interface MixinsAssetTypeClassMap
    {
        'js': new () => JSAsset;
    }
}

/**
 * JS资源
 */
@Serializable()
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
