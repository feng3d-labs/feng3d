import { mathUtil } from '@feng3d/polyfill';
import type { WritableVector3Like } from '../geom/vector3Ops';

/**
 * `Color3` 运算的**纯函数**形式（issue #134，方案见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md`）。
 *
 * ## 为什么要有这一层
 *
 * 主仓的数据形态是「纯数据字面量 `{ __type__: 'Color3', r, g, b }` + 纯函数」，
 * 而 `Color3` 目前是 class（`packages/math/src/Color3.ts`），运算都挂在实例上
 * （`color.mixTo(other, rate)`）。这一层把**不依赖实例状态**的运算抽出来：
 *
 * - 入参用最小形状 `Color3Like`（`{ r, g, b }`）—— **class 实例与纯数据字面量都满足**，
 *   于是消费侧可以逐步从 `color.mixTo(...)` 迁移到 `color3Mix(color, ...)`；
 * - 所有函数**只读入参**，需要写回时显式传 `out`；`out` 传自己即就地运算；
 * - `Color3` 的同名方法改为转发到这些函数（**行为逐字不变**），
 *   这样"实现只有一份"，将来把 class 降级 / 删除时不会两处漂移。
 *
 * 依赖只有 `@feng3d/polyfill` 的 `mathUtil`（判等精度）与
 * `../geom/vector3Ops` 的**类型**（type-only，编译后擦除，运行时无依赖）。
 */

/** 纯函数可接受的最小颜色形状：class 实例与纯数据字面量都满足。 */
export interface Color3Like
{
    readonly r: number;
    readonly g: number;
    readonly b: number;
}

/** 可写出的颜色目标（需要写回时用，例如传 class 实例或普通字面量）。 */
export interface WritableColor3Like
{
    r: number;
    g: number;
    b: number;
}

/**
 * `Color3.ToHex` 的纯函数版：`[0,15]` 数值转两位大写十六进制片段。
 *
 * `Color3.toHexString()` 与 `Color4.toHexString()` 都复用它（实现只有一份）。
 */
export function color3ToHex(i: number): string
{
    const str = i.toString(16);

    if (i <= 0xf)
    {
        return (`0${str}`).toUpperCase();
    }

    return str.toUpperCase();
}

/**
 * `Color3.setTo` 的纯函数版：用三个分量填充 `out`（缺省新建）。
 */
export function color3SetTo(r: number, g: number, b: number, out: WritableColor3Like = { r: 0, g: 0, b: 0 }): WritableColor3Like
{
    out.r = r;
    out.g = g;
    out.b = b;

    return out;
}

/**
 * `Color3.fromUnit` 的纯函数版：把 `0xRRGGBB` 整数拆成 `[0,1]` 分量写进 `out`（缺省新建）。
 */
export function color3FromUnit(color: number, out: WritableColor3Like = { r: 0, g: 0, b: 0 }): WritableColor3Like
{
    out.r = ((color >> 16) & 0xff) / 0xff;
    out.g = ((color >> 8) & 0xff) / 0xff;
    out.b = (color & 0xff) / 0xff;

    return out;
}

/**
 * `Color3.toInt()` 的纯函数版。
 *
 * 注意：与实现逐字一致 —— **不取整**（`color3.spec.ts` 里有专门用例钉住这一点），
 * 所以分量不是 `n/255` 时结果可能不是整数。
 */
export function color3ToInt(color: Color3Like): number
{
    return ((color.r * 0xff) << 16) + ((color.g * 0xff) << 8) + (color.b * 0xff);
}

/**
 * `Color3.toHexString()` 的纯函数版。
 */
export function color3ToHexString(color: Color3Like): string
{
    const intR = (color.r * 0xff) | 0;
    const intG = (color.g * 0xff) | 0;
    const intB = (color.b * 0xff) | 0;

    return `#${color3ToHex(intR)}${color3ToHex(intG)}${color3ToHex(intB)}`;
}

/**
 * `Color3.mix()` 的纯函数版：把 `color` 按 `rate` 混入 `a`，结果写进 `out`（缺省新建）。
 *
 * @param a 底色
 * @param color 混入的颜色
 * @param rate 混入比例（0 → 保持 `a`，1 → 取 `color`）
 * @param out 结果写出目标（缺省时新建普通字面量）
 */
export function color3Mix(a: Color3Like, color: Color3Like, rate: number, out: WritableColor3Like = { r: 0, g: 0, b: 0 }): WritableColor3Like
{
    out.r = a.r * (1 - rate) + color.r * rate;
    out.g = a.g * (1 - rate) + color.g * rate;
    out.b = a.b * (1 - rate) + color.b * rate;

    return out;
}

/**
 * `Color3.scale()` 的纯函数版：按标量缩放，结果写进 `out`（缺省新建）。
 */
export function color3Scale(a: Color3Like, s: number, out: WritableColor3Like = { r: 0, g: 0, b: 0 }): WritableColor3Like
{
    out.r = a.r * s;
    out.g = a.g * s;
    out.b = a.b * s;

    return out;
}

/**
 * `Color3.equals` 的纯函数版：逐分量按 `precision` 判等。
 */
export function color3Equals(a: Color3Like, b: Color3Like, precision = mathUtil.PRECISION): boolean
{
    if (!mathUtil.equals(a.r - b.r, 0, precision))
    { return false; }
    if (!mathUtil.equals(a.g - b.g, 0, precision))
    { return false; }
    if (!mathUtil.equals(a.b - b.b, 0, precision))
    { return false; }

    return true;
}

/**
 * `Color3.copy` / `Color3.clone` 的纯函数版：把 `a` 的分量复制进 `out`（缺省新建）。
 */
export function color3Copy(a: Color3Like, out: WritableColor3Like = { r: 0, g: 0, b: 0 }): WritableColor3Like
{
    out.r = a.r;
    out.g = a.g;
    out.b = a.b;

    return out;
}

/**
 * `Color3.toVector3` 的纯函数版：把 `r/g/b` 写进三维向量的 `x/y/z`。
 */
export function color3ToVector3(a: Color3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    out.x = a.r;
    out.y = a.g;
    out.z = a.b;

    return out;
}

/**
 * `Color3.toString` 的纯函数版。
 */
export function color3ToString(a: Color3Like): string
{
    return `{R: ${a.r} G:${a.g} B:${a.b}}`;
}

/**
 * `Color3.toArray` 的纯函数版：把分量写进 `array` 的 `offset` 起三位并返回该数组。
 */
export function color3ToArray(a: Color3Like, array: number[] = [], offset = 0): number[]
{
    array[offset] = a.r;
    array[offset + 1] = a.g;
    array[offset + 2] = a.b;

    return array;
}
