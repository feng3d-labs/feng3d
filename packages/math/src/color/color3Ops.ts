/**
 * `Color3` 运算的**纯函数**形式（issue #134 的第一步）。
 *
 * ## 为什么要有这一层
 *
 * 主仓的数据形态是「纯数据字面量 `{ __type__: 'Color3', r, g, b }` + 纯函数」，
 * 而 `Color3` 目前是 class（`packages/math/src/Color3.ts`），运算都挂在实例上
 * （`color.mixTo(other, rate)`）。这一层把**不依赖实例状态**的运算抽出来：
 *
 * - 入参用最小形状 `Color3Like`（`{ r, g, b }`）—— **class 实例与纯数据字面量都满足**，
 *   于是消费侧可以逐步从 `color.mixTo(...)` 迁移到 `color3Mix(color, ...)`；
 * - 所有函数**只读入参**，需要写回时显式传 `out`；
 * - `Color3` 的同名方法改为转发到这些函数（**行为逐字不变**），
 *   这样"实现只有一份"，将来把 class 降级 / 删除时不会两处漂移。
 *
 * 本文件**不 import 任何东西**（纯计算），因此不引入依赖、也不受分层约束影响。
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
