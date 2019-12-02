namespace feng3d
{
    /**
     * 颜色渐变
     */
    export class Gradient
    {
        __class__: "feng3d.Gradient";

        /**
         * 渐变模式
         */
        @serialize
        mode = GradientMode.Blend;

        /**
         * 在渐变中定义的所有alpha键。
         * 
         * 注： 该值已对时间排序，否则赋值前请使用 sort((a, b) => a.time - b.time) 进行排序
         */
        @serialize
        alphaKeys: GradientAlphaKey[] = [{ alpha: 1, time: 0 }, { alpha: 1, time: 1 }];

        /**
         * 在渐变中定义的所有color键。
         * 
         * 注： 该值已对时间排序，否则赋值前请使用 sort((a, b) => a.time - b.time) 进行排序
         */
        @serialize
        colorKeys: GradientColorKey[] = [{ color: new Color3(1, 1, 1), time: 0 }, { color: new Color3(1, 1, 1), time: 1 }];

        /**
         * 从颜色列表初始化
         * @param colors 颜色列表
         * @param times  
         */
        fromColors(colors: number[], times?: number[])
        {
            if (!times)
            {
                times = [];
                for (let i = 0; i < colors.length; i++)
                {
                    times[i] = i / (colors.length - 1);
                }
            }

            var colors1 = colors.map(v => new Color3().fromUnit(v));
            for (let i = 0; i < colors1.length; i++)
            {
                this.colorKeys[i] = { color: colors1[i], time: times[i] };
            }
            return this;
        }

        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number)
        {
            var alpha = this.getAlpha(time);
            var color = this.getColor(time);
            return new Color4(color.r, color.g, color.b, alpha);
        }

        /**
         * 获取透明度
         * @param time 时间
         */
        getAlpha(time: number)
        {
            var alphaKeys = this.alphaKeys;
            if (alphaKeys.length == 1) return alphaKeys[0].alpha;
            if (time <= alphaKeys[0].time) return alphaKeys[0].alpha;
            if (time >= alphaKeys[alphaKeys.length - 1].time) return alphaKeys[alphaKeys.length - 1].alpha;

            for (let i = 0, n = alphaKeys.length - 1; i < n; i++)
            {
                var t = alphaKeys[i].time, v = alphaKeys[i].alpha, nt = alphaKeys[i + 1].time, nv = alphaKeys[i + 1].alpha;
                if (time == t) return v;
                if (time == nt) return nv;
                if (t < time && time < nt)
                {
                    if (this.mode == GradientMode.Fixed) return nv;
                    return Math.mapLinear(time, t, nt, v, nv);
                }
            }
            return 1;
        }

        /**
         * 获取透明度
         * @param time 时间
         */
        getColor(time: number)
        {
            var colorKeys = this.colorKeys;
            if (colorKeys.length == 1) return colorKeys[0].color;
            if (time <= colorKeys[0].time) return colorKeys[0].color;
            if (time >= colorKeys[colorKeys.length - 1].time) return colorKeys[colorKeys.length - 1].color;

            for (let i = 0, n = colorKeys.length - 1; i < n; i++)
            {
                var t = colorKeys[i].time, v = colorKeys[i].color, nt = colorKeys[i + 1].time, nv = colorKeys[i + 1].color;
                if (time == t) return v;
                if (time == nt) return nv;
                if (t < time && time < nt)
                {
                    if (this.mode == GradientMode.Fixed) return nv;
                    return v.mixTo(nv, (time - t) / (nt - t));
                }
            }
            return new Color3();
        }
    }
}