import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Vector3 } from '../geom/Vector3';
import { AnimationCurve } from './AnimationCurve';

/**
 * Vector3 曲线
 */
export class AnimationCurveVector3
{
    /**
     * X 轴曲线
     */
    @SerializeProperty()
    xCurve = new AnimationCurve();

    /**
     * Y 轴曲线
     */
    @SerializeProperty()
    yCurve = new AnimationCurve();

    /**
     * Z 轴曲线
     */
    @SerializeProperty()
    zCurve = new AnimationCurve();

    /**
     * 获取值
     * @param time 时间
     */
    getValue(time: number)
    {
        return new Vector3(this.xCurve.getValue(time), this.yCurve.getValue(time), this.zCurve.getValue(time));
    }
}
