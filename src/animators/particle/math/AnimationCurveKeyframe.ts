namespace feng3d
{
    /**
     * 动画曲线关键帧
     */
    export class AnimationCurveKeyframe
    {
        inTangent: number;

        outTangent: number;

        /**
         * 
         */
        tangentMode: number;

        /**
         * 关键帧时间
         */
        time: number;

        /**
         * 关键帧值
         */
        value: number;
    }
}