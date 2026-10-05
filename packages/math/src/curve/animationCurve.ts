import { mathUtilClamp } from '../mathutil';
import type { AnimationCurveKeyframe, WritableAnimationCurveKeyframe } from './animationCurveKeyframe';
import { animationCurveKeyframeDefault } from './animationCurveKeyframe';
import { bezierCurveGetDerivative, bezierCurveGetValue } from './bezierCurve';
import { WrapMode } from './WrapMode';

/**
 * 动画曲线的数据定义与**纯函数**形式（issue #134 曲线族批：原 class AnimationCurve 已删除）。
 *
 * 原 class 成员与纯函数的对应：
 *
 * | 原 class 成员 | 纯函数 |
 * |---|---|
 * | `new AnimationCurve()` | `animationCurveDefault(out?)` |
 * | `numKeys`（getter） | `animationCurveNumKeys(curve)` |
 * | `addKey` / `sort` / `deleteKey` / `addKeyAtCurve` | 同名 `animationCurve*`（接收写侧形状） |
 * | `getKey` / `indexOfKeys` / `getPoint` / `getValue` / `findKey` / `getSamples` | 同名 `animationCurve*`（只读） |
 *
 * 方法体逐行来自原实现（只把 `this.` 换成 `curve.`、把 `bezierCurve.getValue` 换成
 * `bezierCurveGetValue`），因此数值语义与旧实现逐位一致。
 */

/** 纯函数可接受的最小「动画曲线」形状。 */
export interface AnimationCurveLike
{
    /** 最大 tan 值，超出该值后将会变成分段 */
    readonly maxtan: number;

    /** 在第一个关键帧之前的动画行为 */
    readonly preWrapMode: WrapMode;

    /** 在最后一个关键帧之后的动画行为 */
    readonly postWrapMode: WrapMode;

    /** 全部关键帧（调用方保证按 time 有序） */
    readonly keys: readonly AnimationCurveKeyframe[];
}

/** 可写出的动画曲线（写侧形状：增删关键帧、排序）。 */
export interface WritableAnimationCurveLike
{
    maxtan: number;
    preWrapMode: WrapMode;
    postWrapMode: WrapMode;
    keys: WritableAnimationCurveKeyframe[];
}

/**
 * 纯数据「动画曲线」（带判别字段）：装配点显式写
 * `{ __type__: 'AnimationCurve', ...animationCurveDefault() }`。
 */
export interface AnimationCurve extends AnimationCurveLike
{
    readonly __type__: 'AnimationCurve';
}

/** 缺省动画曲线（与原 `new AnimationCurve()` 的字段默认值逐字一致） */
function defaultOut(): WritableAnimationCurveLike
{
    return { maxtan: 1000, preWrapMode: WrapMode.Clamp, postWrapMode: WrapMode.Clamp, keys: [animationCurveKeyframeDefault()] };
}

/**
 * `new AnimationCurve()` 的纯函数版：字段默认值写进 `out`（缺省新建）。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function animationCurveDefault(out: WritableAnimationCurveLike = defaultOut()): WritableAnimationCurveLike
{
    out.maxtan = 1000;
    out.preWrapMode = WrapMode.Clamp;
    out.postWrapMode = WrapMode.Clamp;
    out.keys = [animationCurveKeyframeDefault()];

    return out;
}

/**
 * `AnimationCurve.numKeys` 的纯函数版。
 *
 * @param curve 动画曲线
 */
export function animationCurveNumKeys(curve: AnimationCurveLike): number
{
    return curve.keys.length;
}

/**
 * 关键点数量
 */

/**
 * 添加关键点
 *
 * 添加关键点后将会执行按t进行排序
 *
 * @param key 关键点
 */
export function animationCurveAddKey(curve: WritableAnimationCurveLike, key: AnimationCurveKeyframe)
{
    curve.keys.push(key);
    animationCurveSort(curve);
}

/**
 * 关键点排序
 *
 * 当移动关键点或者新增关键点时需要再次排序
 */
export function animationCurveSort(curve: WritableAnimationCurveLike)
{
    curve.keys.sort((a, b) => a.time - b.time);
}

/**
 * 删除关键点
 * @param key 关键点
 */
export function animationCurveDeleteKey(curve: WritableAnimationCurveLike, key: AnimationCurveKeyframe)
{
    const index = curve.keys.indexOf(key);

    if (index !== -1)
    { curve.keys.splice(index, 1); }
}

/**
 * 获取关键点
 * @param index 索引
 */
export function animationCurveGetKey(curve: AnimationCurveLike, index: number)
{
    return curve.keys[index];
}

/**
 * 获取关键点索引
 * @param key 关键点
 */
export function animationCurveIndexOfKeys(curve: AnimationCurveLike, key: AnimationCurveKeyframe)
{
    return curve.keys.indexOf(key);
}

/**
 * 获取曲线上点信息
 * @param t 时间轴的位置 [0,1]
 */
export function animationCurveGetPoint(curve: AnimationCurveLike, t: number): AnimationCurveKeyframe
{
    let wrapMode = WrapMode.Clamp;

    let min = 0;
    let max = 1;

    if (curve.keys.length > 0)
    {
        min = curve.keys[0].time;
    }
    if (curve.keys.length > 1)
    {
        max = curve.keys[curve.keys.length - 1].time;
    }
    const cycle = max - min;
    const dcycle = 2 * cycle;

    if (t < min)
    { wrapMode = curve.preWrapMode; }
    else if (t > max)
    { wrapMode = curve.postWrapMode; }

    switch (wrapMode)
    {
        case WrapMode.Clamp:
            t = mathUtilClamp(t, min, max);
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

    const keys = curve.keys;
    const maxtan = curve.maxtan;
    let value = 0; let tangent = 0; let
        isfind = false;

    for (let i = 0, n = keys.length; i < n; i++)
    {
        // 使用 bezierCurve 进行采样曲线点
        const key = keys[i];
        const prekey = keys[i - 1];

        if (i > 0 && prekey.time <= t && t <= key.time)
        {
            const xstart = prekey.time;
            const ystart = prekey.value;
            const tanstart = prekey.outTangent;
            const xend = key.time;
            const yend = key.value;
            const tanend = key.inTangent;

            if (maxtan > Math.abs(tanstart) && maxtan > Math.abs(tanend))
            {
                const ct = (t - prekey.time) / (key.time - prekey.time);
                const sys = [ystart, ystart + tanstart * (xend - xstart) / 3, yend - tanend * (xend - xstart) / 3, yend];
                const fy = bezierCurveGetValue(ct, sys);

                isfind = true;
                value = fy;
                tangent = bezierCurveGetDerivative(ct, sys) / (xend - xstart);
                break;
            }
            else
            {
                isfind = true;
                value = prekey.value;
                tangent = 0;
                break;
            }
        }
        if (i === 0 && t <= key.time)
        {
            isfind = true;
            value = key.value;
            tangent = 0;
            break;
        }
        if (i === n - 1 && t >= key.time)
        {
            isfind = true;
            value = key.value;
            tangent = 0;
            break;
        }
    }

    if (keys.length === 0) return { time: t, value: 0, inTangent: 0, outTangent: 0 };

    console.assert(isfind);

    return { time: t, value, inTangent: tangent, outTangent: tangent };
}

/**
 * 获取值
 * @param t 时间轴的位置 [0,1]
 */
export function animationCurveGetValue(curve: AnimationCurveLike, t: number)
{
    const point = animationCurveGetPoint(curve, t);

    if (!point) return 0;

    return point.value;
}

/**
 * 查找关键点
 * @param t 时间轴的位置 [0,1]
 * @param y 值
 * @param precision 查找精度
 */
export function animationCurveFindKey(curve: AnimationCurveLike, t: number, y: number, precision: number)
{
    const keys = curve.keys;

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
export function animationCurveAddKeyAtCurve(curve: WritableAnimationCurveLike, time: number, value: number, precision: number)
{
    const point = animationCurveGetPoint(curve, time);

    if (Math.abs(value - point.value) < precision)
    {
        curve.keys.push(point);
        curve.keys.sort((a, b) => a.time - b.time);

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
export function animationCurveGetSamples(curve: AnimationCurveLike, num = 100)
{
    const results: AnimationCurveKeyframe[] = [];

    for (let i = 0; i <= num; i++)
    {
        const p = animationCurveGetPoint(curve, i / num);

        results.push(p);
    }

    return results;
}
