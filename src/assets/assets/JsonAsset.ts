import { AssetType } from '../AssetType';
import { RegisterAsset } from '../FileAsset';
import { TextAsset } from './TextAsset';

declare module '../FileAsset' { interface AssetMap { JsonAsset: JsonAsset; } }

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

