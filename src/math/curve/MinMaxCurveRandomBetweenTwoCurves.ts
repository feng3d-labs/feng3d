namespace feng3d
{
    /**
     * 两个曲线中取随机值
     */
    export class MinMaxCurveRandomBetweenTwoCurves implements IMinMaxCurve
    {
        @serialize
        curveMin = new AnimationCurve();

        @serialize
        curveMax = Object.setValue(new AnimationCurve(), { keys: [{ time: 0, value: 0, tangent: 0 }, { time: 1, value: 1, tangent: 0 }] });

        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number)
        {
            var min = this.curveMin.getValue(time);
            var max = this.curveMax.getValue(time);
            return min + Math.random() * (max - min);
        }
    }
}