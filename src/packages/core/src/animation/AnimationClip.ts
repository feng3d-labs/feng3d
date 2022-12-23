import { oav } from '@feng3d/objectview';
import { serialize } from '@feng3d/serialization';
import { AssetType } from '../assets/AssetType';
import { PropertyClip } from './PropertyClip';

export class AnimationClip
{
    readonly assetType = AssetType.anim;

    @oav()
    @serialize
    declare name: string;
    /**
     * 动画时长，单位ms
     */
    @serialize
    length: number;

    @oav()
    @serialize
    loop = true;

    @serialize
    propertyClips: PropertyClip[];
}
