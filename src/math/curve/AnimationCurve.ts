namespace feng3d
{

    /**
     * 动画曲线
     * 
     * 基于时间轴的连续三阶Bézier曲线
     */
    export class AnimationCurve implements IMinMaxCurve
    {
        /**
         * 最大tan值，超出该值后将会变成分段
         */
        maxtan = 1000;

        /**
         * 关键帧
         * 
         * 注： 该值已对时间排序，否则赋值前请使用 sort((a, b) => a.time - b.time) 进行排序
         */
        @serialize
        keys: AnimationCurveKeyframe[] = [];

        /**
         * 获取曲线上点信息
         * @param t 时间轴的位置 [0,1]
         */
        getPoint(t: number)
        {
            var keys = this.keys;
            var maxtan = this.maxtan;
            var value = 0, tangent = 0, isfind = false;;
            for (let i = 0, n = keys.length; i < n; i++)
            {
                // 使用 bezierCurve 进行采样曲线点
                var key = keys[i];
                var prekey = keys[i - 1];
                if (i > 0 && prekey.time <= t && t <= key.time)
                {
                    var xstart = prekey.time;
                    var ystart = prekey.value;
                    var tanstart = prekey.tangent;
                    var xend = key.time;
                    var yend = key.value;
                    var tanend = key.tangent;
                    if (maxtan > Math.abs(tanstart) && maxtan > Math.abs(tanend))
                    {
                        var ct = (t - prekey.time) / (key.time - prekey.time);
                        var sys = [ystart, ystart + tanstart * (xend - xstart) / 3, yend - tanend * (xend - xstart) / 3, yend];
                        var fy = bezierCurve.getValue(ct, sys);
                        isfind = true;
                        value = fy;
                        tangent = bezierCurve.getDerivative(ct, sys) / (xend - xstart);
                        break;
                    } else
                    {
                        isfind = true;
                        value = prekey.value;
                        tangent = 0;
                        break;
                    }
                }
                if (i == 0 && t <= key.time)
                {
                    isfind = true;
                    value = key.value;
                    tangent = 0;
                    break;
                }
                if (i == n - 1 && t >= key.time)
                {
                    isfind = true;
                    value = key.value;
                    tangent = 0;
                    break;
                }
            }
            if (isfind) return new AnimationCurveKeyframe({ time: t, value: value, tangent: tangent });
            return null;
        }

        /**
         * 获取值
         * @param t 时间轴的位置 [0,1]
         */
        getValue(t: number)
        {
            var point = this.getPoint(t);
            return point.value;
        }

        /**
         * 查找关键点
         * @param t 时间轴的位置 [0,1]
         * @param y 值
         * @param precision 查找精度
         */
        findKey(t: number, y: number, precision: number)
        {
            var keys = this.keys;
            for (let i = 0; i < keys.length; i++)
            {
                if (Math.abs(keys[i].time - t) < precision && Math.abs(keys[i].value - y) < precision)
                {
                    return keys[i];
                }
            }
            return null;
        }

        /**
         * 添加曲线上的关键点
         * 
         * 如果该点在曲线上，则添加关键点
         * 
         * @param time 时间轴的位置 [0,1]
         * @param value 值
         * @param precision 查找进度
         */
        addKeyAtCurve(time: number, value: number, precision: number)
        {
            var point = this.getPoint(time);
            if (Math.abs(value - point.value) < precision)
            {
                this.keys.push(point);
                this.keys.sort((a, b) => a.time - b.time);
                return point;
            }
            return null;
        }

        /**
         * 获取曲线样本数据
         * 
         * 这些点可用于连线来拟合曲线。
         * 
         * @param num 采样次数 ，采样点分别为[0,1/num,2/num,....,(num-1)/num,1]
         */
        getSamples(num = 100)
        {
            var results: number[] = [];
            for (let i = 0; i <= num; i++)
            {
                var p = this.getValue(i / num)
                results.push(p);
            }
            return results;
        }
    }
}