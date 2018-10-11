namespace feng3d
{
    export interface IMinMaxGradient
    {
        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number): Color4;
    }

    /**
     * 最大最小颜色渐变
     */
    export class MinMaxGradient
    {
        /**
         * 模式
         */
        @watch("_onModeChanged")
        mode = MinMaxGradientMode.Color;

        /**
         * 颜色渐变
         */
        minMaxGradient: IMinMaxGradient = new MinMaxGradientColor();

        private _onModeChanged()
        {
            switch (this.mode)
            {
                case MinMaxGradientMode.Color:
                    this.minMaxGradient = new MinMaxGradientColor();
                    break;
                case MinMaxGradientMode.Gradient:
                    this.minMaxGradient = new Gradient();
                    break;
                case MinMaxGradientMode.RandomBetweenTwoColors:
                    this.minMaxGradient = new RandomBetweenTwoColors();
                    break;
                case MinMaxGradientMode.RandomBetweenTwoGradients:
                    this.minMaxGradient = new RandomBetweenTwoGradients();
                    break;
                case MinMaxGradientMode.RandomColor:
                    this.minMaxGradient = new MinMaxGradientRandomColor();
                    break;
            }
        }

        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number)
        {
            var v = this.minMaxGradient.getValue(time);
            return v;
        }
    }
}