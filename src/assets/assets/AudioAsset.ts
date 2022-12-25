import { AssetType } from '../../core/assets/AssetType';
import { Serializable } from '../../serialization/Serializable';
import { ArrayBufferAsset } from '../ArrayBufferAsset';

/**
 * 音效资源
 */
@Serializable('AudioAsset')
export class AudioAsset extends ArrayBufferAsset
{
    readonly assetType = AssetType.audio;
    // readonly extenson: ".ogg" | ".mp3" | ".wav" = ".mp3";
}
