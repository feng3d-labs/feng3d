import { mathUtil } from '@feng3d/polyfill';
import type { Color3 } from '../color/color3Ops';
import { color3FromUnit, color3Mix } from '../color/color3Ops';
import type { Color4 } from '../color/color4Ops';
import { color4FromColor3 } from '../color/color4Ops';
import { GradientAlphaKey } from './GradientAlphaKey';
import { GradientColorKey } from './GradientColorKey';
import { GradientMode } from './GradientMode';

/**
 * 颜色渐变
 *
 * 阶段 C-b 起颜色只有纯数据形态（math 的 `Color3` / `Color4` class 已删除），
 * 所以本文件里的颜色一律**在装配点显式写判别字段**（`{ __type__: 'Color3', ... }`），
 * 运算走 `color3Ops` / `color4Ops` 的纯函数——`Gradient` 自身的 class 形态不在本批范围（方案 §8 第二批）。
 */
export class Gradient
{

    /**
     * 渐变模式
     */
    mode = GradientMode.Blend;

    /**
     * 在渐变中定义的所有alpha键。
     *
     * 注： 该值已对时间排序，否则赋值前请使用 sort((a, b) => a.time - b.time) 进行排序
     */
    alphaKeys: GradientAlphaKey[] = [{ alpha: 1, time: 0 }, { alpha: 1, time: 1 }];

    /**
     * 在渐变中定义的所有color键。
     *
     * 注： 该值已对时间排序，否则赋值前请使用 sort((a, b) => a.time - b.time) 进行排序
     */
    colorKeys: GradientColorKey[] = [
        { color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, time: 0 },
        { color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, time: 1 },
    ];

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

        // 0xRRGGBB → 纯数据 Color3；`__type__` 由装配点补上（纯函数缺省 out 不带判别字段，方案 §11.9.1）
        const colors1: Color3[] = colors.map((v) => ({ __type__: 'Color3', ...color3FromUnit(v) }));

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
    getValue(time: number): Color4
    {
        const alpha = this.getAlpha(time);
        const color = this.getColor(time);

        return { __type__: 'Color4', ...color4FromColor3(color, alpha) };
    }

    /**
     * 获取透明度
     * @param time 时间
     */
    getAlpha(time: number)
    {
        const alphaKeys = this.alphaKeys;

        if (alphaKeys.length === 1) return alphaKeys[0].alpha;
        if (time <= alphaKeys[0].time) return alphaKeys[0].alpha;
        if (time >= alphaKeys[alphaKeys.length - 1].time) return alphaKeys[alphaKeys.length - 1].alpha;

        for (let i = 0, n = alphaKeys.length - 1; i < n; i++)
        {
            const t = alphaKeys[i].time;
            const v = alphaKeys[i].alpha;
            const nt = alphaKeys[i + 1].time;
            const nv = alphaKeys[i + 1].alpha;

            if (time === t) return v;
            if (time === nt) return nv;
            if (t < time && time < nt)
            {
                if (this.mode === GradientMode.Fixed) return nv;

                return mathUtil.mapLinear(time, t, nt, v, nv);
            }
        }

        return 1;
    }

    /**
     * 获取透明度
     * @param time 时间
     */
    getColor(time: number): Color3
    {
        const colorKeys = this.colorKeys;

        if (colorKeys.length === 1) return colorKeys[0].color;
        if (time <= colorKeys[0].time) return colorKeys[0].color;
        if (time >= colorKeys[colorKeys.length - 1].time) return colorKeys[colorKeys.length - 1].color;

        for (let i = 0, n = colorKeys.length - 1; i < n; i++)
        {
            const t = colorKeys[i].time;
            const v = colorKeys[i].color;
            const nt = colorKeys[i + 1].time;
            const nv = colorKeys[i + 1].color;

            if (time === t) return v;
            if (time === nt) return nv;
            if (t < time && time < nt)
            {
                if (this.mode === GradientMode.Fixed) return nv;

                // 原 `v.mixTo(nv, rate)`：不改两端、结果写新对象（与原 class 的 `mixTo` 语义一致）
                return { __type__: 'Color3', ...color3Mix(v, nv, (time - t) / (nt - t)) };
            }
        }

        // 与原 `new Color3()` 的默认值一致（白色）
        return { __type__: 'Color3', r: 1, g: 1, b: 1 };
    }
}
