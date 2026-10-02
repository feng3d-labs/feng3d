import type { Color4 } from '../color/color4Ops';
import { color4Mix } from '../color/color4Ops';
import { Gradient } from './Gradient';
import { MinMaxGradientMode } from './MinMaxGradientMode';

/**
 * 最大最小颜色渐变
 *
 * 阶段 C-b 起颜色只有纯数据形态（math 的 `Color4` class 已删除）：字段默认值在装配点显式写
 * `{ __type__: 'Color4', ... }`，`TwoColors` / `TwoGradients` 两个分支的插值走 `color4Mix` 纯函数。
 * 本 class 自身的 class 形态不在本批范围（方案 §8 第二批）。
 */
export class MinMaxGradient
{

    /**
     * Set the mode that the min-max gradient will use to evaluate colors.
     *
     * 设置最小-最大梯度将用于评估颜色的模式。
     */
    mode = MinMaxGradientMode.Color;

    /**
     * Set a constant color.
     *
     * 常量颜色值
     */
    color: Color4 = { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 };

    /**
     * Set a constant color for the lower bound.
     *
     * 为下界设置一个常量颜色。
     */
    colorMin: Color4 = { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 };

    /**
     * Set a constant color for the upper bound.
     *
     * 为上界设置一个常量颜色。
     */
    colorMax: Color4 = { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 };

    /**
     * Set the gradient.
     *
     * 设置渐变。
     */
    gradient = new Gradient();

    /**
     * Set a gradient for the lower bound.
     *
     * 为下界设置一个渐变。
     */
    gradientMin = new Gradient();

    /**
     * Set a gradient for the upper bound.
     *
     * 为上界设置一个渐变。
     */
    gradientMax = new Gradient();

    /**
     * 获取值
     * @param time 时间
     */
    getValue(time: number, randomBetween: number = Math.random()): Color4
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
                // 原 `this.colorMin.mixTo(this.colorMax, randomBetween)`：结果写新对象、不改两端
                return { __type__: 'Color4', ...color4Mix(this.colorMin, this.colorMax, randomBetween) };
            case MinMaxGradientMode.TwoGradients:
                min = this.gradientMin.getValue(time);
                max = this.gradientMax.getValue(time);
                v = { __type__: 'Color4', ...color4Mix(min, max, randomBetween) };

                return v;
            case MinMaxGradientMode.RandomColor:
                v = this.gradient.getValue(randomBetween);

                return v;
        }

        return this.color;
    }
}
