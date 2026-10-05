import { PRECISION, equals } from '../mathUtils';
import { color3ToHex } from './color3Ops';
import type { Color3Like, WritableColor3Like } from './color3Ops';
import type { WritableVector4Like } from '../geom/vector4Ops';

/**
 * `Color4` 的数据定义与**纯函数**形式（issue #134，方案见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md`）。
 *
 * 与 `color3Ops.ts` 同构：入参用最小形状 `Color4Like`，只读入参、结果写 `out`
 * （`out` 传自己即就地运算）。**阶段 C-b 起 `packages/math/src/Color4.ts` 的 class 已删除**，
 * 颜色只剩 `color/` 下的两个文件：形状 + 纯函数。
 *
 * ## 缺省 `out` 的 `a` 为什么是 1
 *
 * 缺省 out 用 `{ r: 0, g: 0, b: 0, a: 1 }` —— `a: 1` 与原 `new Color4()` 的默认值一致。
 * 这不只是美观：`color4Random(false)` 这类**不写 `a` 分量**的函数，
 * 若缺省 out 的 `a` 取 0，就会与原 `new Color4().random(false)`（a 保持 1）产生行为差异。
 */

/** 纯函数可接受的最小颜色形状（含透明度）：class 实例与纯数据字面量都满足。 */
export interface Color4Like
{
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly a: number;
}

/** 可写出的颜色目标（需要写回时用，例如传普通字面量或带判别字段的 `Color4`）。 */
export interface WritableColor4Like
{
    r: number;
    g: number;
    b: number;
    a: number;
}

/**
 * 纯数据颜色（含透明度，issue #134 阶段 C-b）：**取代原 `Color4` class**。
 *
 * `Color4Like` 是纯函数层的最小只读形状（`readonly r/g/b/a`，**不带**判别字段），
 * 纯数据形态在它之上加一个 `__type__` 字面量，做法与 `feng3d` 的 `core/Color4` 一致
 * （方案 §5.9 的 D1 决策）。两级形状的分工与 `WritableColor4Like` 的边界见 `color3Ops.ts`
 * 里 `Color3` 的注释（同一决策，不重复）。
 *
 * ⚠️ **与 `feng3d` 的 `core/Color4` 是两套体系，本批有意不合流**（方案 §11.7.7 的
 * `Color3` / `Color4` 特有条件）：那套分量**可选**（reactive 驱动的部分声明），本套**必填**。
 * 两侧靠 `Color4Like | Color4` 的联合类型过渡（B6 已用此做法）。
 */
export interface Color4 extends Color4Like
{
    readonly __type__: 'Color4';
}

/** 缺省输出目标：与原 `Color4` 的默认值一致（见文件头说明）。 */
const DEFAULT_OUT: WritableColor4Like = { r: 0, g: 0, b: 0, a: 1 };

/**
 * `Color4.setTo` 的纯函数版：用四个分量填充 `out`（缺省新建）。
 */
export function color4SetTo(r: number, g: number, b: number, a = 1, out: WritableColor4Like = { ...DEFAULT_OUT }): WritableColor4Like
{
    out.r = r;
    out.g = g;
    out.b = b;
    out.a = a;

    return out;
}

/**
 * `Color4.fromUnit` 的纯函数版：把 `0xAARRGGBB` 整数拆成 `[0,1]` 四分量写进 `out`（缺省新建）。
 */
export function color4FromUnit(color: number, out: WritableColor4Like = { ...DEFAULT_OUT }): WritableColor4Like
{
    out.a = ((color >> 24) & 0xff) / 0xff;
    out.r = ((color >> 16) & 0xff) / 0xff;
    out.g = ((color >> 8) & 0xff) / 0xff;
    out.b = (color & 0xff) / 0xff;

    return out;
}

/**
 * `Color4.fromUnit24` 的纯函数版：取 `0xRRGGBB` 三分量，透明度用给定 `a`。
 *
 * 实例版与静态版实现不同（前者先解 4 通道再覆盖 `a`，后者走 `Color3.fromUnit`），
 * 但**结果一致**：`r/g/b` 相同，`a` 都是参数值，所以合并成这一个函数。
 */
export function color4FromUnit24(color: number, a = 1, out: WritableColor4Like = { ...DEFAULT_OUT }): WritableColor4Like
{
    out.r = ((color >> 16) & 0xff) / 0xff;
    out.g = ((color >> 8) & 0xff) / 0xff;
    out.b = (color & 0xff) / 0xff;
    out.a = a;

    return out;
}

/**
 * `Color4.fromColor3` 的纯函数版：取 `Color3` 的三分量，透明度用给定 `a`。
 */
export function color4FromColor3(color3: Color3Like, a = 1, out: WritableColor4Like = { ...DEFAULT_OUT }): WritableColor4Like
{
    out.r = color3.r;
    out.g = color3.g;
    out.b = color3.b;
    out.a = a;

    return out;
}

/**
 * `Color4.toInt()` 的纯函数版。
 *
 * 与实现逐字一致：**不取整**。
 */
export function color4ToInt(color: Color4Like): number
{
    const value = ((color.a * 0xff) << 24) + ((color.r * 0xff) << 16) + ((color.g * 0xff) << 8) + (color.b * 0xff);

    return value;
}

/**
 * `Color4.toHexString()` 的纯函数版。
 *
 * 注意拼接顺序是 **A R G B**（与实现逐字一致，不是 RGBA）。
 */
export function color4ToHexString(color: Color4Like): string
{
    const intR = (color.r * 0xff) | 0;
    const intG = (color.g * 0xff) | 0;
    const intB = (color.b * 0xff) | 0;
    const intA = (color.a * 0xff) | 0;

    return `#${color3ToHex(intA)}${color3ToHex(intR)}${color3ToHex(intG)}${color3ToHex(intB)}`;
}

/**
 * `Color4.toRGBA()` 的纯函数版：输出 `rgba(r,g,b,a)` 形式字符串。
 */
export function color4ToRGBA(color: Color4Like): string
{
    return `rgba(${color.r * 255},${color.g * 255},${color.b * 255},${color.a})`;
}

/**
 * `Color4.mix()` / `Color4.mixTo()` 的纯函数版：把 `color` 按 `rate` 混入 `a`。
 *
 * 注意：class 的 `mix(color, rate = 0.5)` 有默认值 0.5，这里**不给默认**——
 * 默认值属于 class 的方法签名，由 class 侧填好再传进来。
 */
export function color4Mix(a: Color4Like, color: Color4Like, rate: number, out: WritableColor4Like = { ...DEFAULT_OUT }): WritableColor4Like
{
    out.r = a.r * (1 - rate) + color.r * rate;
    out.g = a.g * (1 - rate) + color.g * rate;
    out.b = a.b * (1 - rate) + color.b * rate;
    out.a = a.a * (1 - rate) + color.a * rate;

    return out;
}

/**
 * `Color4.multiply()` / `Color4.multiplyTo()` 的纯函数版：逐分量相乘。
 */
export function color4Multiply(a: Color4Like, c: Color4Like, out: WritableColor4Like = { ...DEFAULT_OUT }): WritableColor4Like
{
    out.r = a.r * c.r;
    out.g = a.g * c.g;
    out.b = a.b * c.b;
    out.a = a.a * c.a;

    return out;
}

/**
 * `Color4.multiplyNumber()` 的纯函数版：逐分量乘以标量。
 */
export function color4MultiplyNumber(a: Color4Like, scale: number, out: WritableColor4Like = { ...DEFAULT_OUT }): WritableColor4Like
{
    out.r = a.r * scale;
    out.g = a.g * scale;
    out.b = a.b * scale;
    out.a = a.a * scale;

    return out;
}

/**
 * `Color4.equals` 的纯函数版：逐分量按 `precision` 判等。
 */
export function color4Equals(a: Color4Like, b: Color4Like, precision = PRECISION): boolean
{
    if (!equals(a.r - b.r, 0, precision))
    { return false; }
    if (!equals(a.g - b.g, 0, precision))
    { return false; }
    if (!equals(a.b - b.b, 0, precision))
    { return false; }
    if (!equals(a.a - b.a, 0, precision))
    { return false; }

    return true;
}

/**
 * `Color4.copy` / `Color4.clone` 的纯函数版：把 `a` 的分量复制进 `out`（缺省新建）。
 */
export function color4Copy(a: Color4Like, out: WritableColor4Like = { ...DEFAULT_OUT }): WritableColor4Like
{
    out.r = a.r;
    out.g = a.g;
    out.b = a.b;
    out.a = a.a;

    return out;
}

/**
 * `Color4.toString` 的纯函数版。
 */
export function color4ToString(a: Color4Like): string
{
    return `{R: ${a.r} G:${a.g} B:${a.b} A:${a.a}}`;
}

/**
 * `Color4.toColor3` 的纯函数版：把 `r/g/b` 写进 `Color3` 形状的 `out`。
 */
export function color4ToColor3(a: Color4Like, out: WritableColor3Like = { r: 0, g: 0, b: 0 }): WritableColor3Like
{
    out.r = a.r;
    out.g = a.g;
    out.b = a.b;

    return out;
}

/**
 * `Color4.toVector4` 的纯函数版：把四分量写进 `Vector4` 形状的 `out`。
 *
 * `out` 用 `WritableVector4Like`：`Vector4` 的纯函数层已于 A2f 落地，这里引用它的形状即可。
 * 等它的 ops 落地后改成引用该类型即可（结构一致，纯类型改动）。
 */
export function color4ToVector4(a: Color4Like, out: WritableVector4Like = { x: 0, y: 0, z: 0, w: 0 }): WritableVector4Like
{
    out.x = a.r;
    out.y = a.g;
    out.z = a.b;
    out.w = a.a;

    return out;
}

/**
 * `Color4.toArray` 的纯函数版：把四分量写进 `array` 的 `offset` 起四位并返回该数组。
 */
export function color4ToArray(a: Color4Like, array: number[] = [], offset = 0): number[]
{
    array[offset] = a.r;
    array[offset + 1] = a.g;
    array[offset + 2] = a.b;
    array[offset + 3] = a.a;

    return array;
}

/**
 * `Color4.random()` 的纯函数版：随机 RGB，`a` 只在 `randomAlpha` 为真时随机。
 *
 * 因为可能**不写 `a`**，所以缺省 out 的 `a` 必须是 1（见文件头）。
 */
export function color4Random(randomAlpha = false, out: WritableColor4Like = { ...DEFAULT_OUT }): WritableColor4Like
{
    out.r = Math.random();
    out.g = Math.random();
    out.b = Math.random();

    if (randomAlpha)
    {
        out.a = Math.random();
    }

    return out;
}
