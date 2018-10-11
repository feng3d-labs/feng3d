namespace feng3d
{
    /**
     * 从颜色渐变中进行随机
     */
    export class MinMaxGradientRandomColor implements IMinMaxGradient
    {
        /**
         * 颜色渐变
         */
        gradient = new Gradient();

        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number)
        {
            var v = this.gradient.getValue(Math.random());
            return v;
        }
    }
}