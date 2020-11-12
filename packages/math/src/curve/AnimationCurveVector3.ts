namespace feng3d
{
    /**
     * Vector3 曲线
     */
    export class AnimationCurveVector3
    {
        /**
         * X 轴曲线
         */
        @serialize
        xCurve = new AnimationCurve();

        /**
         * Y 轴曲线
         */
        @serialize
        yCurve = new AnimationCurve();

        /**
         * Z 轴曲线
         */
        @serialize
        zCurve = new AnimationCurve();

        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number)
        {
            return new Vector3(this.xCurve.getValue(time), this.yCurve.getValue(time), this.zCurve.getValue(time));
        }
    }
}