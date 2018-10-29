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
        get alphaKeys() { return this._alphaKeys; }
        set alphaKeys(v) { this._alphaKeys = v; this._alphaKeys.sort((a, b) => a.time - b.time); }
        private _alphaKeys: GradientAlphaKey[] = [{ alpha: 1, time: 0 }, { alpha: 1, time: 1 }];

        /**
         * 在渐变中定义的所有color键。
         */
        @serialize
        get colorKeys() { return this._colorKeys; }
        set colorKeys(v) { this._colorKeys = v; this._colorKeys.sort((a, b) => a.time - b.time); }

        private _colorKeys: GradientColorKey[] = [{ color: new Color3(1, 1, 1), time: 0 }, { color: new Color3(1, 1, 1), time: 1 }];

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
            var alphaKeys = this._alphaKeys;
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
            var colorKeys = this._colorKeys;
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