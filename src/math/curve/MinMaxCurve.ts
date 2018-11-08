namespace feng3d
{
    /**
     * 最大最小曲线
     */
    export class MinMaxCurve
    {
        /**
         * 模式
         */
        @serialize
        mode = MinMaxCurveMode.Constant;

        /**
         * 常量值
         */
        @serialize
        constant = 0;

        /**
         * 常量值，用于 MinMaxCurveMode.RandomBetweenTwoConstants
         */
        @serialize
        constant1 = 0;

        /**
         * 曲线，用于 MinMaxCurveMode.RandomBetweenTwoCurves
         */
        @serialize
        curve = new AnimationCurve();

        /**
         * 曲线1
         */
        @serialize
        curve1 = Object.setValue(new AnimationCurve(), { keys: [{ time: 0, value: 0, tangent: 0 }, { time: 1, value: 1, tangent: 0 }] });

        /**
         * 曲线缩放比
         */
        @serialize
        curveMultiplier = 1;

        /**
         * 是否只取 0-1 ，例如 lifetime 为非负，需要设置为true
         */
        @serialize
        between0And1 = false;

        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number)
        {
            switch (this.mode)
            {
                case MinMaxCurveMode.Constant:
                    return this.constant;
                case MinMaxCurveMode.Curve:
                    return this.curve.getValue(time) * this.curveMultiplier;
                case MinMaxCurveMode.RandomBetweenTwoConstants:
                    return FMath.lerp(this.constant, this.constant1, Math.random());
                case MinMaxCurveMode.RandomBetweenTwoCurves:
                    return FMath.lerp(this.curve.getValue(time), this.curve1.getValue(time), Math.random()) * this.curveMultiplier;
            }

            return this.constant;
        }
    }
}