namespace feng3d
{
    export class AnimationClip extends Feng3dObject
    {
        readonly assetType = AssetType.anim;

        @oav()
        @serialize
        name: string;
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
}