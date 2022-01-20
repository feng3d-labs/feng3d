import { AssetType } from "@feng3d/core";
import { ArrayBufferAsset } from "../ArrayBufferAsset";

/**
 * 音效资源
 */
export class AudioAsset extends ArrayBufferAsset
{
    readonly assetType = AssetType.audio;
    // readonly extenson: ".ogg" | ".mp3" | ".wav" = ".mp3";
}
