namespace feng3d
{

    /**
     * 动画曲线
     * 
     * 基于时间轴的连续三阶Bézier曲线
     */
    export class AnimationCurve
    {
        __class__: "feng3d.AnimationCurve";

        /**
         * 最大tan值，超出该值后将会变成分段
         */
        maxtan = 1000;

        /**
         * The behaviour of the animation before the first keyframe.
         * 
         * 在第一个关键帧之前的动画行为。
         */
        @serialize
        preWrapMode = WrapMode.Clamp;

        /**
         * The behaviour of the animation after the last keyframe.
         * 
         * 动画在最后一个关键帧之后的行为。
         */
        @serialize
        postWrapMode = WrapMode.Clamp;

        /**
         * All keys defined in the animation curve.
         * 
         * 动画曲线上所有关键字定义。
         * 
         * 注： 该值已对时间排序，否则赋值前请使用 sort((a, b) => a.time - b.time) 进行排序
         */
        @serialize
        keys: AnimationCurveKeyframe[] = [{ time: 0, value: 1, inTangent: 0, outTangent: 0 }];

        /**
         * 关键点数量
         */
        get numKeys()
        {
            return this.keys.length;
        }

        /**
         * 添加关键点
         * 
         * 添加关键点后将会执行按t进行排序
         * 
         * @param key 关键点
         */
        addKey(key: AnimationCurveKeyframe)
        {
            this.keys.push(key);
            this.sort();
        }

        /**
         * 关键点排序
         * 
         * 当移动关键点或者新增关键点时需要再次排序
         */
        sort()
        {
            this.keys.sort((a, b) => a.time - b.time);
        }

        /**
         * 删除关键点
         * @param key 关键点
         */
        deleteKey(key: AnimationCurveKeyframe)
        {
            var index = this.keys.indexOf(key);
            if (index != -1)
                this.keys.splice(index, 1);
        }

        /**
         * 获取关键点
         * @param index 索引
         */
        getKey(index: number)
        {
            return this.keys[index];
        }

        /**
         * 获取关键点索引
         * @param key 关键点
         */
        indexOfKeys(key: AnimationCurveKeyframe)
        {
            return this.keys.indexOf(key);
        }

        /**
         * 获取曲线上点信息
         * @param t 时间轴的位置 [0,1]
         */
        getPoint(t: number): AnimationCurveKeyframe
        {
            var wrapMode = WrapMode.Clamp;

            var min = 0;
            var max = 1;
            if (this.keys.length > 0)
            {
                min = this.keys[0].time;
            }
            if (this.keys.length > 1)
            {
                max = this.keys[this.keys.length - 1].time;
            }
            var cycle = max - min;
            var dcycle = 2 * cycle;

            if (t < min)
                wrapMode = this.preWrapMode;
            else if (t > max)
                wrapMode = this.postWrapMode;

            switch (wrapMode)
            {
                case WrapMode.Clamp:
                    t = Math.clamp(t, min, max);
                    break;
                case WrapMode.Loop:
                    t = ((t - min) % cycle + cycle) % cycle + min;
                    break;
                case WrapMode.PingPong:
                    t = ((t - min) % dcycle + dcycle) % dcycle + min;
                    if (t > max)
                    {
                        t = max - (t - max);
                    }
                    break;
            }

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
                    var tanstart = prekey.outTangent;
                    var xend = key.time;
                    var yend = key.value;
                    var tanend = key.inTangent;
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

            if (keys.length == 0) return { time: t, value: 0, inTangent: 0, outTangent: 0 };

            console.assert(isfind);
            return { time: t, value: value, inTangent: tangent, outTangent: tangent };
        }

        /**
         * 获取值
         * @param t 时间轴的位置 [0,1]
         */
        getValue(t: number)
        {
            var point = this.getPoint(t);
            if (!point) return 0;
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
         * @param precision 查找精度
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
            var results: AnimationCurveKeyframe[] = [];
            for (let i = 0; i <= num; i++)
            {
                var p = this.getPoint(i / num)
                results.push(p);
            }
            return results;
        }
    }
}