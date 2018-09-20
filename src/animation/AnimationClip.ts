namespace feng3d
{
    export class AnimationClip extends Feng3dAssets
    {
        type = feng3d.AssetExtension.anim;

        @serialize
        name: string;
        /**
         * 动画时长，单位ms
         */
        @serialize
        length: number;
        @serialize
        loop = true;
        @serialize
        propertyClips: PropertyClip[];
    }
}