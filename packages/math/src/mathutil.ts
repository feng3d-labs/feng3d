/**
 * `MathUtil` 的纯函数形态（**模块级函数 + 模块级常量**，不导出 class）。
 *
 * ## 位置与来由（issue #134 收尾批）
 *
 * 本文件原先住在 `packages/polyfill/src/MathUtil.ts`，形态是 `class MathUtil` + 模块级单例
 * `const mathUtil = new MathUtil()`（three.js 命名）。两件事在本批一起做掉：
 *
 * 1. **迁入 `@feng3d/math`**：`polyfill` 是分层里的地基包，数值工具属 `math` 的职责，
 *    且 `polyfill` 内部**从未使用** `MathUtil`（只有 `index.ts` 的 `export *` 把它转出）；
 * 2. **纯函数化**：全部成员改成模块级函数 / 常量，模块级单例消失——这正是 R2 关心的
 *    「模块级 `new` + 顶层副作用」形态（原基线里那条 `polyfill/src/MathUtil.ts::MathUtil`）。
 *
 * ## 命名：为什么全部加 `mathUtil` 前缀
 *
 * `math` 包里已经有 `mathf.ts`（原 `Mathf` 的纯函数形态，见该文件），两者的成员**大量同名**：
 * `clamp` / `clamp01` / `lerp` / `min` / `max` / `sign` / `Deg2Rad` / `Rad2Deg` …。
 * 加前缀是为了让「同名不同义」在调用点一眼可见（本项目实测过这类坑，见下）。两套的关系是：
 *
 * | 本文件（原 `MathUtil`，three.js 命名） | `mathf.ts`（原 `Mathf`，Unity 命名） |
 * |---|---|
 * | `mathUtilClamp(v, lowerlimit, upperlimit)`：**无序区间**，越界取「离 `v` 更近的一端」；`NaN` **不**传播 | `mathfClamp(v, min, max)`：**有序上下界**；`NaN` 传播 |
 * | `mathUtilClamp01`：`NaN` **传播** | `mathfClamp01`：`NaN` **传播**（同） |
 * | `mathUtilLerp(a, b, t)`：**不夹取** `t` | `mathfLerp` **夹取** `t` / `mathfLerpUnclamped` 不夹 |
 * | `mathUtilSmoothstep(x, edge0, edge1)`：归一化区间，`x` 越界直接给 0 / 1 | `mathfSmoothStep(from, to, t)`：from/to 线性插值 |
 * | `mathUtilEquals(a, b, precision)`：**绝对**误差 | `mathfApproximately(a, b)`：**相对**误差 |
 * | `mathUtilMin` / `mathUtilMax`：实现与 `mathfMin` / `mathfMax` **逐字相同**（`a < b ? a : b`）——本批**复用** `mathfMin` / `mathfMax`，不另立一份 | — |
 *
 * 合并它们的正确做法是「按语义归一」而不是「按名字归一」，那会静默改掉现有调用点的行为
 * （`vector2.ts` 的 `vec2LerpClamped` 明确依赖 `mathUtilClamp(NaN, 0, 1) === 1`，
 * 而 `mathfClamp01(NaN) === NaN`）。所以本批**只做迁移 + 纯函数化 + 前缀隔离**，
 * 「`mathf*` 与 `mathUtil*` 两套标量工具是否归一」留作后续专项（见 §11.18 的分批）。
 *
 * ## 与 `mathf.ts` 的 `mathf*` 前缀分工（不要互相替换）
 *
 * 上面表格里的每一行都是**语义差异**，不是命名风格差异。改调用点前先看对应的 spec：
 * `packages/math/test/mathutil.spec.ts`。
 *
 * ## 继承自原实现的反直觉语义（逐字保留，已用单测钉住）
 *
 * - `mathUtilClamp` **不要求区间有序**：`mathUtilClamp(100, 10, 0)` 返回 `10`、
 *   `mathfClamp(100, 10, 0)` 返回 `0`；
 * - `mathUtilClamp` **不传播 `NaN`**：`mathUtilClamp(NaN, 0, 10)` 返回 `10`（两个限值中较大的那个）；
 * - `mathUtilUclideanModulo` 与 `%` 只在负数上不同：`-1 % 3 === -1`，它返回 `2`；
 * - `mathUtilEquals` 是**绝对**误差，不随量级放大。
 */
import { MATHF_DEG2RAD, MATHF_RAD2DEG } from './mathf';

/** 角度转弧度因子。与 `mathf.ts` 的 `MATHF_DEG2RAD` **数值完全相同**，本文件直接复用同一常量（见 §11.18.4 建议 2：纯重复必须消掉）。 */
export const MATHUTIL_DEG2RAD = MATHF_DEG2RAD;

/** 弧度转角度因子。同上，复用 `MATHF_RAD2DEG`。 */
export const MATHUTIL_RAD2DEG = MATHF_RAD2DEG;

// 纯重复的常量只留一份：`mathf.ts` 的 `MATHF_*` 是唯一真源，这里重新导出以方便
// 「原 `mathUtil.DEG2RAD` / `RAD2DEG` 的消费点」就近取用（值完全相同，见 §11.18.4 建议 2）。
export { MATHF_DEG2RAD, MATHF_RAD2DEG };

/** 浮点判等的默认精度（原 `mathUtil.PRECISION`）。 */
export const MATHUTIL_PRECISION = 1e-6;

/**
 * 把 `value` **夹紧**到区间 `[lowerlimit, upperlimit]`（原 `mathUtil.clamp`）。
 *
 * 两个与 `mathfClamp` 不同的既有行为（有意保留）：
 *
 * 1. **越界时取「离 `value` 更近的那一端」**：在「两端与 `value` 距离相等」或 `value` 为 `NaN`
 *    这类无法比较时，返回**两个限值中较大的那个**——`mathUtilClamp(100, 10, 0)` 返回 `10`、
 *    `mathfClamp(100, 10, 0)` 返回 `0`；
 * 2. **`NaN` 不传播**：`mathUtilClamp(NaN, 0, 1)` 返回 `1`，而 `mathfClamp(NaN, 0, 1)` 返回 `NaN`。
 *
 * `vector2.ts` 的 `vec2LerpClamped` 依赖 `mathUtilClamp(NaN, 0, 1) === 1`（原 `Vector2.Lerp` 的行为）。
 *
 * @param value 指定值
 * @param lowerlimit 区间下界
 * @param upperlimit 区间上界
 */
export function mathUtilClamp(value: number, lowerlimit: number, upperlimit: number): number
{
    if ((value - lowerlimit) * (value - upperlimit) <= 0) return value;
    if (value < lowerlimit) return lowerlimit < upperlimit ? lowerlimit : upperlimit;

    return lowerlimit > upperlimit ? lowerlimit : upperlimit;
}

/**
 * 计算欧几里得模（结果恒与除数同号）：`((n % m) + m) % m`（原 `mathUtil.uclideanModulo`）。
 *
 * 与 `%` 的差异只在负数：`-1 % 3 === -1`，本函数返回 `2`。
 *
 * @see https://en.wikipedia.org/wiki/Modulo_operation
 */
export function mathUtilUclideanModulo(n: number, m: number): number
{
    return ((n % m) + m) % m;
}

/**
 * 把 `x` 从区间 `<a1, a2>` 线性映射到区间 `<b1, b2>`（原 `mathUtil.mapLinear`）。
 *
 * 两区间长度相等时退化为「平移 + 缩放」，不夹取结果。
 */
export function mathUtilMapLinear(x: number, a1: number, a2: number, b1: number, b2: number): number
{
    return b1 + ((x - a1) * (b2 - b1)) / (a2 - a1);
}

/**
 * 线性插值，**不夹取** `t`（原 `mathUtil.lerp`）。
 *
 * 与 `mathfLerpUnclamped` 语义相同；`mathfLerp` 会夹取 `t`，`mathfLerpAngle` 另算角度差。
 *
 * @see https://en.wikipedia.org/wiki/Linear_interpolation
 */
export function mathUtilLerp(start: number, end: number, t: number): number
{
    return (1 - t) * start + (t * end);
}

/**
 * 计算平滑值 `3x² - 2x³`（把 `[edge0, edge1]` 归一化后套权重再插值回去，原 `mathUtil.smoothstep`）。
 *
 * `x` 落在区间外时直接返回 `0` / `1`。形参名沿用 GLSL `smoothstep(edge0, edge1, x)`。
 * 注意与 `mathfSmoothStep(from, to, t)` **不是**同一个函数：后者的 `t` 是已归一化的插值系数。
 *
 * @see http://en.wikipedia.org/wiki/Smoothstep
 */
export function mathUtilSmoothstep(x: number, edge0: number, edge1: number): number
{
    if (x <= edge0) return 0;
    if (x >= edge1) return 1;

    x = (x - edge0) / (edge1 - edge0);

    return x * x * (3 - (2 * x));
}

/**
 * 计算平滑值 `6x⁵ - 15x⁴ + 10x³`（smoothstep 的一阶导也连续，原 `mathUtil.smootherstep`）。
 */
export function mathUtilSmootherstep(x: number, edge0: number, edge1: number): number
{
    if (x <= edge0) return 0;
    if (x >= edge1) return 1;

    x = (x - edge0) / (edge1 - edge0);

    return x * x * x * ((x * ((x * 6) - 15)) + 10);
}

/**
 * 从 `[low, high]` 取随机整数（**两端都含**，原 `mathUtil.randInt`）。
 */
export function mathUtilRandInt(low: number, high: number): number
{
    return low + Math.floor(Math.random() * (high - low + 1));
}

/**
 * 从 `[low, high)` 取随机浮点数（原 `mathUtil.randFloat`）。
 */
export function mathUtilRandFloat(low: number, high: number): number
{
    return low + (Math.random() * (high - low));
}

/**
 * 从 `[-range/2, range/2)` 取随机浮点数（原 `mathUtil.randFloatSpread`）。
 */
export function mathUtilRandFloatSpread(range: number): number
{
    return range * (0.5 - Math.random());
}

/**
 * 角度转弧度（原 `mathUtil.degToRad`）。与常量 `MATHUTIL_DEG2RAD` 的关系是 `f(d) === d * MATHUTIL_DEG2RAD`。
 */
export function mathUtilDegToRad(degrees: number): number
{
    return degrees * MATHUTIL_DEG2RAD;
}

/**
 * 弧度转角度（原 `mathUtil.radToDeg`），关系同 `mathUtilDegToRad`。
 */
export function mathUtilRadToDeg(radians: number): number
{
    return radians * MATHUTIL_RAD2DEG;
}

/**
 * 浮点判等（**绝对**误差）：`|a - b| < precision`（原 `mathUtil.equals`）。
 *
 * 与 `mathfApproximately` 不同——后者是**相对**误差
 * （`|b - a| < max(1e-6 * max(|a|, |b|), Epsilon * 8)`），对极大值更宽容、对极小值更严格。
 * 本函数是全仓判等的主力（原 67 处消费点）。
 */
export function mathUtilEquals(a: number, b: number, precision = MATHUTIL_PRECISION): boolean
{
    return Math.abs(a - b) < precision;
}

/**
 * 求两数的最大公约数（原 `mathUtil.gcd`）。
 *
 * @see https://en.wikipedia.org/wiki/Greatest_common_divisor
 */
export function mathUtilGcd(a: number, b: number): number
{
    // eslint-disable-next-line no-empty
    if (b) while ((a %= b) && (b %= a)) { }

    return a + b;
}

/**
 * 求两数的最小公倍数（原 `mathUtil.lcm`）。
 *
 * @see https://en.wikipedia.org/wiki/Least_common_multiple
 */
export function mathUtilLcm(a: number, b: number): number
{
    return (a * b) / mathUtilGcd(a, b);
}

/**
 * 生成一个 UUID（36 字符，第 15 位固定为 `4`、第 20 位取变体位）。
 *
 * 原名 `mathUtil.uuid`。加后缀 `NewUuid` 是为了与 `packages/feng3d/src/utils/Uuid.ts` 导出的
 * `uuid` 单例区分——`feng3d` 的聚合桶会把两者并到同一命名空间，同名会**静默遮蔽**。
 *
 * @see http://www.broofa.com/Tools/Math.uuid.htm
 */
export function mathUtilNewUuid(length = 36): string
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

/*
 * ---------------------------------------------------------------------------
 * 迁移时**删掉**的成员（原 `MathUtil` 的实例方法），依据如下：
 *
 * A. 与 `mathf.ts` **逐字重复**且已有消费方的：`min` / `max`（`a < b ? a : b`）与
 *    `mathfMin` / `mathfMax` 实现完全相同，所以 `vector2/3/4.ts` 与 `vec3MinMathf` /
 *    `vec4Min` 等调用点**直接复用 `mathfMin` / `mathfMax`**，本文件不再另立一份。
 *
 * B. **全仓 0 消费方**（死代码），删除：
 *    `toRound` / `isPowerOfTwo` / `nearestPowerOfTwo` / `nextPowerOfTwo`。
 *    （`gcd` / `lcm` / `uclideanModulo` / `smootherstep` / `randFloat` / `randFloatSpread` /
 *      `degToRad` / `radToDeg` 同样 0 消费方，但它们是**语义唯一**的实现——原生与 `mathf.ts`
 *      都没有等价物——所以保留为 `mathUtil*` 供后续使用。而 `toRound` 与
 *      `mathfRoundToMultipleOf` 语义高度接近，留着就是两份近似实现，故随死代码一并删除。）
 *
 * C. 常量侧：原 `DEG2RAD` / `RAD2DEG` / `PRECISION` 三个实例字段 →
 *    `MATHUTIL_DEG2RAD` / `MATHUTIL_RAD2DEG` / `MATHUTIL_PRECISION`；
 *    原 `DefaultRotationOrder`（可写字段）→ `enums/RotationOrder.ts` 的
 *    `DEFAULT_ROTATION_ORDER` 导出常量（全仓 22 处消费点全是读取、无一处写入）。
 * ---------------------------------------------------------------------------
 */
