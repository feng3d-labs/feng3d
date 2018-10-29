namespace feng3d
{
    /**
     * 动画曲线
     */
    export class AnimationCurve implements IMinMaxCurve
    {
        /**
         * 动画曲线关键帧
         */
        keys: CubicBeziersKey[] = [];

        postWrapMode = WrapMode.Clamp;

        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number)
        {
            // return this.value;
            return 0;
        }
    }
}