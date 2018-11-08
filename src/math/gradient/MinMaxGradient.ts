namespace feng3d
{
    /**
     * 最大最小颜色渐变
     */
    export class MinMaxGradient
    {
        /**
         * 模式
         */
        @serialize
        mode = MinMaxGradientMode.Color;

        /**
         * 常量颜色值
         */
        @serialize
        color = new Color4();

        /**
         * 常量颜色值，作用于 MinMaxGradientMode.RandomBetweenTwoColors
         */
        @serialize
        color1 = new Color4();

        @serialize
        gradient = new Gradient();

        @serialize
        gradient1 = new Gradient();

        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number)
        {
            switch (this.mode)
            {
                case MinMaxGradientMode.Color:
                    return this.color;
                case MinMaxGradientMode.Gradient:
                    return this.gradient.getValue(time);
                case MinMaxGradientMode.RandomBetweenTwoColors:
                    return this.color.mixTo(this.color1, Math.random());
                case MinMaxGradientMode.RandomBetweenTwoGradients:
                    var min = this.gradient.getValue(time);
                    var max = this.gradient1.getValue(time);
                    var v = min.mixTo(max, Math.random());
                    return v;
                case MinMaxGradientMode.RandomColor:
                    var v = this.gradient.getValue(Math.random());
                    return v;
            }
            return this.color;
        }
    }
}