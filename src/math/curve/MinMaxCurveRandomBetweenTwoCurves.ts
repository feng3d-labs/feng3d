namespace feng3d
{
    export class MinMaxCurveRandomBetweenTwoCurves implements IMinMaxCurve
    {
        @serialize
        curveMin = new AnimationCurve();

        @serialize
        curveMax = new AnimationCurve();

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