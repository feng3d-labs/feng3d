import { mathUtil } from '@feng3d/polyfill';
import type { Color3, Color3Like, WritableColor3Like } from '../color/color3';
import { color3Copy, color3FromUnit, color3Mix } from '../color/color3';
import type { WritableColor4Like } from '../color/color4';
import type { GradientAlphaKey } from './GradientAlphaKey';
import type { GradientColorKey } from './GradientColorKey';
import { GradientMode } from './GradientMode';

/**
 * `Gradient` 的数据定义与**纯函数**形式（issue #134 第二批「渐变族」，方案见
 * `docs/MATH_PURE_FUNCTIONS_MIGRATION.md` §8 的「渐变（2）」）。
 *
 * ## 这一层是什么
 *
 * 与本方案第一批（`geom/*.ts` / `color/*.ts`）完全同构：形状（`GradientLike` /
 * `WritableGradientLike` / `Gradient`）+ 纯函数。**原 `packages/math/src/gradient/Gradient.ts`
 * 的 class 已删除**，`index.ts` 的 `export * from './gradient/gradient'` 让
 * `import { Gradient } from '@feng3d/math'` 这个名字保持不变。
 *
 * 与原 class 的逐条对应：
 *
 * | 原 class 成员 | 纯函数 |
 * |---|---|
 * | `new Gradient()`（字段默认值见下） | `gradientDefault(out?)` |
 * | `fromColors(colors, times?)` | `gradientFromColors(colors, times?, out?)` |
 * | `getAlpha(time)` | `gradientGetAlpha(gradient, time)` |
 * | `getColor(time)` | `gradientGetColor(gradient, time, out?)` |
 * | `getValue(time)` | `gradientGetValue(gradient, time, out?)` |
 *
 * 常量 `mode` 的取值与其他两个字段的默认值与原 class **逐字一致**：
 * `mode = GradientMode.Blend`、`alphaKeys = [{alpha:1,time:0},{alpha:1,time:1}]`、
 * `colorKeys = [{color:白,time:0},{color:白,time:1}]`。默认键**每次调用新建**（与原 class
 * 每个实例各持一份数组一致，见方案 §5.3「冻结常量被共享」的教训）。
 *
 * ## 判别字段（与第一批同一决策，§11.9.1）
 *
 * `Gradient` 接口**要求** `readonly __type__: 'Gradient'`（数据声明形态），但纯函数的缺省 `out`
 * **不带**判别字段（返回的是「算出来的值」而不是「被声明的数据」）。需要判别字段时由调用方在
 * **装配点**显式写：`{ __type__: 'Gradient', ...gradientDefault() }`。
 *
 * ## 与原 class 的两处**行为差异**（有意为之，都是「删 class 才可能发生」的差异）
 *
 * 1. `getColor` / `getValue` 现在**总是写进 `out`**（缺省新建），因此**不再返回关键点数组里的
 *    颜色对象本身**。原 class 在「时间恰好等于某个关键点」时 `return colorKeys[i].color`，
 *    返回的是**同一个对象**——调用方写它就会改到渐变数据上。纯函数不改入参（方案 §7 C 第 1 条），
 *    所以一律复制进 `out`。仓内调用方都是立刻读取分量（`colorToCssRgb` / `color4Copy` /
 *    `color4Multiply`），无一处依赖该引用身份。
 * 2. 纯函数不产判别字段（见上），因此 `getValue()` 曾经「返回带 `__type__: 'Color4'`」这条
 *    由 `gradient.spec.ts` 钉住的契约，改成**装配点显式补标记**。仓内需要 `Color4` / `Color3`
 *    标记的只有 `GradientEditor.vue` 往 `colorKeys` 里塞新键这一处，已在装配点显式写。
 */

/** 纯函数可接受的最小渐变形状（`Gradient` 数据、原 class 实例与普通字面量都满足）。 */
export interface GradientLike
{
    /**
     * 渐变模式
     */
    readonly mode: GradientMode;

    /**
     * 在渐变中定义的所有alpha键。
     *
     * 数组**本身**可变（面板要 `push` / `splice` / `sort`），但字段本身只读（根规范 §8.5）。
     */
    readonly alphaKeys: GradientAlphaKey[];

    /**
     * 在渐变中定义的所有color键。
     *
     * 数组**本身**可变（同 `alphaKeys`），但字段本身只读。
     */
    readonly colorKeys: GradientColorKey[];
}

/** 可写出的渐变目标（`out` 参用；`gradientDefault` 的缺省 `out` 即此形状）。 */
export interface WritableGradientLike
{
    mode: GradientMode;
    alphaKeys: GradientAlphaKey[];
    colorKeys: GradientColorKey[];
}

/**
 * 纯数据渐变（issue #134 第二批）：**取代原 `Gradient` class**。
 *
 * `GradientLike` 是纯函数层的最小只读形状（**不带**判别字段），纯数据形态在它之上加一个
 * `__type__` 字面量——两级形状的分工与理由见 `../color/color3.ts` 里 `Color3` 的注释
 * （同一决策，不重复）。
 */
export interface Gradient extends GradientLike
{
    readonly __type__: 'Gradient';
}

/** 缺省的 alpha 键（与原 `new Gradient()` 一致；**每次新建**，不共享冻结常量） */
function defaultAlphaKeys(): GradientAlphaKey[]
{
    return [{ alpha: 1, time: 0 }, { alpha: 1, time: 1 }];
}

/** 缺省的 color 键（与原 `new Gradient()` 一致：纯白，带 `__type__`；**每次新建**） */
function defaultColorKeys(): GradientColorKey[]
{
    return [
        { color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, time: 0 },
        { color: { __type__: 'Color3', r: 1, g: 1, b: 1 }, time: 1 },
    ];
}

/** 缺省输出目标：与原 `new Gradient()` 的字段默认值逐字一致 */
function defaultOut(): WritableGradientLike
{
    return {
        mode: GradientMode.Blend,
        alphaKeys: defaultAlphaKeys(),
        colorKeys: defaultColorKeys(),
    };
}

/**
 * `new Gradient()` 的纯函数版：把三个字段的默认值写进 `out`（缺省新建）。
 *
 * @param out 结果写出目标（缺省时新建）
 */
export function gradientDefault(out: WritableGradientLike = defaultOut()): WritableGradientLike
{
    out.mode = GradientMode.Blend;
    out.alphaKeys = defaultAlphaKeys();
    out.colorKeys = defaultColorKeys();

    return out;
}

/**
 * `Gradient.fromColors` 的纯函数版：把颜色列表写成 `colorKeys` 写进 `out`（缺省新建）。
 *
 * 与原方法一致，**只写 `out.colorKeys`**（`mode` 与 `alphaKeys` 保持 `out` 原值）；
 * 缺省 `out` 是 `gradientDefault()`，所以 `gradientFromColors(colors)` 等价于原
 * `new Gradient().fromColors(colors)`。
 *
 * @param colors 颜色列表（`0xRRGGBB`）
 * @param times 各颜色的时间；省略时按 `i / (colors.length - 1)` 均匀分布（首 0、末 1）
 * @param out 结果写出目标（缺省时新建）
 */
export function gradientFromColors(colors: number[], times?: number[], out: WritableGradientLike = defaultOut()): WritableGradientLike
{
    if (!times)
    {
        times = [];
        for (let i = 0; i < colors.length; i++)
        {
            // 与原实现一致：单色时 `colors.length - 1 === 0`，得到 `NaN`/`Infinity` 也照写
            times[i] = i / (colors.length - 1);
        }
    }

    const colorKeys: GradientColorKey[] = [];

    for (let i = 0; i < colors.length; i++)
    {
        // 0xRRGGBB → 纯数据 Color3；`__type__` 由装配点补上（纯函数缺省 out 不带判别字段，§11.9.1）
        const color: Color3 = { __type__: 'Color3', ...color3FromUnit(colors[i]) };

        colorKeys[i] = { color, time: times[i] };
    }

    out.colorKeys = colorKeys;

    return out;
}

/**
 * `Gradient.getAlpha` 的纯函数版。
 *
 * 语义（原实现逐字保留）：单键/越界做时间钳制；恰好命中某键的时间取该键的值；
 * 区间内 `GradientMode.Fixed` 取右端键的值（不插值），其余走 `mathUtil.mapLinear` 线性插值。
 *
 * @param gradient 渐变数据
 * @param time 时间
 */
export function gradientGetAlpha(gradient: GradientLike, time: number): number
{
    const alphaKeys = gradient.alphaKeys;

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
            if (gradient.mode === GradientMode.Fixed) return nv;

            return mathUtil.mapLinear(time, t, nt, v, nv);
        }
    }

    return 1;
}

/**
 * `Gradient.getColor` 的纯函数版：结果写进 `out`（缺省新建）。
 *
 * 除「时间恰好落在键上」时由复制替代了引用返回外（见文件头「行为差异 1」），语义与原实现逐字一致。
 *
 * @param gradient 渐变数据
 * @param time 时间
 * @param out 结果写出目标（缺省时新建；缺省值是白色，与原 `new Color3()` 一致）
 */
export function gradientGetColor(gradient: GradientLike, time: number, out: WritableColor3Like = { r: 1, g: 1, b: 1 }): WritableColor3Like
{
    const colorKeys = gradient.colorKeys;

    if (colorKeys.length === 1) return color3Copy(colorKeys[0].color, out);
    if (time <= colorKeys[0].time) return color3Copy(colorKeys[0].color, out);
    if (time >= colorKeys[colorKeys.length - 1].time) return color3Copy(colorKeys[colorKeys.length - 1].color, out);

    for (let i = 0, n = colorKeys.length - 1; i < n; i++)
    {
        const t = colorKeys[i].time;
        const v: Color3Like = colorKeys[i].color;
        const nt = colorKeys[i + 1].time;
        const nv: Color3Like = colorKeys[i + 1].color;

        if (time === t) return color3Copy(v, out);
        if (time === nt) return color3Copy(nv, out);
        if (t < time && time < nt)
        {
            if (gradient.mode === GradientMode.Fixed) return color3Copy(nv, out);

            // 原 `v.mixTo(nv, rate)`：不改两端、结果写 `out`
            return color3Mix(v, nv, (time - t) / (nt - t), out);
        }
    }

    // 与原 `new Color3()` 的默认值一致（白色）
    return color3Copy({ r: 1, g: 1, b: 1 }, out);
}

/**
 * `Gradient.getValue` 的纯函数版：rgb 来自 `gradientGetColor`、alpha 来自 `gradientGetAlpha`，
 * 结果写进 `out`（缺省新建）。
 *
 * @param gradient 渐变数据
 * @param time 时间
 * @param out 结果写出目标（缺省时新建）
 */
export function gradientGetValue(gradient: GradientLike, time: number, out: WritableColor4Like = { r: 1, g: 1, b: 1, a: 1 }): WritableColor4Like
{
    const alpha = gradientGetAlpha(gradient, time);

    // 原实现 `color4FromColor3(this.getColor(time), alpha)`：rgb 取自 getColor、alpha 取自 getAlpha。
    // 这里让 `gradientGetColor` 直接写 `out` 的 r/g/b（`WritableColor4Like` 结构上满足
    // `WritableColor3Like`），再补 `a`——省一次分配，且 `out === 入参` 时也安全。
    gradientGetColor(gradient, time, out);
    out.a = alpha;

    return out;
}
