import type { WritableVector3Like } from '../geom/vector3';
import { vec3From } from '../geom/vector3';
import { AnimationCurve } from './AnimationCurve';

/**
 * Vector3 曲线
 */
export class AnimationCurveVector3
{
    /**
     * X 轴曲线
     */
    xCurve = new AnimationCurve();

    /**
     * Y 轴曲线
     */
    yCurve = new AnimationCurve();

    /**
     * Z 轴曲线
     */
    zCurve = new AnimationCurve();

    /**
     * 获取值
     *
     * 阶段 C-f：`Vector3` 的 class 已删除，返回值是纯数据形状 `Vector3Like`
     * （纯函数层按约定**不产判别字段**，需要 `__type__` 的装配点由调用方显式写）。
     * @param time 时间
     */
    getValue(time: number): WritableVector3Like
    {
        return vec3From(this.xCurve.getValue(time), this.yCurve.getValue(time), this.zCurve.getValue(time));
    }
}
