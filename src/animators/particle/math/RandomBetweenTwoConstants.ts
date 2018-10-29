namespace feng3d
{
    /**
     * 两个常量间取随机值
     */
    export class RandomBetweenTwoConstants implements IMinMaxCurve
    {
        /**
         * 最小值
         */
        minValue: number;

        /**
         * 最大值
         */
        maxValue: number;

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