import { AssetType } from '../assets/AssetType';
import { oav } from '@feng3d/objectview';
import { SerializeProperty } from '../serialization/SerializeProperty';
import { PropertyClip } from './PropertyClip';

export class AnimationClip
{
    readonly assetType = AssetType.anim;

    @oav()
    @SerializeProperty()
    declare name: string;
    /**
     * 动画时长，单位ms
     */
    @SerializeProperty()
    length: number;

    @oav()
    @SerializeProperty()
    loop = true;

    @SerializeProperty()
    propertyClips: PropertyClip[];
}
