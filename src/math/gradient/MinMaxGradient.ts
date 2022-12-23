import { Serializable } from '../../serialization/Serializable';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Color4 } from '../Color4';
import { Gradient } from './Gradient';
import { MinMaxGradientMode } from './MinMaxGradientMode';

/**
 * 最大最小颜色渐变
 */
@Serializable()
export class MinMaxGradient
{
    __class__: 'MinMaxGradient';

    /**
     * Set the mode that the min-max gradient will use to evaluate colors.
     *
     * 设置最小-最大梯度将用于评估颜色的模式。
     */
    @SerializeProperty
    mode = MinMaxGradientMode.Color;

    /**
     * Set a constant color.
     *
     * 常量颜色值
     */
    @SerializeProperty
    color = new Color4();

    /**
     * Set a constant color for the lower bound.
     *
     * 为下界设置一个常量颜色。
     */
    @SerializeProperty
    colorMin = new Color4();

    /**
     * Set a constant color for the upper bound.
     *
     * 为上界设置一个常量颜色。
     */
    @SerializeProperty
    colorMax = new Color4();

    /**
     * Set the gradient.
     *
     * 设置渐变。
     */
    @SerializeProperty
    gradient = new Gradient();

    /**
     * Set a gradient for the lower bound.
     *
     * 为下界设置一个渐变。
     */
    @SerializeProperty
    gradientMin = new Gradient();

    /**
     * Set a gradient for the upper bound.
     *
     * 为上界设置一个渐变。
     */
    @SerializeProperty
    gradientMax = new Gradient();

    /**
     * 获取值
     * @param time 时间
     */
    getValue(time: number, randomBetween: number = Math.random())
    {
        let min: Color4;
        let max: Color4;
        let v: Color4;

        switch (this.mode)
        {
            case MinMaxGradientMode.Color:
                return this.color;
            case MinMaxGradientMode.Gradient:
                return this.gradient.getValue(time);
            case MinMaxGradientMode.TwoColors:
                return this.colorMin.mixTo(this.colorMax, randomBetween);
            case MinMaxGradientMode.TwoGradients:
                min = this.gradientMin.getValue(time);
                max = this.gradientMax.getValue(time);
                v = min.mixTo(max, randomBetween);

                return v;
            case MinMaxGradientMode.RandomColor:
                v = this.gradient.getValue(randomBetween);

                return v;
        }

        return this.color;
    }
}
