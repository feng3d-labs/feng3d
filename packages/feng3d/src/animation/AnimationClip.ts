import { EventEmitter } from '@feng3d/event';
import { AssetType } from '../assets/AssetType';
import { PropertyClip } from './PropertyClip';

export class AnimationClip extends EventEmitter
{
    readonly assetType = AssetType.anim;

    /**
     * 名称
     */
    name: string;

    /**
     * 动画时长，单位ms
     */
    length: number;

    loop = true;

    propertyClips: PropertyClip[];
}
