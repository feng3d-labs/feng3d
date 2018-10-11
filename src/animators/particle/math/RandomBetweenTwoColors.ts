namespace feng3d
{
    /**
     * 从最大最小常量颜色中随机
     */
    export class RandomBetweenTwoColors implements IMinMaxGradient
    {
        /**
         * 最小颜色值
         */
        colorMin = new Color4();

        /**
         * 最大颜色值
         */
        colorMax = new Color4();

        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number)
        {
            return this.colorMin.mixTo(this.colorMax, Math.random());
        }
    }
}