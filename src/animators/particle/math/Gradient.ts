namespace feng3d
{
    /**
     * 颜色渐变
     */
    export class Gradient implements IMinMaxGradient
    {
        /**
         * 渐变模式
         */
        @serialize
        mode = GradientMode.Blend;

        /**
         * 在渐变中定义的所有alpha键。
         */
        @serialize
        alphaKeys: GradientAlphaKey[] = [];

        /**
         * 在渐变中定义的所有color键。
         */
        @serialize
        colorKeys: GradientColorKey[] = [];

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
            var alphaKeys = this.getRealAlphaKeys();
            for (let i = 0, n = alphaKeys.length - 1; i < n; i++)
            {
                var t = alphaKeys[i].time, v = alphaKeys[i].alpha, nt = alphaKeys[i + 1].time, nv = alphaKeys[i + 1].alpha;
                if (time == t) return v;
                if (time == nt) return nv;
                if (t < time && time < nt)
                {
                    if (this.mode == GradientMode.Fixed) return nv;
                    return FMath.mapLinear(time, t, nt, v, nv);
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
            var colorKeys = this.getRealColorKeys();
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

        /**
         * 获取标准 alpha 键列表
         */
        getRealAlphaKeys()
        {
            var alphaKeys = this.alphaKeys.concat().sort((a, b) => a.time - b.time);
            if (alphaKeys.length == 0)
            {
                alphaKeys = [{ alpha: 1, time: 0 }, { alpha: 1, time: 1 }];
            } else if (alphaKeys.length == 1)
            {
                alphaKeys = [{ alpha: alphaKeys[0].alpha, time: 0 }, { alpha: alphaKeys[0].alpha, time: 1 }];
            }
            if (alphaKeys[0].time > 0)
            {
                alphaKeys.splice(0, 1, { time: 0, alpha: alphaKeys[0].alpha });
            }
            if (alphaKeys[alphaKeys.length - 1].time < 1)
            {
                alphaKeys.push({ time: 1, alpha: alphaKeys[alphaKeys.length - 1].alpha });
            }
            return alphaKeys;
        }

        /**
         * 获取标准 color 键列表
         */
        getRealColorKeys()
        {
            var colorKeys = this.colorKeys.concat().sort((a, b) => a.time - b.time);
            if (colorKeys.length == 0)
            {
                colorKeys = [{ color: new Color3(), time: 0 }, { color: new Color3(), time: 1 }];
            } else if (colorKeys.length == 1)
            {
                colorKeys = [{ color: colorKeys[0].color, time: 0 }, { color: colorKeys[0].color, time: 1 }];
            }
            if (colorKeys[0].time > 0)
            {
                colorKeys.splice(0, 1, { time: 0, color: colorKeys[0].color });
            }
            if (colorKeys[colorKeys.length - 1].time < 1)
            {
                colorKeys.push({ time: 1, color: colorKeys[colorKeys.length - 1].color });
            }
            return colorKeys;
        }
    }
}