import { mathUtil } from '@feng3d/polyfill';
import { Serializable } from '../../serialization/Serializable';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { AnimationCurve } from './AnimationCurve';
import { MinMaxCurveMode } from './MinMaxCurveMode';

declare module '../../serialization/Serializable' { interface SerializableMap { MinMaxCurve: MinMaxCurve } }

/**
 * 最大最小曲线
 */
@Serializable('MinMaxCurve')
export class MinMaxCurve
{
    declare __class__: 'MinMaxCurve';

    /**
     * 模式
     */
    @SerializeProperty()
    mode = MinMaxCurveMode.Constant;

    /**
     * Set the constant value.
     *
     * 设置常数值。
     */
    @SerializeProperty()
    constant = 0;

    /**
     * Set a constant for the lower bound.
     *
     * 为下界设置一个常数。
     */
    @SerializeProperty()
    constantMin = 0;

    /**
     * Set a constant for the upper bound.
     *
     * 为上界设置一个常数。
     */
    @SerializeProperty()
    constantMax = 0;

    /**
     * Set the curve.
     *
     * 设置曲线。
     */
    @SerializeProperty()
    curve = new AnimationCurve();

    /**
     * Set a curve for the lower bound.
     *
     * 为下界设置一条曲线。
     */
    @SerializeProperty()
    curveMin = new AnimationCurve();

    /**
     * Set a curve for the upper bound.
     *
     * 为上界设置一条曲线。
     */
    @SerializeProperty()
    curveMax = new AnimationCurve();

    /**
     * Set a multiplier to be applied to the curves.
     *
     * 设置一个乘数应用于曲线。
     */
    @SerializeProperty()
    curveMultiplier = 1;

    /**
     * 是否在编辑器中只显示Y轴 0-1 区域，例如 lifetime 为非负，需要设置为true
     */
    @SerializeProperty()
    between0And1 = false;

    /**
     * 获取值
     * @param time 时间
     */
    getValue(time: number, randomBetween: number = Math.random())
    {
        switch (this.mode)
        {
            case MinMaxCurveMode.Constant:
                return this.constant;
            case MinMaxCurveMode.Curve:
                return this.curve.getValue(time) * this.curveMultiplier;
            case MinMaxCurveMode.TwoConstants:
                return mathUtil.lerp(this.constantMin, this.constantMax, randomBetween);
            case MinMaxCurveMode.TwoCurves:
                return mathUtil.lerp(this.curveMin.getValue(time), this.curveMax.getValue(time), randomBetween) * this.curveMultiplier;
        }

        return this.constant;
    }
}
