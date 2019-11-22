namespace feng3d
{
    /**
     * 动画关键帧
     */
    export interface AnimationCurveKeyframe
    {
        /**
         * The time of the keyframe.
         * 
         * 关键帧的时间。
         */
        time: number

        /**
         * 曲线在关键帧处的值。
         */
        value: number

        /**
         * Describes the tangent when approaching this point from the previous point in the curve.
         * 
         * 描述从曲线上的前一点接近该点时的切线。
         */
        inTangent: number;

        /**
         * Describes the tangent when leaving this point towards the next point in the curve.
         * 
         * 描述从这个点到曲线上下一个点的切线。
         */
        outTangent: number;
    }
}