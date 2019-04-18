namespace feng3d
{
    /**
     * 最大最小颜色渐变模式
     */
    export enum MinMaxGradientMode
    {
        /**
         * 颜色常量
         */
        Color,
        /**
         * 颜色渐变
         */
        Gradient,
        /**
         * 从最大最小常量颜色中随机
         */
        RandomBetweenTwoColors,
        /**
         * 从最大最小颜色渐变值中随机
         */
        RandomBetweenTwoGradients,
        /**
         * 从颜色渐变中进行随机
         */
        RandomColor
    }
}