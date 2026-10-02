import { mathUtil } from '@feng3d/polyfill';
import { Mathf } from '../MathF';
import { Time } from '../Time';
import { Vector } from './Vector';
import { Vector3 } from './Vector3';
import {
    VEC2_EPSILON,
    VEC2_EPSILON_NORMAL_SQRT,
    vec2Add,
    vec2Angle,
    vec2Clamp,
    vec2ClampMagnitude,
    vec2Copy,
    vec2Cross,
    vec2Distance,
    vec2DistanceSquared,
    vec2Divide,
    vec2Dot,
    vec2Equals,
    vec2From,
    vec2Length,
    vec2LengthSquared,
    vec2Lerp,
    vec2LerpClamped,
    vec2LerpNumber,
    vec2Max,
    vec2Min,
    vec2Multiply,
    vec2Negate,
    vec2Normalize,
    vec2Offset,
    vec2Perpendicular,
    vec2Polar,
    vec2Random,
    vec2Reciprocal,
    vec2Reflect,
    vec2Round,
    vec2Scale,
    vec2ScaleNumber,
    vec2SignedAngle,
    vec2Sub,
    vec2ToArray,
    vec2ToString,
} from './vector2Ops';

/**
 * Representation of 2D vectors and points.
 */
/**
 * 二维向量和点的表示。
 *
 * 运算已抽出为纯函数层（issue #134 阶段 A2e，见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md`）：
 * 方法体一律转发到 `./vector2Ops`，`out` 传 `this` 即保留就地语义。
 * 少数成员**有意未委托**（`MoveTowards` / `Min` / `Max` / `SmoothDamp*`），各自在原处注明了原因。
 */
export class Vector2 implements Vector
{

    /**
     * X component of the vector.
     */
    /**
     * 向量的X分量。
     */
    x: number;

    /**
     * Y component of the vector.
     */
    /**
     * 向量的Y分量。
     */
    y: number;

    /**
     * The length of this vector.
     */
    /**
     * 向量的长度。
     */
    get length(): number
    {
        return vec2Length(this);
    }

    /**
     * The squared length of this vector.
     */
    /**
     * 向量长度的平方。
     */
    get lengthSquared(): number
    {
        return vec2LengthSquared(this);
    }

    /**
     * 生成一个随机向量（各分量 [0,1)）
     */
    static random()
    {
        const result = new Vector2();

        vec2Random(result);

        return result;
    }

    /**
     * 将当前向量初始化为随机值（修改 this 并返回）
     */
    random()
    {
        vec2Random(this);

        return this;
    }

    /**
     * The length of this vector.
     */
    /**
     * 向量的长度。
     */
    get magnitude()
    {
        return this.length;
    }

    /**
     * The squared length of this vector.
     */
    /**
     * 向量长度的平方。
     */
    get sqrMagnitude(): number
    {
        return vec2LengthSquared(this);
    }

    /**
     * 返回大小为 1 的此向量（只读）。
     *
     * 归一化后，向量保持相同的方向，但其长度为 1.0。
     *
     * 请注意，当前向量不变，并返回一个新的归一化向量。如果要对当前向量进行归一化，请使用Normalize函数。
     *
     * 如果向量太小而无法归一化，则将返回零向量。
     */
    /**
     * Returns this vector with a magnitude of 1 (Read Only).
     *
     * When normalized, a vector keeps the same direction but its length is 1.0.
     *
     * Note that the current vector is unchanged and a new normalized vector is returned. If you want to normalize the current vector, use Normalize function.
     *
     * If the vector is too small to be normalized a zero vector will be returned.
     */
    get normalized()
    {
        const v = new Vector2();

        vec2Normalize(this, v);

        return v;
    }

    /**
     * Constructs a new vector with given x, y components.
     *
     * @param x X component of the vector.
     * @param y Y component of the vector.
     */
    /**
     * 用给定的 x, y 分量构造一个新向量。
     *
     * @param x 向量的X分量。
     * @param y 向量的Y分量。
     */
    constructor(x = 0, y = 0)
    {
        this.x = x;
        this.y = y;
    }

    /**
     * Set x and y components of an existing Vector2.
     *
     * @param x The new X component of the vector
     * @param y The new Y component of the vector
     */
    /**
     * 设置现有Vector2的x和y分量。
     *
     * @param x 向量的新的X分量
     * @param y 向量的新的Y分量
     */
    set(x: number, y: number)
    {
        vec2From(x, y, this);

        return this;
    }

    /**
     * Determine if it is equal to the given vector.
     *
     * @param other the given vector.
     * @param precision comparative precision.
     * @returns Returns true if the given vector is exactly equal to this vector.
     */
    /**
     * 判断与给定向量是否相等。
     *
     * @param other 给定的向量。
     * @param precision 比较精度。
     * @returns 如果给定向量完全等于该向量，则返回 true。
     */
    equals(other: Vector2, precision = mathUtil.PRECISION)
    {
        return vec2Equals(this, other, precision);
    }

    /**
     * Makes this vector have a magnitude of 1.
     *
     * When normalized, a vector keeps the same direction but its length is 1.0.
     *
     * Note that this function will change the current vector. If you want to keep the current vector unchanged, use normalized variable.
     *
     * If this vector is too small to be normalized it will be set to zero.
     *
     */
    /**
     * 使该向量的大小为 1。
     *
     * 归一化后，向量保持相同的方向，但其长度为 1.0。
     *
     * 请注意，此函数将更改当前向量。如果要保持当前向量不变，请使用归一化变量。
     *
     * 如果这个向量太小而无法归一化，它将被设置为零。
     */
    normalize()
    {
        vec2Normalize(this, this);
    }

    /**
     * 克隆点对象
     */
    clone(): Vector2
    {
        const result = new Vector2();

        vec2Copy(this, result);

        return result;
    }

    /**
     * 返回此向量的格式化字符串。
     */
    /**
     * Returns a formatted string for this vector.
     */
    toString(): string
    {
        return vec2ToString(this);
    }

    /**
     * Shorthand for writing Vector2(0, 0).
     */
    /**
     * 零向量`Vector2(0, 0)`。
     */
    static readonly zero = Object.freeze(new Vector2());

    /**
     * Shorthand for writing Vector2(1, 1).
     */
    /**
     * 单元向量`Vector2(1, 1)`。
     */
    static readonly one = Object.freeze(new Vector2(1, 1));

    /**
     * Shorthand for writing Vector2(0, 1).
     */
    static readonly up = Object.freeze(new Vector2(0, 1));

    /**
     * Shorthand for writing Vector2(0, -1).
     */
    static readonly down = Object.freeze(new Vector2(0, -1));

    /**
     * Shorthand for writing Vector2(-1, 0).
     */
    static readonly left = Object.freeze(new Vector2(-1, 0));

    /**
     * Shorthand for writing Vector2(1, 0).
     */
    static readonly right = Object.freeze(new Vector2(1, 0));

    /**
     * Shorthand for writing Vector2(Infinity, Infinity).
     */
    static readonly positiveInfinity = Object.freeze(new Vector2(Infinity, Infinity));

    /**
     * Shorthand for writing Vector2(-Infinity, -Infinity).
     */
    static readonly negativeInfinity = Object.freeze(new Vector2(-Infinity, -Infinity));

    /**
     * 可允许误差。
     */
    static readonly kEpsilon = VEC2_EPSILON;

    /**
     * 可允许误差平方。
     */
    static readonly kEpsilonNormalSqrt = VEC2_EPSILON_NORMAL_SQRT;

    /**
     * Linearly interpolates between vectors a and b by t.
     *
     * The parameter t is clamped to the range [0, 1].
     *
     * When t = 0 returns a.
     * When t = 1 return b.
     * When t = 0.5 returns the midpoint of a and b.
     *
     * @param a Start point.
     * @param b End point.
     * @param t Interpolated coefficient.
     */
    /**
     * 返回起始向量`a`与终止向量`b`在`t`位置的线性插值。
     *
     * 参数`t`将被裁减到[0, 1]的范围内。
     *
     * 当 t = 0 时返回`a`.
     * 当 t = 1 时返回`b`.
     * 当 t = 0.5 时返回`a`与`b`的中间值.
     *
     * @param a 起始点。
     * @param b 终止点。
     * @param t 插值系数。
     */
    static Lerp(a: Vector2, b: Vector2, t: number)
    {
        const result = new Vector2();

        vec2LerpClamped(a, b, t, result);

        return result;
    }

    /**
     * Linearly interpolates between vectors a and b by t.
     *
     * When t = 0 returns a.
     * When t = 1 return b.
     * When t = 0.5 returns the midpoint of a and b.
     *
     * @param a Start point.
     * @param b End point.
     * @param t Interpolated coefficient.
     */
    /**
     * 返回起始向量`a`与终止向量`b`在`t`位置的线性插值。
     *
     * 当 t = 0 时返回`a`.
     * 当 t = 1 时返回`b`.
     * 当 t = 0.5 时返回`a`与`b`的中间值.
     *
     * @param a 起始点。
     * @param b 终止点。
     * @param t 插值系数。
     */
    static LerpUnclamped(a: Vector2, b: Vector2, t: number)
    {
        const result = new Vector2();

        vec2LerpNumber(a, b, t, result);

        return result;
    }

    // Moves a point /current/ towards /target/.
    //
    // 有意**未委托**给纯函数层：退化分支（已到目标）返回的是**入参 target 本身**（同一对象），
    // 而纯函数层的 `out` 约定写不出「返回入参」——硬套会让声明的返回类型从 `Vector2` 退化成
    // `Vector2Like`（公共 d.ts 里是 `Vector2`，属签名变更），故本步原样保留。
    static MoveTowards(current: Vector2, target: Vector2, maxDistanceDelta: number)
    {
        // avoid vector ops because current scripting backends are terrible at inlining
        const toVectorX = target.x - current.x;
        const toVectorY = target.y - current.y;

        const sqDist = toVectorX * toVectorX + toVectorY * toVectorY;

        if (sqDist === 0 || (maxDistanceDelta >= 0 && sqDist <= maxDistanceDelta * maxDistanceDelta))
        {
            return target;
        }

        const dist = Math.sqrt(sqDist);

        return new Vector2(current.x + toVectorX / dist * maxDistanceDelta,
            current.y + toVectorY / dist * maxDistanceDelta);
    }

    // Multiplies two vectors component-wise.
    static Scale(a: Vector2, b: Vector2)
    {
        const result = new Vector2();

        vec2Scale(a, b, result);

        return result;
    }

    static Reflect(inDirection: Vector2, inNormal: Vector2)
    {
        const result = new Vector2();

        vec2Reflect(inDirection, inNormal, result);

        return result;
    }

    static Perpendicular(inDirection: Vector2)
    {
        const result = new Vector2();

        vec2Perpendicular(inDirection, result);

        return result;
    }

    /**
     * Dot Product of two vectors.
     *
     * For normalized vectors Dot returns 1 if they point in exactly the same direction; -1 if they point in completely opposite directions; and a number in between for other cases (e.g. Dot returns zero if vectors are perpendicular).
     *
     * @param lhs The left-hand vector.
     * @param rhs The right-hand vector.
     * @returns Dot Product of two vectors.
     */
    /**
     * 两个向量的点乘值。
     *
     * 对于归一化向量，如果它们指向完全相同的方向，则 Dot 返回 1；如果它们指向完全相反的方向则返回 -1；其他情况返回-1与1之间的数字（例如，如果向量垂直，则 Dot 返回零）。
     *
     * @param lhs 左侧向量。
     * @param rhs 右侧向量。
     * @returns 两个向量的点乘值。
     */
    static Dot(lhs: Vector2, rhs: Vector2)
    {
        return vec2Dot(lhs, rhs);
    }

    /**
     * 点乘
     *
     * @param v 另一个向量
     * @returns 点乘值
     */
    dot(v: Vector2)
    {
        return vec2Dot(this, v);
    }

    /**
     * 2D 叉乘（返回标量，等于两向量构成的平行四边形面积，带符号）
     *
     * @param v 另一个向量
     */
    cross(v: Vector2)
    {
        return vec2Cross(this, v);
    }

    /**
     * Gets the unsigned angle in degrees between from and to.
     *
     * The angle returned is the unsigned angle between the two vectors.
     * Note: The angle returned will always be between 0 and 180 degrees, because the method returns the smallest angle between the vectors. That is, it will never return a reflex angle. Angles are calculated from world origin point (0,0,0) as the vertex.
     *
     * @param from 	The vector from which the angular difference is measured.
     * @param to The vector to which the angular difference is measured.
     * @returns The unsigned angle in degrees between the two vectors.
     */
    /**
     * 获取从起始向量和终止向量之间的无符号角度。
     *
     * 返回的角度是两个向量之间的无符号角度。
     * 注意：返回的角度总是在 0 到 180 度之间，因为该方法返回向量之间的最小角度。也就是说，它永远不会返回反射角。角度是从世界原点 (0,0,0) 作为顶点计算的。
     *
     * @param from 测量角度差的起始向量。
     * @param to 测量角度差的终止向量。
     * @returns 两个向量之间的无符号角度，以度为单位。
     */
    static Angle(from: Vector2, to: Vector2)
    {
        return vec2Angle(from, to);
    }

    static SignedAngle(from: Vector2, to: Vector2)
    {
        return vec2SignedAngle(from, to);
    }

    /**
     * Returns the distance between a and b.
     *
     * @param a Start point.
     * @param b End point.
     * @returns The distance between a and b.
     */
    /**
     * 返回两点的距离。
     *
     * @param a 起始点。
     * @param b 终止点。
     * @returns 两点的距离。
     */
    static Distance(a: Vector2, b: Vector2)
    {
        return vec2Distance(a, b);
    }

    /**
     * Returns a copy of vector with its magnitude clamped to maxLength.
     *
     * @param vector Restricted vector.
     * @param maxLength The maximum length to be restricted.
     * @returns A copy of vector with its magnitude clamped to maxLength.
     */
    /**
     * 返回其长度被限制最大值为`maxLength`的向量副本。
     *
     * @param vector 被限制的向量。
     * @param maxLength 被限制的最大长度。
     * @returns 限制后的向量副本。
     */
    static ClampMagnitude(vector: Vector2, maxLength: number)
    {
        // 原实现在两个分支都返回**新对象**（夹取时 new、否则 clone），这里保留「总是新建」的身份语义：
        // 先用 clone 占出返回值（类型仍是 Vector2），再由纯函数写入其中。
        const result = vector.clone();

        vec2ClampMagnitude(vector, maxLength, result);

        return result;
    }

    // Returns a vector that is made from the smallest components of two vectors.
    //
    // 有意**未委托**给 `vec2Min`：本方法用 `Mathf.Min`（`a < b ? a : b`），
    // 与 `Math.min` 的 `NaN` 语义不同（`Mathf.Min(NaN, 5)` 得 5，`Math.min(NaN, 5)` 得 NaN），
    // 而实例方法 `min()` 用的正是 `Math.min`——两者不可互换，故本步原样保留。
    static Min(lhs: Vector2, rhs: Vector2)
    {
        return new Vector2(Mathf.Min(lhs.x, rhs.x), Mathf.Min(lhs.y, rhs.y));
    }

    // Returns a vector that is made from the largest components of two vectors.
    //
    // 有意**未委托**给 `vec2Max`：理由同 `Min`（`Mathf.Max` 与 `Math.max` 的 `NaN` 语义不同）。
    static Max(lhs: Vector2, rhs: Vector2)
    {
        return new Vector2(Mathf.Max(lhs.x, rhs.x), Mathf.Max(lhs.y, rhs.y));
    }

    // 有意**未委托**给纯函数层：既隐式读全局 `Time.deltaTime`（方案 §3.5 要求显式传参），
    // 又同时改写 `target` 与 `currentVelocity` 两个入参（多输出，方案 §5.2 要求显式化）。
    // 这两条都要改调用签名，属**阶段 B / C** 的范围（阶段 B 迁移调用点、阶段 C 收口时一并处理），
    // 与阶段 A3 的**跨类型**方法无关，故本步原样保留。
    static SmoothDamp(current: Vector2, target: Vector2, currentVelocity: Vector2, smoothTime: number, maxSpeed: number)
    {
        const deltaTime = Time.deltaTime;

        return Vector2.SmoothDamp2(current, target, currentVelocity, smoothTime, maxSpeed, deltaTime);
    }

    // 未委托理由同 `SmoothDamp`。
    static SmoothDamp1(current: Vector2, target: Vector2, currentVelocity: Vector2, smoothTime: number)
    {
        const deltaTime = Time.deltaTime;
        const maxSpeed = Mathf.Infinity;

        return Vector2.SmoothDamp2(current, target, currentVelocity, smoothTime, maxSpeed, deltaTime);
    }

    // 未委托理由同 `SmoothDamp`。
    static SmoothDamp2(current: Vector2, target: Vector2, currentVelocity: Vector2, smoothTime: number, maxSpeed = Mathf.Infinity, deltaTime = Time.deltaTime)
    {
        // Based on Game Programming Gems 4 Chapter 1.10
        smoothTime = Mathf.Max(0.0001, smoothTime);
        const omega = 2 / smoothTime;

        const x = omega * deltaTime;
        const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);

        let changeX = current.x - target.x;
        let changeY = current.y - target.y;
        const originalTo = target;

        // Clamp maximum speed
        const maxChange = maxSpeed * smoothTime;

        const maxChangeSq = maxChange * maxChange;
        const sqDist = changeX * changeX + changeY * changeY;
        if (sqDist > maxChangeSq)
        {
            const mag = Mathf.Sqrt(sqDist);
            changeX = changeX / mag * maxChange;
            changeY = changeY / mag * maxChange;
        }

        target.x = current.x - changeX;
        target.y = current.y - changeY;

        const tempX = (currentVelocity.x + omega * changeX) * deltaTime;
        const tempY = (currentVelocity.y + omega * changeY) * deltaTime;

        currentVelocity.x = (currentVelocity.x - omega * tempX) * exp;
        currentVelocity.y = (currentVelocity.y - omega * tempY) * exp;

        let outputX = target.x + (changeX + tempX) * exp;
        let outputY = target.y + (changeY + tempY) * exp;

        // Prevent overshooting
        const origMinusCurrentX = originalTo.x - current.x;
        const origMinusCurrentY = originalTo.y - current.y;
        const outMinusOrigX = outputX - originalTo.x;
        const outMinusOrigY = outputY - originalTo.y;

        if (origMinusCurrentX * outMinusOrigX + origMinusCurrentY * outMinusOrigY > 0)
        {
            outputX = originalTo.x;
            outputY = originalTo.y;

            currentVelocity.x = (outputX - originalTo.x) / deltaTime;
            currentVelocity.y = (outputY - originalTo.y) / deltaTime;
        }

        return new Vector2(outputX, outputY);
    }

    /**
     * 将一对极坐标转换为笛卡尔点坐标。
     * @param len 极坐标对的长度。
     * @param angle 极坐标对的角度（以弧度表示）。
     */
    static polar(len: number, angle: number): Vector2
    {
        const result = new Vector2();

        vec2Polar(len, angle, result);

        return result;
    }

    /**
     * 将另一个点的坐标添加到此点的坐标。
     * @param v 要添加的点。
     */
    add(v: Vector2): Vector2
    {
        vec2Add(this, v, this);

        return this;
    }

    /**
     * 将另一个点的坐标添加到此点的坐标以创建一个新点。
     * @param v 要添加的点。
     * @returns 新点。
     */
    addTo(v: Vector2, vout = new Vector2())
    {
        vec2Add(this, v, vout);

        return vout;
    }

    /**
     * 从此点的坐标中减去另一个点的坐标以创建一个新点。
     * @param v 要减去的点。
     * @returns 新点。
     */
    sub(v: Vector2)
    {
        vec2Sub(this, v, this);

        return this;
    }

    /**
     * 减去向量返回新向量
     * @param v 减去的向量
     * @returns 返回的新向量
     */
    subTo(v: Vector2, vout = new Vector2())
    {
        vec2Sub(this, v, vout);

        return vout;
    }

    /**
     * 乘以向量
     * @param v 向量
     */
    multiply(v: Vector2)
    {
        vec2Multiply(this, v, this);

        return this;
    }

    /**
     * 乘以向量
     * @param v 向量
     * @param vout 输出向量
     */
    multiplyTo(v: Vector2, vout = new Vector2())
    {
        vec2Multiply(this, v, vout);

        return vout;
    }

    /**
     * 除以向量
     * @param v 向量
     */
    divide(v: Vector2)
    {
        vec2Divide(this, v, this);

        return this;
    }

    /**
     * 除以向量
     * @param v 向量
     * @param vout 输出向量
     */
    divideTo(v: Vector2, vout = new Vector2())
    {
        vec2Divide(this, v, vout);

        return vout;
    }

    /**
     * 将源 Vector2 对象中的所有点数据复制到调用方 Vector2 对象中。
     * @param source 要从中复制数据的 Vector2 对象。
     */
    copy(source: Vector2)
    {
        vec2Copy(source, this);

        return this;
    }

    /**
     * 返回与目标点之间的距离。
     * @param p 目标点
     * @returns 与目标点之间的距离。
     */
    distance(p: Vector2)
    {
        return vec2Distance(this, p);
    }

    /**
     * 与目标点之间的距离平方
     * @param p 目标点
     */
    distanceSquared(p: Vector3)
    {
        return vec2DistanceSquared(this, p);
    }

    /**
     * 负向量
     */
    negate()
    {
        vec2Negate(this, this);

        return this;
    }

    /**
     * 倒数向量。
     * (x,y) -> (1/x,1/y)
     */
    reciprocal()
    {
        vec2Reciprocal(this, this);

        return this;
    }

    /**
     * 倒数向量。
     * (x,y) -> (1/x,1/y)
     */
    reciprocalTo(out = new Vector2())
    {
        vec2Reciprocal(this, out);

        return out;
    }

    /**
     * 按标量（大小）缩放当前的 Vector3 对象。
     */
    scaleNumber(s: number): Vector2
    {
        vec2ScaleNumber(this, s, this);

        return this;
    }
    /**
     * 按标量（大小）缩放当前的 Vector2 对象。
     */
    scaleNumberTo(s: number, vout = new Vector2())
    {
        vec2ScaleNumber(this, s, vout);

        return vout;
    }

    /**
     * 缩放
     * @param s 缩放量
     */
    scale(s: Vector2)
    {
        vec2Scale(this, s, this);

        return this;
    }

    /**
     * 缩放
     * @param s 缩放量
     */
    scaleTo(s: Vector2, vout = new Vector2())
    {
        // 原有的别名保护逐字保留（`s` 与 `vout` 同一对象时先拷贝）
        if (s === vout) s = s.clone();

        vec2Scale(this, s, vout);

        return vout;
    }

    /**
     * 按指定量偏移 Vector2 对象。dx 的值将添加到 x 的原始值中以创建新的 x 值。dy 的值将添加到 y 的原始值中以创建新的 y 值。
     * @param dx 水平坐标 x 的偏移量。
     * @param dy 水平坐标 y 的偏移量。
     */
    offset(dx: number, dy: number): Vector2
    {
        vec2Offset(this, dx, dy, this);

        return this;
    }

    /**
     * 插值到指定向量
     * @param v 目标向量
     * @param alpha 插值系数
     * @returns 返回自身
     */
    lerp(p: Vector2, alpha: Vector2): Vector2
    {
        vec2Lerp(this, p, alpha, this);

        return this;
    }

    /**
     * 插值到指定向量
     * @param v 目标向量
     * @param alpha 插值系数
     * @returns 返回新向量
     */
    lerpTo(v: Vector2, alpha: Vector2, vout = new Vector2())
    {
        vec2Lerp(this, v, alpha, vout);

        return vout;
    }

    /**
     * 插值到指定向量
     * @param v 目标向量
     * @param alpha 插值系数
     * @returns 返回自身
     */
    lerpNumber(v: Vector2, alpha: number)
    {
        vec2LerpNumber(this, v, alpha, this);

        return this;
    }

    /**
     * 插值到指定向量
     * @param v 目标向量
     * @param alpha 插值系数
     * @returns 返回自身
     */
    lerpNumberTo(v: Vector2, alpha: number, vout = new Vector2())
    {
        vec2LerpNumber(this, v, alpha, vout);

        return vout;
    }

    /**
     * 夹紧？
     * @param min 最小值
     * @param max 最大值
     */
    clamp(min: Vector2, max: Vector2)
    {
        vec2Clamp(this, min, max, this);

        return this;
    }

    /**
     * 夹紧？
     * @param min 最小值
     * @param max 最大值
     */
    clampTo(min: Vector2, max: Vector2, vout = new Vector2())
    {
        vec2Clamp(this, min, max, vout);

        return vout;
    }

    /**
     * 取最小元素
     * @param v 向量
     */
    min(v: Vector2)
    {
        vec2Min(this, v, this);

        return this;
    }

    /**
     * 取最大元素
     * @param v 向量
     */
    max(v: Vector2)
    {
        vec2Max(this, v, this);

        return this;
    }

    /**
     * 各分量均取最近的整数
     */
    round()
    {
        vec2Round(this, this);

        return this;
    }

    /**
     * 转换为数组
     * @param array 数组
     * @param offset 偏移
     * @returns 返回数组
     */
    toArray(array: number[] = [], offset = 0)
    {
        return vec2ToArray(this, array, offset);
    }
}
