import { AssetType } from '../../core/assets/AssetType';
import { RegisterAsset } from '../../core/assets/FileAsset';
import { TextAsset } from './TextAsset';

declare module '../../core/assets/FileAsset'
{
    interface AssetMap
    {
        JsonAsset: JsonAsset;
    }
}

/**
 * JSON 资源
 */
@RegisterAsset('JsonAsset')
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

