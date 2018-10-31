namespace feng3d
{
    /**
     * 两个常量间取随机值
     */
    export class MinMaxCurveRandomBetweenTwoConstants implements IMinMaxCurve
    {
        /**
         * 最小值
         */
        @serialize
        minValue: number = 5;

        /**
         * 最大值
         */
        @serialize
        maxValue: number = 5;

        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number)
        {
            return this.minValue + Math.random() * (this.maxValue - this.minValue);
        }
    }
}