namespace feng3d
{
    /**
     * 动画关键帧
     */
    export interface AnimationCurveKeyframe
    {
        /**
         * 时间轴的位置 [0,1]
         */
        time: number

        /**
         * 值 [0,1]
         */
        value: number

        /**
         * 斜率
         */
        tangent: number
    }
}