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
        mode = MinMaxGradientMode.Color;

        /**
         * 常量颜色值
         */
        color = new Color4();

        /**
         * 最小颜色值
         */
        colorMin = new Color4();

        /**
         * 最大颜色值
         */
        colorMax = new Color4();

        /**
         * 颜色渐变
         */
        gradient = new Gradient();

        /**
         * 最大颜色渐变
         */
        gradientMax = new Gradient();

        /**
         * 最小颜色渐变
         */
        gradientMin = new Gradient();
    }
}