import { AssetType } from '../../core/assets/AssetType';
import { decoratorRegisterClass } from '../../serialization/ClassUtils';
import { ArrayBufferAsset } from '../ArrayBufferAsset';

/**
 * 音效资源
 */
@decoratorRegisterClass()
export class AudioAsset extends ArrayBufferAsset
{
    readonly assetType = AssetType.audio;
    // readonly extenson: ".ogg" | ".mp3" | ".wav" = ".mp3";
}
