namespace feng3d
{
    /**
     * 常量曲线
     */
    export class MinMaxCurveConstant implements IMinMaxCurve
    {
        /**
         * 常量
         */
        @serialize
        value = 0;

        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number)
        {
            return this.value;
        }
    }
}