/**
 * 颜色工具（纯函数）。
 *
 * 背景：主仓已把颜色迁移为**纯数据接口**——
 * `{ __type__: 'Color3', r, g, b }` / `{ __type__: 'Color4', r, g, b, a }`，
 * 字段全部可选、类型上一律 readonly、**不含任何方法**。而 `feng3d` 桶里
 * `export type { Color3 / Color4 } from './core/Color3'` 覆盖了 `export * from '@feng3d/math'`
 * 里的 class 版（显式命名导出优先），因此旧 class 的
 * `toInt()` / `toHexString()` / `fromUnit()` / `fromUnit24()` / `mix()` / `mixTo()` /
 * `equals()` / `toColor3()` 以及 `BLACK` / `WHITE` 静态成员在编辑器里**全部不可用**
 * （`new Color3()` 会 `TypeError: not a constructor`，`instanceof Color3` 会
 * `TypeError: Right-hand side of 'instanceof' is not callable`）。
 *
 * 详见 `packages/editor/docs/API_MIGRATION.md` §9。
 *
 * 本模块以**纯函数**补齐编辑器所需的颜色能力，**不给 interface 加方法**
 * （违反纯数据规范，根 AGENTS §11.1）。字段缺失时按主仓约定补默认值：
 * rgb 补 1、a 补 1（见 `packages/webgpu/src/caches/color4Logic.ts` 的 `c.r ?? 1`）。
 *
 * 写入约定：纯数据字段类型上是 readonly，写入必须经响应式代理
 * （`reactive(color) as WritableColor4`，根规范 §8.5 / §11.3）——本模块只读不写。
 */
import { mathUtil } from 'feng3d';
import type { Color3, Color4, ImageUtil } from 'feng3d';

/** 纯数据颜色（Color3 | Color4） */
export type Color = Color3 | Color4;

/**
 * 颜色形状：只要求可读的 r/g/b(/a)。
 *
 * 编辑器里同时存在两种颜色形态，读取型工具必须都能接受：
 * - **纯数据接口** `Color3` / `Color4`（编辑器与主仓 core 的数据形态，带 `__type__`）；
 * - **class 版** `@feng3d/math` 的 `Color3` / `Color4`——`Gradient` / `MinMaxGradient` /
 *   `MinMaxCurve` 等仍是 math class，其颜色字段是 class 实例（**没有 `__type__`**），
 *   例如 `MinMaxGradientView` 里的 `minMaxGradient.getValue(0)`。
 */
export interface ColorLike
{
    readonly r?: number;
    readonly g?: number;
    readonly b?: number;
    readonly a?: number;
}

/**
 * 可写 Color3。
 *
 * 纯数据接口字段都是 readonly，直接赋值会报 TS2540；写入前用本类型断言一次：
 * `const r_color = reactive(color) as WritableColor3; r_color.r = 1;`
 */
export type WritableColor3 = { -readonly [P in keyof Color3]: Color3[P] };

/** 可写 Color4（同 `WritableColor3`，多一个 `a`） */
export type WritableColor4 = { -readonly [P in keyof Color4]: Color4[P] };

/**
 * 可写 ColorLike。
 *
 * 写入「形态不确定的颜色」（纯数据接口，或 `@feng3d/math` class 版 Color3/Color4 实例，
 * 如 `Gradient.colorKeys[i].color`）时用本类型断言去掉 readonly：
 * `const r_color = reactive(color) as WritableColorLike; r_color.r = 1;`
 */
export type WritableColorLike = { -readonly [P in keyof ColorLike]: ColorLike[P] };

/**
 * `ImageUtil` 颜色参数的类型。
 *
 * 主仓 `ImageUtil`（`packages/feng3d/src/utils/ImageUtil.ts`）的参数类型仍是
 * `@feng3d/math` 的 **class 版 Color4**，与编辑器侧的纯数据接口在类型上互不兼容，
 * 边界处用 `toImageUtilColor()` 适配。
 */
export type ImageUtilColor = Parameters<ImageUtil['drawLine']>[2];

/** 黑色（Color3，替代旧 `Color3.BLACK`） */
export const COLOR3_BLACK: Color3 = { __type__: 'Color3', r: 0, g: 0, b: 0 };

/** 白色（Color3，替代旧 `Color3.WHITE`） */
export const COLOR3_WHITE: Color3 = { __type__: 'Color3', r: 1, g: 1, b: 1 };

/** 黑色（Color4，a=1，替代旧 `Color4.BLACK`） */
export const COLOR4_BLACK: Color4 = { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 };

/** 白色（Color4，a=1，替代旧 `Color4.WHITE`） */
export const COLOR4_WHITE: Color4 = { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 };

/**
 * 是否为纯数据 Color4。
 *
 * 主仓范式：类型判别用 `__type__`，**不用 `instanceof`**（见 AM §3.1）；
 * 与 `packages/webgpu/src/caches/color4Logic.ts` 的 `isColor4Data()` 同构。
 *
 * 注意：math 的 class 版 Color4 没有 `__type__`，本函数对它返回 false。
 */
export function isColor4(color: object | undefined): color is Color4
{
    return !!color && (color as { __type__?: string }).__type__ === 'Color4';
}

/** 是否为纯数据 Color3 */
export function isColor3(color: object | undefined): color is Color3
{
    return !!color && (color as { __type__?: string }).__type__ === 'Color3';
}

/** 取 rgb 分量（字段缺失时补 1，与主仓渲染端默认值一致） */
export function colorRgb(color: ColorLike): { r: number; g: number; b: number }
{
    return { r: color.r ?? 1, g: color.g ?? 1, b: color.b ?? 1 };
}

/** 取 alpha（缺失补 1；Color3 无 alpha 分量，恒为 1） */
export function colorAlpha(color: ColorLike): number
{
    return isColor4(color) ? (color.a ?? 1) : 1;
}

/**
 * 24 位整数（`0xRRGGBB`）转 Color3（替代旧 `Color3.fromUnit()` / `new Color3().fromUnit()`）。
 */
export function color3FromUnit(color: number): Color3
{
    return {
        __type__: 'Color3',
        r: ((color >> 16) & 0xff) / 0xff,
        g: ((color >> 8) & 0xff) / 0xff,
        b: (color & 0xff) / 0xff,
    };
}

/**
 * 32 位整数（`0xAARRGGBB`）转 Color4（替代旧 `Color4.fromUnit()`）。
 *
 * 注意旧 class 的 `fromUnit()` 把最高字节当 **alpha**；若传入 24 位值（`0xRRGGBB`），
 * alpha 会算成 0。只需 rgb 时请用 {@link colorFromUnit24}。
 *
 * @param color 32 位颜色整数
 * @param a 显式 alpha（给定时不再从整数高位解析）
 */
export function colorFromUnit(color: number, a?: number): Color4
{
    const c = color3FromUnit(color);

    return {
        __type__: 'Color4',
        r: c.r,
        g: c.g,
        b: c.b,
        a: a ?? ((color >> 24) & 0xff) / 0xff,
    };
}

/**
 * 24 位整数（`0xRRGGBB`）转 Color4（替代旧 `Color4.fromUnit24()` / `Color4.fromUnit()`）。
 *
 * @param color 24 位颜色整数
 * @param a alpha，默认 1
 */
export function colorFromUnit24(color: number, a = 1): Color4
{
    const { r, g, b } = colorRgb(color3FromUnit(color));

    return { __type__: 'Color4', r, g, b, a };
}

/**
 * Color3 → Color4（替代旧 class 的 `toColor4()` / `Color4.fromColor3()`）。
 *
 * @param color 源颜色
 * @param a alpha，默认 1
 */
export function color3ToColor4(color: ColorLike, a = 1): Color4
{
    const { r, g, b } = colorRgb(color);

    return { __type__: 'Color4', r, g, b, a };
}

/** Color4 → Color3（丢弃 alpha，替代旧 class 的 `toColor3()`） */
export function color4ToColor3(color: ColorLike): Color3
{
    const { r, g, b } = colorRgb(color);

    return { __type__: 'Color3', r, g, b };
}

/**
 * 拷贝颜色（保持原类型）。
 *
 * 颜色选择器用它拿到一份可编辑副本，避免直接改动父级传入的数据。
 */
export function cloneColor(color: Color): Color
{
    const { r, g, b } = colorRgb(color);

    return isColor4(color)
        ? { __type__: 'Color4', r, g, b, a: colorAlpha(color) }
        : { __type__: 'Color3', r, g, b };
}

/**
 * 24 位颜色整数（`0xRRGGBB`，忽略 alpha）。
 *
 * 等价旧 `Color3.toInt()` / `Color4.toColor3().toInt()`：
 * `((r * 0xff) << 16) + ((g * 0xff) << 8) + (b * 0xff)`（分量按旧实现截断而非四舍五入）。
 */
export function colorToInt(color: ColorLike): number
{
    const { r, g, b } = colorRgb(isColor4(color) ? color4ToColor3(color) : color);

    return ((r * 0xff) << 16) + ((g * 0xff) << 8) + (b * 0xff);
}

/**
 * `#rrggbb` 十六进制字符串（小写、恒 6 位；alpha 不参与）。
 *
 * 替代旧写法 `` `#${color.toInt().toString(16).padStart(6, '0')}` ``，用于 CSS 预览色。
 */
export function colorToHex(color: ColorLike): string
{
    return `#${colorToInt(color).toString(16).padStart(6, '0')}`;
}

/**
 * 与旧 class `toHexString()` 一致的十六进制字符串（**大写**，每分量 2 位）。
 *
 * - Color3：`#RRGGBB`
 * - Color4：`#AARRGGBB`（沿用旧 class 的「alpha 在前」顺序，保证与十六进制输入框往返一致）
 */
export function colorToHexString(color: ColorLike): string
{
    const { r, g, b } = colorRgb(color);
    const toHex = (v: number) =>
    {
        const str = ((v * 0xff) | 0).toString(16);

        return (str.length < 2 ? `0${str}` : str).toUpperCase();
    };

    const rgb = `${toHex(r)}${toHex(g)}${toHex(b)}`;

    return isColor4(color) ? `#${toHex(colorAlpha(color))}${rgb}` : `#${rgb}`;
}

/** CSS `rgb(r, g, b)`（分量四舍五入到 0-255） */
export function colorToCssRgb(color: ColorLike): string
{
    const { r, g, b } = colorRgb(color);

    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

/** CSS `rgba(r, g, b, a)` */
export function colorToCssRgba(color: ColorLike): string
{
    const { r, g, b } = colorRgb(color);

    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${colorAlpha(color)})`;
}

/**
 * rgb 线性插值（返回**新对象**）。
 *
 * 替代旧 class 的 `mix()` / `mixTo()`：旧 `mix` 原地修改并返回自身，
 * 纯数据范式改成「返回新字面量」（不修改入参）。
 *
 * @param color 起始颜色
 * @param other 目标颜色
 * @param rate 目标颜色占比 [0,1]
 */
export function color3Mix(color: ColorLike, other: ColorLike, rate: number): Color3
{
    const a = colorRgb(color);
    const b = colorRgb(other);

    return {
        __type__: 'Color3',
        r: a.r * (1 - rate) + b.r * rate,
        g: a.g * (1 - rate) + b.g * rate,
        b: a.b * (1 - rate) + b.b * rate,
    };
}

/**
 * 按标量缩放 rgb（返回**新对象**）。
 *
 * 等价旧写法 `black.mix(color, 1 / max)`（黑色起点的插值即纯缩放）。
 */
export function color3Scale(color: ColorLike, scale: number): Color3
{
    const { r, g, b } = colorRgb(color);

    return { __type__: 'Color3', r: r * scale, g: g * scale, b: b * scale };
}

/**
 * rgb 相等判定，精度与旧 class `equals()` 一致（`mathUtil.equals`，默认 1e-6）。
 */
export function color3Equals(color: ColorLike, other: ColorLike): boolean
{
    const a = colorRgb(color);
    const b = colorRgb(other);

    return mathUtil.equals(a.r - b.r, 0)
        && mathUtil.equals(a.g - b.g, 0)
        && mathUtil.equals(a.b - b.b, 0);
}

/**
 * 把纯数据颜色适配为 `ImageUtil` 可接受的参数（**边界转换**）。
 *
 * 主仓 `ImageUtil` 的参数类型仍是 class 版 Color4（其 `drawColorRect()` / `drawPixel()`
 * 等路径会调用 `clone()` / `mix()` 方法），而编辑器侧只有纯数据接口，两者类型上不可互相赋值。
 * 编辑器用到的 `fillRect` / `drawLine` / `drawPoint` / `drawCurve` / `drawBetweenTwoCurves` /
 * `drawMinMaxGradient` / `drawColorPickerRect` 只读取 `r/g/b/a` 字段，因此这里给出纯数据字面量
 * 并断言为该参数类型——运行时行为与旧的 class 实例完全一致（同样只被读字段）。
 *
 * ⚠️ 若将来调用只接受 class 实例能力的方法（如 `ImageUtil.drawColorRect()`），
 * 必须改为在边界处构造真正的实例，不能沿用本函数。
 *
 * @param color 纯数据颜色
 * @param a 显式 alpha（缺省用颜色自身的 alpha，Color3 为 1）
 */
export function toImageUtilColor(color: ColorLike, a?: number): ImageUtilColor
{
    const { r, g, b } = colorRgb(color);

    return {
        __type__: 'Color4',
        r,
        g,
        b,
        a: a ?? colorAlpha(color),
    } as unknown as ImageUtilColor;
}
