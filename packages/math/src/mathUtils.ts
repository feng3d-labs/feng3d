/**
 * `@feng3d/math` 的标量数值工具集（**模块级纯函数**，不导出任何 class）。
 *
 * ## 这份文件是怎么来的（issue #134 收尾批：MathUtil ↔ Mathf 合并）
 *
 * 原先有**两份**功能重叠的标量工具：
 *
 * - `packages/polyfill/src/MathUtil.ts`：`class MathUtil` + 模块级单例 `mathUtil`（three.js 命名）；
 * - `packages/math/src/MathF.ts`：`class Mathf`，成员全是 `static`（Unity 命名）。
 *
 * 两者都提供 `clamp` / `lerp` / 平滑插值 / 浮点判等这一类方法，属「同一件事写了两遍」。
 * 本批把 `MathUtil` 从 `polyfill` 迁进 `math` 后，**合并成这一处**：
 *
 * - **命名统一到 camelCase**（AGENTS.md §5：函数 / 变量用 camelCase，类才用 PascalCase）——
 *   原先 `mathUtil.clamp` 与 `Mathf.Clamp` 同义不同名，合并后只剩 `clamp`；
 * - **删除全部「对原生 `Math.*` 的纯转发」**（`Mathf.Tan` / `Sin` / `Cos` / `Sqrt` / `Round` …，
 *   逐个判定语义是否与原生一致后才删，见文件末尾的删留清单）；
 * - **删除无任何消费方的方法**（`Mathf` 侧的 `gamma` / `approximately` / `smoothDamp*` /
 *   `lineIntersection` / `repeat` / `pingPong` / `inverseLerp` / `deltaAngle` / `moveTowards` /
 *   `roundToMultipleOf` / `getClosestPowerOfTen` / …，以及 `MathUtil` 侧的 `toRound` /
 *   `isPowerOfTwo` / `nearestPowerOfTwo` / `nextPowerOfTwo` —— 全仓 0 调用，属死代码）；
 * - **`Mathf` 这个 `class` 随之消失**，`math` 里不再有它。
 *
 * ## 刻意保留的「成对」语义（不要按名字合并！）
 *
 * 合并时最容易踩的坑是「看起来一样就统一」，本项目已实测过一对：
 *
 * | 场景 | 行为 |
 * |---|---|
 * | `clamp(100, 10, 0)`（本文件的 `clamp`） | 返回 `10`——越界时取「离 value 更近的一端」（无序区间） |
 * | `Math.min(Math.max(100, 10), 0)`（`Mathf.Clamp` 的等价写法） | 返回 `0`——把 `(min, max)` 当成「有序下上界」 |
 * | `clamp(NaN, 0, 10)` | 返回 `10`（不传播 `NaN`） |
 * | `clamp01(NaN)` | 返回 `NaN`（传播） |
 * | `min(NaN, 5)` / `max(NaN, 5)` | 返回 `5`；而 `Math.min` / `Math.max` 返回 `NaN` |
 * | `sign(0)` | 返回 `1`；而 `Math.sign(0)` 返回 `0` |
 *
 * 所以合并后**同时**保留 `clamp`（原 `MathUtil.clamp`）与 `clamp01`（原 `Mathf.Clamp01`），
 * 并在各自 JSDoc 里写明差异；`min` / `max`（原 `Mathf.Min` / `Mathf.Max` 的 `a < b ? a : b` 语义）
 * 也与原生 `Math.min` / `Math.max` 的 `NaN` 传播行为不同，同样单独保留。
 * `vector2Ops.ts` 的 `vec2LerpClamped` 正是靠这条差异保持原 `Vector2.Lerp` 的行为。
 * 这些差异在 `packages/math/test/mathUtils.spec.ts` 里逐条钉住。
 */

/** 角度转弧度因子（原 `mathUtil.DEG2RAD`）。 */
export const DEG2RAD = Math.PI / 180;

/** 弧度转角度因子（原 `mathUtil.RAD2DEG`）。 */
export const RAD2DEG = 180 / Math.PI;

/** 浮点判等的默认精度（原 `mathUtil.PRECISION`）。 */
export const PRECISION = 1e-6;

/**
 * 生成一个 UUID（36 字符，第 15 位固定为 `4`、第 20 位取变体位）。
 *
 * 原名 `mathUtil.uuid`（`MathUtil` 的实例字段）。合并时改名 `newUuid`：
 * `packages/feng3d/src/utils/Uuid.ts` 已导出 `uuid` 单例，`feng3d` 的聚合桶会把两者并到
 * 同一命名空间，同名会**静默遮蔽**（后者胜出）——改个明确的名字比赌导出顺序可靠。
 *
 * @see http://www.broofa.com/Tools/Math.uuid.htm
 */
export function newUuid(length = 36): string
{
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    const id = new Array<string>(length);
    let rnd = 0;
    let r = 0;

    for (let i = 0; i < length; i++)
    {
        if (i === 8 || i === 13 || i === 18 || i === 23)
        {
            id[i] = '-';
        }
        else if (i === 14)
        {
            id[i] = '4';
        }
        else
        {
            if (rnd <= 0x02) rnd = 0x2000000 + ((Math.random() * 0x1000000) | 0);
            r = rnd & 0xf;
            rnd = rnd >> 4;
            id[i] = chars[(i === 19) ? ((r & 0x3) | 0x8) : r];
        }
    }

    return id.join('');
}

/**
 * 把 `value` **夹紧**到区间 `[lowerlimit, upperlimit]`。
 *
 * 原 `MathUtil.clamp`。两个与直觉不同的既有行为（有意保留，改前先看 `vector2Ops.ts`）：
 *
 * 1. **越界时取「离 `value` 更近的那一端」**（而不是「有序上下界」语义）：在「两端与 `value`
 *    的距离相等」或 `value` 为 `NaN` 这类无法比较的情况下，返回的是**两个限值中较大的那个**——
 *    例如 `clamp(100, 10, 0)` 返回 `10`、`clamp(NaN, 0, 1)` 返回 `1`、`clamp(NaN, 10, 0)` 返回 `10`；
 *    而 `Math.min(Math.max(100, 10), 0)` 返回 `0`——后者把参数当成「有序的下界 / 上界」，
 *    语义不同（`Mathf.Clamp` 就是后者，合并时已在调用点就地展开）；
 * 2. **`NaN` 不传播**：`value` 为 `NaN` 时不会返回 `NaN`，而是走上面那条兜底（见 1）。
 *
 * @param value 指定值
 * @param lowerlimit 区间下界
 * @param upperlimit 区间上界
 */
export function clamp(value: number, lowerlimit: number, upperlimit: number): number
{
    if ((value - lowerlimit) * (value - upperlimit) <= 0) return value;
    if (value < lowerlimit) return lowerlimit < upperlimit ? lowerlimit : upperlimit;

    return lowerlimit > upperlimit ? lowerlimit : upperlimit;
}

/**
 * 把 `value` 夹紧到 `[0, 1]`。
 *
 * 原 `Mathf.Clamp01`（`Mathf.Clamp` 的 0/1 特化）。**与 `clamp(value, 0, 1)` 不同**：
 * `NaN` 在这里**传播**（`value < 0` 与 `value > 1` 对 `NaN` 都为假 → 原样返回 `NaN`），
 * 而 `clamp` 会返回 `1`。
 */
export function clamp01(value: number): number
{
    if (value < 0) return 0;
    if (value > 1) return 1;

    return value;
}

/**
 * 计算欧几里得模（结果恒与除数同号）：`((n % m) + m) % m`。
 *
 * 原 `MathUtil.uclideanModulo`。与 `%` 的差异只在负数：`-1 % 3 === -1`，本函数返回 `2`。
 *
 * @see https://en.wikipedia.org/wiki/Modulo_operation
 */
export function uclideanModulo(n: number, m: number): number
{
    return ((n % m) + m) % m;
}

/**
 * 把 `x` 从区间 `<a1, a2>` 线性映射到区间 `<b1, b2>`。
 *
 * 原 `MathUtil.mapLinear`。两区间长度相等时退化为「平移 + 缩放」，不夹取结果。
 */
export function mapLinear(x: number, a1: number, a2: number, b1: number, b2: number): number
{
    return b1 + ((x - a1) * (b2 - b1)) / (a2 - a1);
}

/**
 * 线性插值（**不夹取** `t`）。
 *
 * 原 `MathUtil.lerp`。与 `lerpClamped` 的区别就在这里：`t` 超出 `[0, 1]` 时会外插。
 *
 * @see https://en.wikipedia.org/wiki/Linear_interpolation
 */
export function lerp(start: number, end: number, t: number): number
{
    return (1 - t) * start + (t * end);
}

/**
 * 线性插值并把 `t` 夹取到 `[0, 1]`。
 *
 * 原 `Mathf.Lerp`。注意夹取用的是 `clamp01`（`NaN` 传播），不是本文件的 `clamp`。
 */
export function lerpClamped(a: number, b: number, t: number): number
{
    return a + ((b - a) * clamp01(t));
}

/**
 * 计算平滑值 `3x² - 2x³`（把 `[edge0, edge1]` 归一化后套 smoothstep 权重，再插值回去）。
 *
 * 原 `MathUtil.smoothstep`（`x` 在区间外时直接返回 `0` / `1`）。
 * 形参名沿用 GLSL `smoothstep(edge0, edge1, x)` 的 `edge0` / `edge1`，
 * 而不是 `min` / `max`——后者会遮蔽本文件导出的 `min` / `max` 函数。
 *
 * @see http://en.wikipedia.org/wiki/Smoothstep
 */
export function smoothstep(x: number, edge0: number, edge1: number): number
{
    if (x <= edge0) return 0;
    if (x >= edge1) return 1;

    x = (x - edge0) / (edge1 - edge0);

    return x * x * (3 - (2 * x));
}

/**
 * 计算平滑值 `6x⁵ - 15x⁴ + 10x³`（smoothstep 的一阶导也连续）。
 *
 * 原 `MathUtil.smootherstep`。
 */
export function smootherstep(x: number, edge0: number, edge1: number): number
{
    if (x <= edge0) return 0;
    if (x >= edge1) return 1;

    x = (x - edge0) / (edge1 - edge0);

    return x * x * x * ((x * ((x * 6) - 15)) + 10);
}

/**
 * 从 `[low, high]` 取随机整数（**两端都含**）。
 *
 * 原 `MathUtil.randInt`。与原生无关：`Math.random()` 不提供整数区间。
 */
export function randInt(low: number, high: number): number
{
    return low + Math.floor(Math.random() * (high - low + 1));
}

/**
 * 从 `[low, high)` 取随机浮点数。
 *
 * 原 `MathUtil.randFloat`。
 */
export function randFloat(low: number, high: number): number
{
    return low + (Math.random() * (high - low));
}

/**
 * 从 `[-range/2, range/2)` 取随机浮点数。
 *
 * 原 `MathUtil.randFloatSpread`。
 */
export function randFloatSpread(range: number): number
{
    return range * (0.5 - Math.random());
}

/**
 * 角度转弧度。
 *
 * 原 `MathUtil.degToRad` / `Mathf.Deg2Rad`（后者是常量，前者是函数；合并后**只留函数**，
 * 常量仍是本文件的 `DEG2RAD`——两者关系为 `degToRad(d) === d * DEG2RAD`）。
 */
export function degToRad(degrees: number): number
{
    return degrees * DEG2RAD;
}

/**
 * 弧度转角度。
 *
 * 原 `MathUtil.radToDeg` / `Mathf.Rad2Deg`（常量），关系同 `degToRad`。
 */
export function radToDeg(radians: number): number
{
    return radians * RAD2DEG;
}

/**
 * 取符号：非负返回 `1`、负返回 `-1`。
 *
 * 原 `Mathf.Sign`（实现是 `f >= 0 ? 1 : -1`）。**刻意不用原生 `Math.sign`**：
 * `Math.sign(0) === 0`、`Math.sign(-0) === -0`，对 `NaN` 返回 `NaN`；
 * 本函数把 `0` / `-0` 归到 `1`，把 `NaN` 归到 `-1`（`NaN >= 0` 为假）。
 * `vec3SignedAngle` 的符号判定依赖这一支。
 */
export function sign(f: number): number
{
    return f >= 0 ? 1 : -1;
}

/**
 * 取两值中**较小**者，`NaN` 不传播：`min(NaN, 5)` 返回 `5`。
 *
 * 原 `Mathf.Min`（实现是 `a < b ? a : b`）。**刻意与原生 `Math.min` 并存**：
 * `Math.min(NaN, 5)` 返回 `NaN`——两者 NaN 语义不同，本项目曾为此保留两套名字
 * （`vec3Min` 用 `Math.min`、`vec3MinMathf` 用本函数，见 `vector3Ops.ts` 的注释）。
 */
export function min(a: number, b: number): number
{
    return a < b ? a : b;
}

/**
 * 取两值中**较大**者，`NaN` 不传播：`max(NaN, 5)` 返回 `5`。
 *
 * 原 `Mathf.Max`，理由见 `min`。
 */
export function max(a: number, b: number): number
{
    return a > b ? a : b;
}

/**
 * 浮点判等（**绝对**误差）：`|a - b| < precision`。
 *
 * 原 `MathUtil.equals`。与 `Mathf.Approximately` 不同——后者是**相对**误差
 * （`|b - a| < max(1e-6 * max(|a|, |b|), Epsilon * 8)`），对极大值更宽容、对极小值更严格。
 * 合并时保留了这一支，因为它在全仓有 67 处消费方（判等精度统一走 `PRECISION`）。
 */
export function equals(a: number, b: number, precision = PRECISION): boolean
{
    return Math.abs(a - b) < precision;
}

/**
 * 求两数的最大公约数。
 *
 * 原 `MathUtil.gcd`。
 *
 * @see https://en.wikipedia.org/wiki/Greatest_common_divisor
 */
export function gcd(a: number, b: number): number
{
    // eslint-disable-next-line no-empty
    if (b) while ((a %= b) && (b %= a)) { }

    return a + b;
}

/**
 * 求两数的最小公倍数。
 *
 * 原 `MathUtil.lcm`。
 *
 * @see https://en.wikipedia.org/wiki/Least_common_multiple
 */
export function lcm(a: number, b: number): number
{
    return (a * b) / gcd(a, b);
}

/*
 * ---------------------------------------------------------------------------
 * 合并时**删掉**的成员（原 `MathF.ts` / `MathUtil.ts`），逐个列出依据，便于回溯：
 *
 * A. 「对原生 `Math.*` 的纯转发、语义逐字一致」——删掉，消费方直接调 `Math.*`：
 *    `Sin` / `Cos` / `Tan` / `Asin` / `Acos` / `Atan` / `Atan2` / `Sqrt` / `Abs` /
 *    `Pow` / `Exp` / `Log` / `Log10` / `Ceil` / `Floor` / `Round` / `CeilToInt` /
 *    `FloorToInt` / `RoundToInt` / `PI` / `Infinity` / `NegativeInfinity`。
 *    （`CeilToInt` 等三个名字里有「ToInt」但实现就是 `Math.ceil/floor/round`，并不真的取整成
 *      int——名字误导，删掉比留着好。）
 *
 * B. 「原生没有、但全仓 0 消费方」——删掉（死代码）：
 *    `Gamma` / `Approximately`（相对误差判等，本仓判等统一走 `equals`）/
 *    `SmoothDamp` / `SmoothDamp1` / `SmoothDamp2` / `SmoothDampAngle` /
 *    `SmoothDampAngle1` / `SmoothDampAngle2`（隐式读 `Time.deltaTime`，与「纯函数」冲突）/
 *    `Repeat` / `PingPong` / `InverseLerp` / `DeltaAngle` / `MoveTowards` / `MoveTowardsAngle` /
 *    `SmoothStep`（`(from, to, t)` 三参形态，与本文件 `smoothstep(x, edge0, edge1)` 参数序不同，
 *    为避免「同名不同义」没有一并搬过来）/
 *    `RoundToMultipleOf` / `GetClosestPowerOfTen` / `GetNumberOfDecimalsForMinimumDifference` /
 *    `GetNumberOfDecimalsForMinimumDifference1` / `LineIntersection` / `LineSegmentIntersection`；
 *    `MathUtil` 侧的 `toRound` / `isPowerOfTwo` / `nearestPowerOfTwo` / `nextPowerOfTwo`。
 *
 * C. **保留**但改名 / 拆分的（差异见各函数 JSDoc）：
 *    `Mathf.Clamp01` → `clamp01`（与本文件 `clamp` 语义不同，两者都留）；
 *    `Mathf.Min` / `Max` → `min` / `max`（与原生 `NaN` 语义不同，都留）；
 *    `Mathf.Sign` → `sign`（与 `Math.sign` 不同）；
 *    `Mathf.Lerp` → `lerpClamped`（原 `MathUtil.lerp` 不夹取 `t`，也留为 `lerp`）；
 *    `Mathf.Deg2Rad` / `Rad2Deg` → 常量 `DEG2RAD` / `RAD2DEG`（另有 `degToRad` / `radToDeg` 函数）；
 *    `mathUtil.uuid` → `newUuid`（避开 `feng3d` 聚合桶里已有的 `uuid`）；
 *    `mathUtil.DefaultRotationOrder` → `enums/RotationOrder.ts` 的 `DEFAULT_ROTATION_ORDER` 常量。
 * ---------------------------------------------------------------------------
 */
