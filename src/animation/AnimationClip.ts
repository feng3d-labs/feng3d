namespace feng3d
{
    export class AnimationClip
    {
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