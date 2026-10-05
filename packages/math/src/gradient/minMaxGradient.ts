import type { Color4, WritableColor4Like } from '../color/color4Ops';
import { color4Copy, color4Mix } from '../color/color4Ops';
import type { Gradient } from './gradientOps';
import { gradientDefault, gradientGetValue } from './gradientOps';
import { MinMaxGradientMode } from './MinMaxGradientMode';

/**
 * `MinMaxGradient` 的数据定义与**纯函数**形式（issue #134 第二批「渐变族」，方案见
 * `docs/MATH_PURE_FUNCTIONS_MIGRATION.md` §8 的「渐变（2）」）。
 *
 * 与原 class 的逐条对应：
 *
 * | 原 class 成员 | 纯函数 |
 * |---|---|
 * | `new MinMaxGradient()`（字段默认值见下） | `minMaxGradientDefault(out?)` |
 * | `getValue(time, randomBetween?)` | `minMaxGradientGetValue(g, time, randomBetween?, out?)` |
 *
 * 字段默认值与原 class **逐字一致**：`mode = MinMaxGradientMode.Color`、
 * `color` / `colorMin` / `colorMax` 是白色不透明的 `Color4`、`gradient` / `gradientMin` /
 * `gradientMax` 是三个**各自独立**的默认 `Gradient`（纯白渐变）。
 *
 * 判别字段的取舍与 `gradientOps.ts` 相同（接口要求 `readonly __type__`、纯函数缺省 `out` 不带），
 * 装配点显式写 `{ __type__: 'MinMaxGradient', ...minMaxGradientDefault() }`。
 *
 * ⚠️ 三个 `gradient*` 字段与三个颜色字段都带 `__type__` **不是装饰**：这几层数据会进
 * 序列化（粒子模块的字段）与编辑器面板（`OAVMinMaxGradient` / `OAVColorPicker` 按
 * `__type__` 选控件），漏写会掉进「控件退化成默认文本框」或 uniform 静默传全 0（方案 §11.10 C-b-4）。
 */

/** 纯函数可接受的最小「最大最小渐变」形状（数据接口与原 class 实例都满足）。 */
export interface MinMaxGradientLike
{
    /**
     * Set the mode that the min-max gradient will use to evaluate colors.
     *
     * 设置最小-最大梯度将用于评估颜色的模式。
     */
    readonly mode: MinMaxGradientMode;

    /**
     * Set a constant color.
     *
     * 常量颜色值
     */
    readonly color: Color4;

    /**
     * Set a constant color for the lower bound.
     *
     * 为下界设置一个常量颜色。
     */
    readonly colorMin: Color4;

    /**
     * Set a constant color for the upper bound.
     *
     * 为上界设置一个常量颜色。
     */
    readonly colorMax: Color4;

    /**
     * Set the gradient.
     *
     * 设置渐变。
     */
    readonly gradient: Gradient;

    /**
     * Set a gradient for the lower bound.
     *
     * 为下界设置一个渐变。
     */
    readonly gradientMin: Gradient;

    /**
     * Set a gradient for the upper bound.
     *
     * 为上界设置一个渐变。
     */
    readonly gradientMax: Gradient;
}

/** 可写出的最大最小渐变目标（`out` 参用）。 */
export interface WritableMinMaxGradientLike
{
    mode: MinMaxGradientMode;
    color: Color4;
    colorMin: Color4;
    colorMax: Color4;
    gradient: Gradient;
    gradientMin: Gradient;
    gradientMax: Gradient;
}

/**
 * 纯数据「最大最小颜色渐变」（issue #134 第二批）：**取代原 `MinMaxGradient` class**。
 *
 * `MinMaxGradientLike` 是纯函数层的最小只读形状（**不带**判别字段），纯数据形态在它之上加一个
 * `__type__` 字面量——两级形状的分工与理由见 `../color/color3Ops.ts` 里 `Color3` 的注释。
 */
export interface MinMaxGradient extends MinMaxGradientLike
{
    readonly __type__: 'MinMaxGradient';
}

/** 白色不透明的纯数据 `Color4`（`Color4` 的缺省 `out` 不带判别字段，这里数据声明必须带上） */
function white(): Color4
{
    return { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 };
}

/** 默认渐变（带判别字段；每次新建，三处互不共享） */
function defaultGradient(): Gradient
{
    return { __type__: 'Gradient', ...gradientDefault() };
}

/** 缺省输出目标：与原 `new MinMaxGradient()` 的字段默认值逐字一致 */
function defaultOut(): WritableMinMaxGradientLike
{
    return {
        mode: MinMaxGradientMode.Color,
        color: white(),
        colorMin: white(),
        colorMax: white(),
        gradient: defaultGradient(),
        gradientMin: defaultGradient(),
        gradientMax: defaultGradient(),
    };
}

/**
 * `new MinMaxGradient()` 的纯函数版：把七个字段的默认值写进 `out`（缺省新建）。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function minMaxGradientDefault(out: WritableMinMaxGradientLike = defaultOut()): WritableMinMaxGradientLike
{
    out.mode = MinMaxGradientMode.Color;
    out.color = white();
    out.colorMin = white();
    out.colorMax = white();
    out.gradient = defaultGradient();
    out.gradientMin = defaultGradient();
    out.gradientMax = defaultGradient();

    return out;
}

/**
 * `MinMaxGradient.getValue` 的纯函数版：按 `mode` 求色，结果写进 `out`（缺省新建）。
 *
 * 与原实现逐字一致：`Color` / `RandomColor` 走 `gradient`，`Gradient` 走 `gradient.getValue`，
 * `TwoColors` / `TwoGradients` 在两端之间按 `randomBetween` 插值。**`randomBetween` 的默认值
 * 是 `Math.random()`**，与 class 一致（默认值属于原方法签名，本函数保留它以免调用点改语义）。
 *
 * 与原 class 的差异只有一处、且是刻意的：`Color` 分支原样 `return this.color`（返回字段对象
 * **本身**），现在复制进 `out`——纯函数不改入参、也不把内部对象递出去（方案 §7 C 第 1 条）。
 * 仓内三个调用点都是立刻读分量（`color4Copy` / `color4Multiply` / `colorToCssRgb`），
 * 无一处依赖该引用身份。
 *
 * @param minMaxGradient 数据
 * @param time 时间
 * @param randomBetween 两个边界之间的随机插值系数
 * @param out 结果写出目标（缺省时新建）
 */
export function minMaxGradientGetValue(
    minMaxGradient: MinMaxGradientLike,
    time: number,
    randomBetween: number = Math.random(),
    out: WritableColor4Like = { r: 1, g: 1, b: 1, a: 1 },
): WritableColor4Like
{
    let min: WritableColor4Like;
    let max: WritableColor4Like;

    switch (minMaxGradient.mode)
    {
        case MinMaxGradientMode.Color:
            return color4Copy(minMaxGradient.color, out);
        case MinMaxGradientMode.Gradient:
            return gradientGetValue(minMaxGradient.gradient, time, out);
        case MinMaxGradientMode.TwoColors:
            // 原 `this.colorMin.mixTo(this.colorMax, randomBetween)`：结果写 `out`、不改两端
            return color4Mix(minMaxGradient.colorMin, minMaxGradient.colorMax, randomBetween, out);
        case MinMaxGradientMode.TwoGradients:
            min = gradientGetValue(minMaxGradient.gradientMin, time);
            max = gradientGetValue(minMaxGradient.gradientMax, time);

            return color4Mix(min, max, randomBetween, out);
        case MinMaxGradientMode.RandomColor:
            return gradientGetValue(minMaxGradient.gradient, randomBetween, out);
    }

    return color4Copy(minMaxGradient.color, out);
}
