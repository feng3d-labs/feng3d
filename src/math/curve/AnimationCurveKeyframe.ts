namespace feng3d
{
    /**
     * 动画关键帧
     */
    export class AnimationCurveKeyframe
    {
        /**
         * 时间轴的位置 [0,1]
         */
        @serialize
        time: number

        /**
         * 值 [0,1]
         */
        @serialize
        value: number

        /**
         * 斜率
         */
        @serialize
        tangent: number

        constructor(v: gPartial<AnimationCurveKeyframe>)
        {
            serialization.setValue(this, <any>v);
            return this;
        }
    }
}