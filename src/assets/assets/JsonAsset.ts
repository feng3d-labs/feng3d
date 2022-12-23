import { AssetType } from '../../core/assets/AssetType';
import { setAssetTypeClass } from '../../core/assets/FileAsset';
import { decoratorRegisterClass } from '../../serialization/ClassUtils';
import { TextAsset } from './TextAsset';

declare global
{
    export interface MixinsAssetTypeClassMap
    {
        'json': new () => JsonAsset;
    }
}

/**
 * JSON 资源
 */
@decoratorRegisterClass()
export class JsonAsset extends TextAsset
{
    static extenson = '.json';

    assetType = AssetType.json;

    declare textContent: string;

    initAsset()
    {
        this.textContent = this.textContent || '{}';
    }
}

setAssetTypeClass('json', JsonAsset);
