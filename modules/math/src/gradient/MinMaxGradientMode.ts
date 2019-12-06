namespace feng3d
{
    /**
     * 最大最小颜色渐变模式
     */
    export enum MinMaxGradientMode
    {
        /**
         * Use a single color for the MinMaxGradient.
         * 
         * 使用单一颜色的。
         */
        Color = 0,

        /**
         * Use a single color gradient for the MinMaxGradient.
         * 
         * 使用单一颜色渐变。
         */
        Gradient = 1,

        /**
         * Use a random value between 2 colors for the MinMaxGradient.
         * 
         * 在两种颜色之间使用一个随机值。
         */
        TwoColors = 2,

        /**
         * Use a random value between 2 color gradients for the MinMaxGradient.
         * 
         * 在两个颜色梯度之间使用一个随机值。
         */
        TwoGradients = 3,

        /**
         * Define a list of colors in the MinMaxGradient, to be chosen from at random.
         * 
         * 在一个颜色列表中随机选择。
         */
        RandomColor = 4
    }
}