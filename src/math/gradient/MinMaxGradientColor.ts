namespace feng3d
{
    export class MinMaxGradientColor implements IMinMaxGradient
    {
        /**
         * 常量颜色值
         */
        @serialize
        color = new Color4();

        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number)
        {
            return this.color;
        }
    }
}