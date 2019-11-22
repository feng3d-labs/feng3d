namespace feng3d
{
    /**
     * 最大最小曲线
     */
    export class MinMaxCurve
    {
        __class__: "feng3d.MinMaxCurve" = "feng3d.MinMaxCurve";

        /**
         * 模式
         */
        @serialize
        mode = MinMaxCurveMode.Constant;

        /**
         * Set the constant value.
         * 
         * 设置常数值。
         */
        @serialize
        constant = 0;

        /**
         * Set a constant for the lower bound.
         * 
         * 为下界设置一个常数。
         */
        get constantMin() { return this.constant; }
        set constantMin(v) { this.constant = v; }

        /**
         * Set a constant for the upper bound.
         * 
         * 为上界设置一个常数。
         */
        @serialize
        constantMax = 0;

        /**
         * Set the curve.
         * 
         * 设置曲线。
         */
        curve = new AnimationCurve();

        /**
         * Set a curve for the lower bound.
         * 
         * 为下界设置一条曲线。
         */
        @serialize
        get curveMin() { return this.curve; }
        set curveMin(v) { this.curve = v; }

        /**
         * Set a curve for the upper bound.
         * 
         * 为上界设置一条曲线。
         */
        @serialize
        curveMax = serialization.setValue(new AnimationCurve(), { keys: [{ time: 0, value: 0, inTangent: 0, outTangent: 0 }, { time: 1, value: 1, inTangent: 0, outTangent: 0 }] });

        /**
         * Set a multiplier to be applied to the curves.
         * 
         * 设置一个乘数应用于曲线。
         */
        @serialize
        curveMultiplier = 1;

        /**
         * 是否在编辑器中只显示Y轴 0-1 区域，例如 lifetime 为非负，需要设置为true
         */
        @serialize
        between0And1 = false;

        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number, randomBetween: number = Math.random())
        {
            switch (this.mode)
            {
                case MinMaxCurveMode.Constant:
                    return this.constant;
                case MinMaxCurveMode.Curve:
                    return this.curveMin.getValue(time) * this.curveMultiplier;
                case MinMaxCurveMode.RandomBetweenTwoConstants:
                    return Math.lerp(this.constantMin, this.constantMax, randomBetween);
                case MinMaxCurveMode.RandomBetweenTwoCurves:
                    return Math.lerp(this.curveMin.getValue(time), this.curveMax.getValue(time), randomBetween) * this.curveMultiplier;
            }

            return this.constant;
        }
    }
}