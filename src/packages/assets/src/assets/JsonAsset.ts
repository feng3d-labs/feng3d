import { AssetType, setAssetTypeClass } from '@feng3d/core';
import { decoratorRegisterClass } from '@feng3d/serialization';
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
