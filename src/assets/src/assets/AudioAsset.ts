import { AssetType } from '@feng3d/core';
import { RegisterAsset } from '../FileAsset';
import { ArrayBufferAsset } from './ArrayBufferAsset';

declare module '../FileAsset' { interface AssetMap { AudioAsset: AudioAsset; } }

/**
 * 音效资源
 */
@RegisterAsset('AudioAsset')
export class AudioAsset extends ArrayBufferAsset
{
    readonly assetType = AssetType.audio;
    // readonly extenson: ".ogg" | ".mp3" | ".wav" = ".mp3";
}
