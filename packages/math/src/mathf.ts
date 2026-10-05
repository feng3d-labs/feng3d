/**
 * 数值工具纯函数集（原 `Mathf` class 的纯函数形态）
 *
 * ## 为什么是「模块级函数 + 模块级常量」而不是 class
 *
 * 原 `MathF.ts` 的 `Mathf` 是**纯静态工具容器**：全部成员都是 `static`，没有实例字段、
 * 没有构造函数、没有继承、没有 `this`。按项目「数据定义 + 纯函数」的定案形态
 * （`AGENTS.md` §11.1 / `docs/MATH_PURE_FUNCTIONS_MIGRATION.md` §3.1），
 * 这种容器拆成模块级函数即可，不需要 tagged union + 分发。
 *
 * 操作数全是 `number` 这类**值类型**，所以没有 `XxxLike` / `WritableXxxLike` 形状问题，
 * 也没有 `out` 参数——签名与原 `static` 方法逐一对应（除下面两处有意的合并）。
 *
 * ## 两处有意的合并（方案 §3.3「同义合并」）
 *
 * 1. `SmoothDamp` / `SmoothDamp1` / `SmoothDamp2` **三个重载只差默认实参**
 *    （`SmoothDamp1` 的 `maxSpeed = Infinity`、`SmoothDamp2` 的 `deltaTime = Time.deltaTime`），
 *    所以纯函数层只保留一个**参数齐全**的 `mathfSmoothDamp`——与 `vec3SmoothDamp` / `vec2SmoothDamp`
 *    已经落地的做法逐字同构；
 * 2. `SmoothDampAngle` / `SmoothDampAngle1` / `SmoothDampAngle2` 同理，合并为 `mathfSmoothDampAngle`。
 *
 * ## 与 `Time` 的关系（本批的重要产出）
 *
 * 原 `SmoothDamp*` / `SmoothDampAngle*` 会隐式读全局 `Time.deltaTime`，而 `Time` 的**每一个**
 * getter 实现都是 `throw '未实现'`——也就是说这 6 个方法**一旦调用就抛异常**，从未可用。
 * 方案 §3.5 已定案「math 纯函数层不接受隐式时间源，`deltaTime` 一律显式传参」，
 * 所以这里 `deltaTime` 是**必填形参**，`Time.ts` 随之删除（理由见方案 §8 与 §11.18）。
 *
 * ## 逐字保留的既有语义（含反直觉处）
 *
 * - 三角函数按**弧度**，不是度；
 * - `mathfLerp` 把 `t` 钳到 `[0,1]`，`mathfLerpUnclamped` 不钳——这是两者唯一的差别；
 * - `mathfSign(0) === 1`（`f >= 0 ? 1 : -1`），不是 `0`；
 * - `mathfMin([])` / `mathfMax([])` 返回 `0`（空数组直接短路，**不是** `Math.min()` 的 `Infinity`）；
 * - `mathfMin` / `mathfMax` 的 `NaN` 语义与 `Math.min` / `Math.max` 不同
 *   （`mathfMin(NaN, 5) === 5`、`Math.min(NaN, 5) === NaN`），所以 `vec3MinMathf` 等**不能**换成 `Math.min`；
 * - `mathfClamp(v, min, max)` 在 `min > max` 时不交换端点（与 `mathUtil.clamp` 不同）。
 */
import type { Vector2Like, WritableVector2Like } from './geom/vector2';

/**
 * Returns the sine of angle `f` in radians.
 */
export function mathfSin(f: number)
{
    return Math.sin(f);
}

/**
 * Returns the cosine of angle `f` in radians.
 */
export function mathfCos(f: number)
{
    return Math.cos(f);
}

// Returns the tangent of angle /f/ in radians.
export function mathfTan(f: number) { return Math.tan(f); }

// Returns the arc-sine of /f/ - the angle in radians whose sine is /f/.
export function mathfAsin(f: number) { return Math.asin(f); }

// Returns the arc-cosine of /f/ - the angle in radians whose cosine is /f/.
export function mathfAcos(f: number) { return Math.acos(f); }

// Returns the arc-tangent of /f/ - the angle in radians whose tangent is /f/.
export function mathfAtan(f: number) { return Math.atan(f); }

// Returns the angle in radians whose ::ref::Tan is @@y/x@@.
export function mathfAtan2(y: number, x: number) { return Math.atan2(y, x); }

// Returns square root of /f/.
export function mathfSqrt(f: number) { return Math.sqrt(f); }

// Returns the absolute value of /f/.
export function mathfAbs(f: number) { return Math.abs(f); }

/**
 * Returns the smallest of two or more values.
 *
 * **`NaN` 语义与 `Math.min` 不同**（`mathfMin(NaN, 5) === 5`）；空数组返回 `0`，不是 `Infinity`。
 */
export function mathfMin(a: number, b: number): number;
export function mathfMin(values: readonly number[]): number;
export function mathfMin(...args: [number, number] | [readonly number[]]): number
{
    const first = args[0];

    if (Array.isArray(first))
    {
        const values = first;
        const len = values.length;
        if (len === 0)
        {
            return 0;
        }
        let m = values[0];
        for (let i = 1; i < len; i++)
        {
            if (values[i] < m)
            { m = values[i]; }
        }

        return m;
    }
    const a = first as number;
    const b = args[1] as number;

    return a < b ? a : b;
}

/**
 * Returns largest of two or more values.
 *
 * **`NaN` 语义与 `Math.max` 不同**（`mathfMax(NaN, 5) === 5`）；空数组返回 `0`，不是 `-Infinity`。
 */
export function mathfMax(a: number, b: number): number;
export function mathfMax(values: readonly number[]): number;
export function mathfMax(...args: [number, number] | [readonly number[]]): number
{
    const first = args[0];

    if (Array.isArray(first))
    {
        const values = first;
        const len = values.length;
        if (len === 0)
        { return 0; }
        let m = values[0];
        for (let i = 1; i < len; i++)
        {
            if (values[i] > m)
            { m = values[i]; }
        }

        return m;
    }
    const a = first as number;
    const b = args[1] as number;

    return a > b ? a : b;
}

// Returns /f/ raised to power /p/.
export function mathfPow(f: number, p: number) { return Math.pow(f, p); }

// Returns e raised to the specified power.
export function mathfExp(power: number) { return Math.exp(power); }

// Returns the natural (base e) logarithm of a specified number.
export function mathfLog(f: number) { return Math.log(f); }

// Returns the base 10 logarithm of a specified number.
export function mathfLog10(f: number) { return Math.log10(f); }

// Returns the smallest integer greater to or equal to /f/.
export function mathfCeil(f: number) { return Math.ceil(f); }

// Returns the largest integer smaller to or equal to /f/.
export function mathfFloor(f: number) { return Math.floor(f); }

// Returns /f/ rounded to the nearest integer.
export function mathfRound(f: number) { return Math.round(f); }

// Returns the smallest integer greater to or equal to /f/.
export function mathfCeilToInt(f: number) { return Math.ceil(f); }

// Returns the largest integer smaller to or equal to /f/.
export function mathfFloorToInt(f: number) { return Math.floor(f); }

// Returns /f/ rounded to the nearest integer.
export function mathfRoundToInt(f: number) { return Math.round(f); }

// Returns the sign of /f/.
export function mathfSign(f: number) { return f >= 0 ? 1 : -1; }

// The infamous ''3.14159265358979...'' value (RO).
export const MATHF_PI = Math.PI;

// A representation of positive infinity (RO).
export const MATHF_INFINITY = Infinity;

// A representation of negative infinity (RO).
export const MATHF_NEGATIVE_INFINITY = -Infinity;

// Degrees-to-radians conversion constant (RO).
export const MATHF_DEG2RAD = MATHF_PI * 2 / 360;

// Radians-to-degrees conversion constant (RO).
export const MATHF_RAD2DEG = 1 / MATHF_DEG2RAD;

// We cannot round to more decimals than 15 according to docs for System.Math.Round.
const K_MAX_DECIMALS = 15;

// A tiny floating point value (RO).
export const MATHF_EPSILON = 1.401298e-45;

// Clamps a value between a minimum float and maximum float value.
export function mathfClamp(value: number, min: number, max: number)
{
    if (value < min)
    { value = min; }
    else if (value > max)
    { value = max; }

    return value;
}

// Clamps value between 0 and 1 and returns value
export function mathfClamp01(value: number)
{
    if (value < 0)
    { return 0; }
    else if (value > 1)
    { return 1; }

    return value;
}

// Interpolates between /a/ and /b/ by /t/. /t/ is clamped between 0 and 1.
export function mathfLerp(a: number, b: number, t: number)
{
    return a + (b - a) * mathfClamp01(t);
}

// Interpolates between /a/ and /b/ by /t/ without clamping the interpolant.
export function mathfLerpUnclamped(a: number, b: number, t: number)
{
    return a + (b - a) * t;
}

// Same as ::ref::Lerp but makes sure the values interpolate correctly when they wrap around 360 degrees.
export function mathfLerpAngle(a: number, b: number, t: number)
{
    let delta = mathfRepeat((b - a), 360);
    if (delta > 180)
    { delta -= 360; }

    return a + delta * mathfClamp01(t);
}

// Moves a value /current/ towards /target/.
export function mathfMoveTowards(current: number, target: number, maxDelta: number)
{
    if (mathfAbs(target - current) <= maxDelta)
    { return target; }

    return current + mathfSign(target - current) * maxDelta;
}

// Same as ::ref::MoveTowards but makes sure the values interpolate correctly when they wrap around 360 degrees.
export function mathfMoveTowardsAngle(current: number, target: number, maxDelta: number)
{
    const deltaAngle = mathfDeltaAngle(current, target);
    if (-maxDelta < deltaAngle && deltaAngle < maxDelta)
    { return target; }
    target = current + deltaAngle;

    return mathfMoveTowards(current, target, maxDelta);
}

// Interpolates between /min/ and /max/ with smoothing at the limits.
export function mathfSmoothStep(from: number, to: number, t: number)
{
    t = mathfClamp01(t);
    t = -2.0 * t * t * t + 3.0 * t * t;

    return to * t + from * (1 - t);
}

//* undocumented
export function mathfGamma(value: number, absmax: number, gamma: number)
{
    const negative = value < 0;
    const absval = mathfAbs(value);
    if (absval > absmax)
    { return negative ? -absval : absval; }

    const result = mathfPow(absval / absmax, gamma) * absmax;

    return negative ? -result : result;
}

// Compares two floating point values if they are similar.
export function mathfApproximately(a: number, b: number)
{
    // If a or b is zero, compare that the other is less or equal to epsilon.
    // If neither a or b are 0, then find an epsilon that is good for
    // comparing numbers at the maximum magnitude of a and b.
    // Floating points have about 7 significant digits, so
    // 1.000001f can be represented while 1.0000001f is rounded to zero,
    // thus we could use an epsilon of 0.000001f for comparing values close to 1.
    // We multiply this epsilon by the biggest magnitude of a and b.
    return mathfAbs(b - a) < mathfMax(0.000001 * mathfMax(mathfAbs(a), mathfAbs(b)), MATHF_EPSILON * 8);
}

/**
 * Gradually changes a value towards a desired goal over time.
 *
 * `SmoothDamp` / `SmoothDamp1` / `SmoothDamp2` 三个重载合并后的纯函数形式（见文件头「两处有意的合并」）。
 *
 * ★ **签名变更（删 class 才可能发生，方案 §3.5 的定案）**：原 `SmoothDamp*` 隐式读全局
 * `Time.deltaTime`（那是个 `throw '未实现'` 的骨架，所以原方法**调用即抛**），
 * 这里 `deltaTime` 是**必填形参**；`maxSpeed` 也不再默认 `Infinity`——
 * 「默认值属于原方法签名」在合并三个重载时无法同时保留，调用方按需显式传 `MATHF_INFINITY`。
 *
 * @param current 当前值
 * @param target 目标值
 * @param currentVelocity 当前速度
 * @param smoothTime 逼近时间（内部夹到 >= 0.0001）
 * @param maxSpeed 最大速度
 * @param deltaTime 帧间隔（必须显式传入，见上）
 */
export function mathfSmoothDamp(current: number, target: number, currentVelocity: number, smoothTime: number, maxSpeed: number, deltaTime: number)
{
    // Based on Game Programming Gems 4 Chapter 1.10
    smoothTime = mathfMax(0.0001, smoothTime);
    const omega = 2 / smoothTime;

    const x = omega * deltaTime;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    let change = current - target;
    const originalTo = target;

    // Clamp maximum speed
    const maxChange = maxSpeed * smoothTime;
    change = mathfClamp(change, -maxChange, maxChange);
    target = current - change;

    const temp = (currentVelocity + omega * change) * deltaTime;
    currentVelocity = (currentVelocity - omega * temp) * exp;
    let output = target + (change + temp) * exp;

    // Prevent overshooting
    if (originalTo - current > 0.0 === output > originalTo)
    {
        output = originalTo;
        currentVelocity = (output - originalTo) / deltaTime;
    }

    return output;
}

/**
 * Gradually changes an angle given in degrees towards a desired goal angle over time.
 *
 * `SmoothDampAngle` / `SmoothDampAngle1` / `SmoothDampAngle2` 三个重载合并后的纯函数形式；
 * `deltaTime` 必填的理由同 `mathfSmoothDamp`。
 */
export function mathfSmoothDampAngle(current: number, target: number, currentVelocity: number, smoothTime: number, maxSpeed: number, deltaTime: number)
{
    target = current + mathfDeltaAngle(current, target);

    return mathfSmoothDamp(current, target, currentVelocity, smoothTime, maxSpeed, deltaTime);
}

// Loops the value t, so that it is never larger than length and never smaller than 0.
export function mathfRepeat(t: number, length: number)
{
    return mathfClamp(t - mathfFloor(t / length) * length, 0.0, length);
}

// PingPongs the value t, so that it is never larger than length and never smaller than 0.
export function mathfPingPong(t: number, length: number)
{
    t = mathfRepeat(t, length * 2);

    return length - mathfAbs(t - length);
}

// Calculates the ::ref::Lerp parameter between of two values.
export function mathfInverseLerp(a: number, b: number, value: number)
{
    if (a !== b)
    {
        return mathfClamp01((value - a) / (b - a));
    }

    return 0.0;
}

// Calculates the shortest difference between two given angles.
export function mathfDeltaAngle(current: number, target: number)
{
    let delta = mathfRepeat((target - current), 360.0);
    if (delta > 180.0)
    { delta -= 360.0; }

    return delta;
}

/**
 * Infinite Line Intersection (line1 is p1-p2 and line2 is p3-p4)
 *
 * 阶段 C-f：`Vector2` 的 class 已删除，四个点放宽为只读形状 `Vector2Like`，
 * 输出桶 `result` 用可写形状 `WritableVector2Like`（本函数只写 x / y 两个分量）。
 */
export function mathfLineIntersection(p1: Vector2Like, p2: Vector2Like, p3: Vector2Like, p4: Vector2Like, result: WritableVector2Like)
{
    const bx = p2.x - p1.x;
    const by = p2.y - p1.y;
    const dx = p4.x - p3.x;
    const dy = p4.y - p3.y;
    const bDotDPerp = bx * dy - by * dx;
    if (bDotDPerp === 0)
    {
        return false;
    }
    const cx = p3.x - p1.x;
    const cy = p3.y - p1.y;
    const t = (cx * dy - cy * dx) / bDotDPerp;

    result.x = p1.x + t * bx;
    result.y = p1.y + t * by;

    return true;
}

/**
 * Line Segment Intersection (line1 is p1-p2 and line2 is p3-p4)
 *
 * 阶段 C-f：形参放宽的理由同 `mathfLineIntersection`。
 */
export function mathfLineSegmentIntersection(p1: Vector2Like, p2: Vector2Like, p3: Vector2Like, p4: Vector2Like, result: WritableVector2Like)
{
    const bx = p2.x - p1.x;
    const by = p2.y - p1.y;
    const dx = p4.x - p3.x;
    const dy = p4.y - p3.y;
    const bDotDPerp = bx * dy - by * dx;
    if (bDotDPerp === 0)
    {
        return false;
    }
    const cx = p3.x - p1.x;
    const cy = p3.y - p1.y;
    const t = (cx * dy - cy * dx) / bDotDPerp;
    if (t < 0 || t > 1)
    {
        return false;
    }
    const u = (cx * by - cy * bx) / bDotDPerp;
    if (u < 0 || u > 1)
    {
        return false;
    }

    result.x = p1.x + t * bx;
    result.y = p1.y + t * by;

    return true;
}

// 原 class 里被注释掉的 RandomToLong / ClampToFloat / ClampToInt / RoundBasedOnMinimumDifference
// 系列在此不再保留——它们全在注释里、从未生效过，逐字搬运注释没有价值。

/**
 * 把 `value` 四舍五入到 `roundingValue` 的整数倍。
 *
 * `roundingValue === 0` 时原样返回（避免除零）。
 */
export function mathfRoundToMultipleOf(value: number, roundingValue: number)
{
    if (roundingValue === 0)
    {
        return value;
    }

    return mathfRound(value / roundingValue) * roundingValue;
}

/**
 * 获取不小于 0 的数最接近的 10 的幂（`positiveNumber <= 0` 时返回 `1`）。
 */
export function mathfGetClosestPowerOfTen(positiveNumber: number)
{
    if (positiveNumber <= 0)
    {
        return 1;
    }

    return mathfPow(10, mathfRoundToInt(mathfLog10(positiveNumber)));
}

/**
 * 按最小差值推算需要保留的小数位数（夹在 `[0, K_MAX_DECIMALS]`）。
 */
export function mathfGetNumberOfDecimalsForMinimumDifference(minDifference: number)
{
    return mathfClamp(-mathfFloorToInt(mathfLog10(mathfAbs(minDifference))), 0, K_MAX_DECIMALS);
}

/**
 * `mathfGetNumberOfDecimalsForMinimumDifference` 的下界更宽松的版本（不夹到 `K_MAX_DECIMALS`）。
 */
export function mathfGetNumberOfDecimalsForMinimumDifference1(minDifference: number)
{
    return Math.max(0.0, -Math.floor(Math.log10(Math.abs(minDifference))));
}
