import { AssetType } from '../../core/assets/AssetType';
import { RegisterAsset } from '../../core/assets/FileAsset';
import { ArrayBufferAsset } from '../ArrayBufferAsset';

declare module '../../core/assets/FileAsset' { interface AssetMap { AudioAsset: AudioAsset; } }

/**
 * 音效资源
 */
@RegisterAsset('AudioAsset')
export class AudioAsset extends ArrayBufferAsset
{
    readonly assetType = AssetType.audio;
    // readonly extenson: ".ogg" | ".mp3" | ".wav" = ".mp3";
}
