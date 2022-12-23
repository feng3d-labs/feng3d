import { oav } from '../../objectview/ObjectView';
import { serialize } from '../../serialization/Serialization';
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
