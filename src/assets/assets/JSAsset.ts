import { AssetType } from '../../core/assets/AssetType';
import { setAssetTypeClass } from '../../core/assets/FileAsset';
import { decoratorRegisterClass } from '../../serialization/ClassUtils';
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
@decoratorRegisterClass()
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
