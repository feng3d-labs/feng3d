import { AssetType } from '../assets/AssetType';
import { Feng3dObject } from '../core/Feng3dObject';
import { PropertyClip } from './PropertyClip';

export class AnimationClip extends Feng3dObject
{
    readonly assetType = AssetType.anim;

    declare name: string;
    /**
     * 动画时长，单位ms
     */
    length: number;

    loop = true;

    propertyClips: PropertyClip[];
}
