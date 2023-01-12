import { oav } from '../objectview/ObjectView';
import { SerializeProperty } from '../serialization/SerializeProperty';
import { AssetType } from '../core/assets/AssetType';
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
