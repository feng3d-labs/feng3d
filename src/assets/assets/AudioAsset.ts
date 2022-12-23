import { AssetType } from '@feng3d/core';
import { decoratorRegisterClass } from '@feng3d/serialization';
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
