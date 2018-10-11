namespace feng3d
{
    export class RandomBetweenTwoGradients implements IMinMaxGradient
    {

        /**
         * 最小颜色渐变
         */
        gradientMin = new Gradient();

        /**
         * 最大颜色渐变
         */
        gradientMax = new Gradient();

        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number)
        {
            var min = this.gradientMin.getValue(time);
            var max = this.gradientMax.getValue(time);
            var v = min.mixTo(max, Math.random());
            return v;
        }

    }
}