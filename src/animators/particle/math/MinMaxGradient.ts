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
        @serialize
        @watch("_onModeChanged")
        mode = MinMaxGradientMode.Color;

        /**
         * 颜色渐变
         */
        @serialize
        minMaxGradient: IMinMaxGradient = new MinMaxGradientColor();

        private _minMaxGradientColor: MinMaxGradientColor;
        private _gradient: Gradient;
        private _randomBetweenTwoColors: RandomBetweenTwoColors;
        private _randomBetweenTwoGradients: RandomBetweenTwoGradients;
        private _minMaxGradientRandomColor: MinMaxGradientRandomColor;

        private _onModeChanged()
        {
            switch (this.mode)
            {
                case MinMaxGradientMode.Color:
                    this.minMaxGradient = this._minMaxGradientColor = this._minMaxGradientColor || new MinMaxGradientColor();
                    break;
                case MinMaxGradientMode.Gradient:
                    this.minMaxGradient = this._gradient = this._gradient || new Gradient();
                    break;
                case MinMaxGradientMode.RandomBetweenTwoColors:
                    this.minMaxGradient = this._randomBetweenTwoColors = this._randomBetweenTwoColors || new RandomBetweenTwoColors();
                    break;
                case MinMaxGradientMode.RandomBetweenTwoGradients:
                    this.minMaxGradient = this._randomBetweenTwoGradients = this._randomBetweenTwoGradients || new RandomBetweenTwoGradients();
                    break;
                case MinMaxGradientMode.RandomColor:
                    this.minMaxGradient = this._minMaxGradientRandomColor = this._minMaxGradientRandomColor || new MinMaxGradientRandomColor();
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