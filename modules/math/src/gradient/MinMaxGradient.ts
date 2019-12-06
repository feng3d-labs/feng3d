namespace feng3d
{
    /**
     * 最大最小颜色渐变
     */
    export class MinMaxGradient
    {
        __class__: "feng3d.MinMaxGradient";

        /**
         * Set the mode that the min-max gradient will use to evaluate colors.
         * 
         * 设置最小-最大梯度将用于评估颜色的模式。
         */
        @serialize
        mode = MinMaxGradientMode.Color;

        /**
         * Set a constant color.
         * 
         * 常量颜色值
         */
        @serialize
        color = new Color4();

        /**
         * Set a constant color for the lower bound.
         * 
         * 为下界设置一个常量颜色。
         */
        @serialize
        colorMin = new Color4();

        /**
         * Set a constant color for the upper bound.
         * 
         * 为上界设置一个常量颜色。
         */
        @serialize
        colorMax = new Color4();

        /**
         * Set the gradient.
         * 
         * 设置渐变。
         */
        @serialize
        gradient = new Gradient();

        /**
         * Set a gradient for the lower bound.
         * 
         * 为下界设置一个渐变。
         */
        @serialize
        gradientMin = new Gradient();

        /**
         * Set a gradient for the upper bound.
         * 
         * 为上界设置一个渐变。
         */
        @serialize
        gradientMax = new Gradient();

        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number, randomBetween: number = Math.random())
        {
            switch (this.mode)
            {
                case MinMaxGradientMode.Color:
                    return this.color;
                case MinMaxGradientMode.Gradient:
                    return this.gradient.getValue(time);
                case MinMaxGradientMode.TwoColors:
                    return this.colorMin.mixTo(this.colorMax, randomBetween);
                case MinMaxGradientMode.TwoGradients:
                    var min = this.gradientMin.getValue(time);
                    var max = this.gradientMax.getValue(time);
                    var v = min.mixTo(max, randomBetween);
                    return v;
                case MinMaxGradientMode.RandomColor:
                    var v = this.gradient.getValue(randomBetween);
                    return v;
            }
            return this.color;
        }
    }
}