import { MATHUTIL_PRECISION, mathUtilEquals } from '../mathutil';
import type { WritableVector3Like } from '../geom/vector3';

/**
 * `Color3` 的数据定义与**纯函数**形式（issue #134，方案见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md`）。
 *
 * ## 这一层是什么
 *
 * 主仓的数据形态是「纯数据字面量 `{ __type__: 'Color3', r, g, b }` + 纯函数」。
 * **阶段 C-b 起 `packages/math/src/Color3.ts` 的 class 已删除**，颜色只剩这一个文件：
 * 形状（`Color3Like` / `WritableColor3Like` / `Color3`）+ 常量（`ColorKeywords`）+ 纯函数。
 * 原 class 的同名方法曾转发到这里（`color.mixTo(other, rate)` → `color3Mix(color, other, rate)`），
 * 所以 A 阶段抽取时行为逐字不变、C-b 删 class 时也不必再改语义。
 *
 * - 入参用最小形状 `Color3Like`（`{ r, g, b }`）—— 普通字面量、带判别字段的 `Color3`
 *   与（C-b 之前的）class 实例都满足；
 * - 所有函数**只读入参**，需要写回时显式传 `out`；`out` 传自己即就地运算；
 * - 缺省 `out` 返回的是 `WritableColor3Like`（**不带**判别字段，见下面的 `Color3` 注释）。
 *
 * 依赖只有 `@feng3d/polyfill` 的 `mathUtil`（判等精度）与
 * `../geom/vector3` 的**类型**（type-only，编译后擦除，运行时无依赖）。
 */

/** 纯函数可接受的最小颜色形状：class 实例与纯数据字面量都满足。 */
export interface Color3Like
{
    readonly r: number;
    readonly g: number;
    readonly b: number;
}

/** 可写出的颜色目标（需要写回时用，例如传普通字面量或带判别字段的 `Color3`）。 */
export interface WritableColor3Like
{
    r: number;
    g: number;
    b: number;
}

/**
 * 纯数据颜色（issue #134 阶段 C-b）：**取代原 `Color3` class**。
 *
 * `Color3Like` 是纯函数层的最小只读形状（`readonly r/g/b`，**不带**判别字段），
 * 纯数据形态在它之上加一个 `__type__` 字面量，做法与 `feng3d` 的 `core/Color3` 一致
 * （方案 §5.9 的 D1 决策：纯数据接口一律声明 `readonly __type__: '<字面量>'`）。
 *
 * 两级形状是有意的分工（方案 §11.7.7 的 P4）：
 *
 * - `Color3Like` / `WritableColor3Like` 给 `color3*` 纯函数与「放宽入参」的消费方用——**不要求**
 *   判别字段，这样 A / B 阶段已经放宽的签名不必回头加字段；
 * - `Color3` 是**数据声明**用的形状（默认数据 / 外部构造），带判别字段后 `obj.__type__ === 'Color3'`
 *   可判别、可挂到编辑器面板上。
 *
 * ⚠️ **`color3*` 纯函数的缺省 `out` 是新建的 `WritableColor3Like`，不带 `__type__`**：
 * 它们返回的是「算出来的值」而不是「被声明的数据」。需要判别字段时由调用方在**装配点**显式写字面量
 * `{ __type__: 'Color3', ...color3FromUnit(v) }`。这条边界是 C-a 的实测结论：若要求 `out`
 * 也带判别字段，A / B 阶段放宽过的 `WritableColor3Like` 消费方（普通字面量）会全部编译不过。
 *
 * ⚠️ **与 `feng3d` 的 `core/Color3` 是两套体系，本批有意不合流**（方案 §11.7.7 的
 * `Color3` / `Color4` 特有条件）：那套是 reactive 驱动的纯数据接口，分量**可选**（支持
 * `{ __type__: 'Color3' }` 这样的部分声明）；本套分量**必填**（纯函数直接读 `r/g/b`）。
 * 两侧靠 `Color3Like | Color3` 的联合类型过渡（B6 已用此做法），跨体系赋值由 feng3d 那侧的可选字段吸收。
 */
export interface Color3 extends Color3Like
{
    readonly __type__: 'Color3';
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
export function color3Equals(a: Color3Like, b: Color3Like, precision = MATHUTIL_PRECISION): boolean
{
    if (!mathUtilEquals(a.r - b.r, 0, precision))
    { return false; }
    if (!mathUtilEquals(a.g - b.g, 0, precision))
    { return false; }
    if (!mathUtilEquals(a.b - b.b, 0, precision))
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

/**
 * CSS 颜色关键字 → `0xRRGGBB` 整数表。
 *
 * **阶段 C-b 从原 `Color3.ts` 搬到这里**（class 文件已删除）——它是数据（常量）而不是行为，
 * 与 `Color3` 的形状、`color3*` 纯函数同属一个文件；包入口的 `export * from './color/color3'`
 * 让 `import { ColorKeywords } from '@feng3d/math'` 保持不变。
 *
 * 唯一的消费方是 `packages/feng3d/src/textures/createTexture.ts`（配 `color4FromUnit24`）。
 */
export const ColorKeywords = {
    aliceblue: 0xF0F8FF, antiquewhite: 0xFAEBD7, aqua: 0x00FFFF, aquamarine: 0x7FFFD4, azure: 0xF0FFFF,
    beige: 0xF5F5DC, bisque: 0xFFE4C4, black: 0x000000, blanchedalmond: 0xFFEBCD, blue: 0x0000FF, blueviolet: 0x8A2BE2,
    brown: 0xA52A2A, burlywood: 0xDEB887, cadetblue: 0x5F9EA0, chartreuse: 0x7FFF00, chocolate: 0xD2691E, coral: 0xFF7F50,
    cornflowerblue: 0x6495ED, cornsilk: 0xFFF8DC, crimson: 0xDC143C, cyan: 0x00FFFF, darkblue: 0x00008B, darkcyan: 0x008B8B,
    darkgoldenrod: 0xB8860B, darkgray: 0xA9A9A9, darkgreen: 0x006400, darkgrey: 0xA9A9A9, darkkhaki: 0xBDB76B, darkmagenta: 0x8B008B,
    darkolivegreen: 0x556B2F, darkorange: 0xFF8C00, darkorchid: 0x9932CC, darkred: 0x8B0000, darksalmon: 0xE9967A, darkseagreen: 0x8FBC8F,
    darkslateblue: 0x483D8B, darkslategray: 0x2F4F4F, darkslategrey: 0x2F4F4F, darkturquoise: 0x00CED1, darkviolet: 0x9400D3,
    deeppink: 0xFF1493, deepskyblue: 0x00BFFF, dimgray: 0x696969, dimgrey: 0x696969, dodgerblue: 0x1E90FF, firebrick: 0xB22222,
    floralwhite: 0xFFFAF0, forestgreen: 0x228B22, fuchsia: 0xFF00FF, gainsboro: 0xDCDCDC, ghostwhite: 0xF8F8FF, gold: 0xFFD700,
    goldenrod: 0xDAA520, gray: 0x808080, green: 0x008000, greenyellow: 0xADFF2F, grey: 0x808080, honeydew: 0xF0FFF0, hotpink: 0xFF69B4,
    indianred: 0xCD5C5C, indigo: 0x4B0082, ivory: 0xFFFFF0, khaki: 0xF0E68C, lavender: 0xE6E6FA, lavenderblush: 0xFFF0F5, lawngreen: 0x7CFC00,
    lemonchiffon: 0xFFFACD, lightblue: 0xADD8E6, lightcoral: 0xF08080, lightcyan: 0xE0FFFF, lightgoldenrodyellow: 0xFAFAD2, lightgray: 0xD3D3D3,
    lightgreen: 0x90EE90, lightgrey: 0xD3D3D3, lightpink: 0xFFB6C1, lightsalmon: 0xFFA07A, lightseagreen: 0x20B2AA, lightskyblue: 0x87CEFA,
    lightslategray: 0x778899, lightslategrey: 0x778899, lightsteelblue: 0xB0C4DE, lightyellow: 0xFFFFE0, lime: 0x00FF00, limegreen: 0x32CD32,
    linen: 0xFAF0E6, magenta: 0xFF00FF, maroon: 0x800000, mediumaquamarine: 0x66CDAA, mediumblue: 0x0000CD, mediumorchid: 0xBA55D3,
    mediumpurple: 0x9370DB, mediumseagreen: 0x3CB371, mediumslateblue: 0x7B68EE, mediumspringgreen: 0x00FA9A, mediumturquoise: 0x48D1CC,
    mediumvioletred: 0xC71585, midnightblue: 0x191970, mintcream: 0xF5FFFA, mistyrose: 0xFFE4E1, moccasin: 0xFFE4B5, navajowhite: 0xFFDEAD,
    navy: 0x000080, oldlace: 0xFDF5E6, olive: 0x808000, olivedrab: 0x6B8E23, orange: 0xFFA500, orangered: 0xFF4500, orchid: 0xDA70D6,
    palegoldenrod: 0xEEE8AA, palegreen: 0x98FB98, paleturquoise: 0xAFEEEE, palevioletred: 0xDB7093, papayawhip: 0xFFEFD5, peachpuff: 0xFFDAB9,
    peru: 0xCD853F, pink: 0xFFC0CB, plum: 0xDDA0DD, powderblue: 0xB0E0E6, purple: 0x800080, rebeccapurple: 0x663399, red: 0xFF0000, rosybrown: 0xBC8F8F,
    royalblue: 0x4169E1, saddlebrown: 0x8B4513, salmon: 0xFA8072, sandybrown: 0xF4A460, seagreen: 0x2E8B57, seashell: 0xFFF5EE,
    sienna: 0xA0522D, silver: 0xC0C0C0, skyblue: 0x87CEEB, slateblue: 0x6A5ACD, slategray: 0x708090, slategrey: 0x708090, snow: 0xFFFAFA,
    springgreen: 0x00FF7F, steelblue: 0x4682B4, tan: 0xD2B48C, teal: 0x008080, thistle: 0xD8BFD8, tomato: 0xFF6347, turquoise: 0x40E0D0,
    violet: 0xEE82EE, wheat: 0xF5DEB3, white: 0xFFFFFF, whitesmoke: 0xF5F5F5, yellow: 0xFFFF00, yellowgreen: 0x9ACD32
};
