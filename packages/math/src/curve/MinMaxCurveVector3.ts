import type { WritableVector3Like } from '../geom/vector3';
import { vec3From } from '../geom/vector3';
import { MinMaxCurve } from './MinMaxCurve';

export class MinMaxCurveVector3
{
    /**
     * x 曲线
     */
    xCurve = new MinMaxCurve();

    /**
     * y 曲线
     */
    yCurve = new MinMaxCurve();

    /**
     * z 曲线
     */
    zCurve = new MinMaxCurve();

    /**
     * 获取值
     *
     * 阶段 C-f：`Vector3` 的 class 已删除，返回值是纯数据形状（纯函数层**不产判别字段**）。
     * @param time 时间
     */
    getValue(time: number, randomBetween: number = Math.random()): WritableVector3Like
    {
        return vec3From(this.xCurve.getValue(time, randomBetween), this.yCurve.getValue(time, randomBetween), this.zCurve.getValue(time, randomBetween));
    }
}
