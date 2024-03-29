import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Vector3 } from '../geom/Vector3';
import { MinMaxCurve } from './MinMaxCurve';

export class MinMaxCurveVector3
{
    /**
     * x 曲线
     */
    @SerializeProperty()
    xCurve = new MinMaxCurve();

    /**
     * y 曲线
     */
    @SerializeProperty()
    yCurve = new MinMaxCurve();

    /**
     * z 曲线
     */
    @SerializeProperty()
    zCurve = new MinMaxCurve();

    /**
     * 获取值
     * @param time 时间
     */
    getValue(time: number, randomBetween: number = Math.random())
    {
        return new Vector3(this.xCurve.getValue(time, randomBetween), this.yCurve.getValue(time, randomBetween), this.zCurve.getValue(time, randomBetween));
    }
}
