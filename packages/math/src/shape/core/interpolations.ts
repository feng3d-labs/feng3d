/**
 * 插值公式纯函数集（原 `Interpolations` class 的纯函数形态）
 *
 * ## 为什么是「模块级函数」而不是 class
 *
 * 原 `Interpolations` 是**纯静态算法容器**：3 个 `static` 方法，无构造函数、无实例字段、
 * 无继承、无 `this`。全部操作数是 `number`（函数值），没有形状问题、没有 `out` 参数，
 * 所以拆解就是「`static` 方法 → 模块级函数」，不需要 tagged union + 分发。
 *
 * 原文件里的 6 个 Bernstein 基函数（`QuadraticBezierP0` … `CubicBezierP3`）本来就是模块级函数，
 * 本批**一行未改**。
 *
 * Bezier Curves formulas obtained from
 * http://en.wikipedia.org/wiki/Bézier_curve
 */

/**
 * Catmull-Rom 样条在参数 `t` 处的值（四个控制点 `p0`-`p3`，返回 `p1`-`p2` 段上的插值）。
 */
export function interpolationsCatmullRom(t: number, p0: number, p1: number, p2: number, p3: number)
{
    const v0 = (p2 - p0) * 0.5;
    const v1 = (p3 - p1) * 0.5;
    const t2 = t * t;
    const t3 = t * t2;

    return (((2 * p1) - (2 * p2) + v0 + v1) * t3) + (((-3 * p1) + (3 * p2) - (2 * v0) - v1) * t2) + (v0 * t) + p1;
}

/**
 * 二次贝塞尔曲线在参数 `t` 处的值。
 */
export function interpolationsQuadraticBezier(t: number, p0: number, p1: number, p2: number)
{
    return QuadraticBezierP0(t, p0) + QuadraticBezierP1(t, p1)
        + QuadraticBezierP2(t, p2);
}

/**
 * 三次贝塞尔曲线在参数 `t` 处的值。
 */
export function interpolationsCubicBezier(t: number, p0: number, p1: number, p2: number, p3: number)
{
    return CubicBezierP0(t, p0) + CubicBezierP1(t, p1) + CubicBezierP2(t, p2)
        + CubicBezierP3(t, p3);
}

function QuadraticBezierP0(t: number, p: number)
{
    const k = 1 - t;

    return k * k * p;
}

function QuadraticBezierP1(t: number, p: number)
{
    return 2 * (1 - t) * t * p;
}

function QuadraticBezierP2(t: number, p: number)
{
    return t * t * p;
}

function CubicBezierP0(t: number, p: number)
{
    const k = 1 - t;

    return k * k * k * p;
}

function CubicBezierP1(t: number, p: number)
{
    const k = 1 - t;

    return 3 * k * k * t * p;
}

function CubicBezierP2(t: number, p: number)
{
    return 3 * (1 - t) * t * t * p;
}

function CubicBezierP3(t: number, p: number)
{
    return t * t * t * p;
}
