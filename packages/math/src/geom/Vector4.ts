import { mathUtil } from '@feng3d/polyfill';
import { Matrix4x4 } from './Matrix4x4';
import { Vector3 } from './Vector3';
import {
    VEC4_EPSILON,
    vec4Add,
    vec4Copy,
    vec4Distance,
    vec4Divide,
    vec4Dot,
    vec4Equals,
    vec4From,
    vec4FromArray,
    vec4FromVector3,
    vec4Lerp,
    vec4LerpClamped,
    vec4LerpNumber,
    vec4Length,
    vec4LengthSquared,
    vec4Max,
    vec4Min,
    vec4MoveTowards,
    vec4Multiply,
    vec4Negate,
    vec4Normalized,
    vec4NormalizeXYZ,
    vec4Project,
    vec4Random,
    vec4ScaleNumber,
    vec4StrictEquals,
    vec4Sub,
    vec4ToArray,
    vec4ToString,
    vec4ToVector3,
} from './vector4Ops';

/**
 * 四维向量
 */
export class Vector4
{

    static fromArray(array: ArrayLike<number>, offset = 0)
    {
        // 委托纯函数层（#134 阶段 A2f），行为逐字不变：out 传类实例，返回值类型与原来一致
        return vec4FromArray(array, offset, new Vector4());
    }

    static fromVector3(vector3: Vector3, w = 0)
    {
        // 委托纯函数层（#134 阶段 A2f），行为逐字不变：out 传类实例，返回值类型与原来一致
        return vec4FromVector3(vector3, w, new Vector4());
    }

    static random()
    {
        // 委托纯函数层（#134 阶段 A2f）：Math.random 的调用次数与顺序保持一致
        return vec4Random(new Vector4());
    }

    /**
     * 将当前向量初始化为随机值（修改 this 并返回）
     */
    random()
    {
        // 委托纯函数层（#134 阶段 A2f），out 传 this 即就地写入
        vec4Random(this);

        return this;
    }

    /**
    * Vector4 对象中的第一个元素。默认值为 0
    */
    x = 0;

    /**
     * Vector4 对象中的第二个元素。默认值为 0
     */
    y = 0;

    /**
     * Vector4 对象中的第三个元素。默认值为 0
     */
    z = 0;

    /**
     * Vector4 对象的第四个元素。默认值为 0
     */
    w = 0;

    /**
     * 创建 Vector4 对象的实例。如果未指定构造函数的参数，则将使用元素 (0,0,0,0) 创建 Vector4 对象。
     * @param x 第一个元素
     * @param y 第二个元素
     * @param z 第三个元素
     * @param w 第四个元素
     */
    constructor(x = 0, y = 0, z = 0, w = 0)
    {
        this.set(x, y, z, w);
    }

    /**
     * 初始化向量
     * @param x 第一个元素
     * @param y 第二个元素
     * @param z 第三个元素
     * @param w 第四个元素
     * @returns 返回自身
     */
    set(x: number, y: number, z = 0, w = 0)
    {
        // 委托纯函数层（#134 阶段 A2f），out 传 this 即就地写入
        vec4From(x, y, z, w, this);

        return this;
    }

    /**
     * 从数组初始化
     * @param array 提供数据的数组
     * @param offset 数组中起始位置
     * @returns 返回自身
     */
    fromArray(array: ArrayLike<number>, offset = 0)
    {
        // 委托纯函数层（#134 阶段 A2f），out 传 this 即就地写入
        vec4FromArray(array, offset, this);

        return this;
    }

    /**
     * 从三维向量初始化
     * @param vector3 三维向量
     * @param w 向量第四个值
     * @returns 返回自身
     */
    fromVector3(vector3: Vector3, w = 0)
    {
        // 委托纯函数层（#134 阶段 A2f），out 传 this 即就地写入
        vec4FromVector3(vector3, w, this);

        return this;
    }

    /**
     * 转换为三维向量
     * @param v3 三维向量
     */
    toVector3(v3 = new Vector3())
    {
        // 委托纯函数层（#134 阶段 A2f），out 传 v3 即写入调用方给的目标
        vec4ToVector3(this, v3);

        return v3;
    }

    /**
     * 转换为数组
     * @param array 数组
     * @param offset 偏移
     */
    toArray(array: number[] = [], offset = 0)
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4ToArray(this, array, offset);
    }

    /**
     * 加上指定向量得到新向量
     * @param v 加向量
     * @returns 返回新向量
     */
    add(v: Vector4)
    {
        // 委托纯函数层（#134 阶段 A2f），out 传 this 即就地相加
        vec4Add(this, v, this);

        return this;
    }

    /**
     * 加上指定向量得到新向量
     * @param v 加向量
     * @returns 返回新向量
     */
    addTo(v: Vector4, vout = new Vector4())
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4Add(this, v, vout);
    }

    /**
     * 克隆一个向量
     * @returns 返回一个拷贝向量
     */
    clone()
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4Copy(this, new Vector4());
    }

    /**
     * 从指定向量拷贝数据
     * @param v 被拷贝向量
     * @returns 返回自身
     */
    copy(v: Vector4)
    {
        // 委托纯函数层（#134 阶段 A2f），out 传 this 即就地拷贝
        vec4Copy(v, this);

        return this;
    }

    /**
     * 减去指定向量
     * @param v 减去的向量
     * @returns 返回自身
     */
    sub(v: Vector4)
    {
        // 委托纯函数层（#134 阶段 A2f），out 传 this 即就地相减
        vec4Sub(this, v, this);

        return this;
    }

    /**
     * 减去指定向量
     * @param v 减去的向量
     * @returns 返回新向量
     */
    subTo(v: Vector4, vout = new Vector4())
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4Sub(this, v, vout);
    }

    /**
     * 乘以指定向量
     * @param v 乘以的向量
     * @returns 返回自身
     */
    multiply(v: Vector4)
    {
        // 委托纯函数层（#134 阶段 A2f），out 传 this 即就地相乘
        vec4Multiply(this, v, this);

        return this;
    }

    /**
     * 乘以指定向量
     * @param v 乘以的向量
     * @returns 返回新向量
     */
    multiplyTo(v: Vector4, vout = new Vector4())
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4Multiply(this, v, vout);
    }

    /**
     * 除以指定向量
     * @param v 除以的向量
     * @returns 返回自身
     */
    div(v: Vector4)
    {
        // 委托纯函数层（#134 阶段 A2f），out 传 this 即就地相除
        vec4Divide(this, v, this);

        return this;
    }

    /**
     * 除以指定向量
     * @param v 除以的向量
     * @returns 返回新向量
     */
    divTo(v: Vector4, vout = new Vector4())
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4Divide(this, v, vout);
    }

    /**
     * 与指定向量比较是否相等
     * @param v 比较的向量
     * @param precision 允许误差
     * @returns 相等返回true，否则false
     */
    equals(v: Vector4, precision = mathUtil.PRECISION)
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4Equals(this, v, precision);
    }

    /**
     * 负向量
     * @returns 返回自身
     */
    negate()
    {
        // 委托纯函数层（#134 阶段 A2f），out 传 this 即就地取负
        vec4Negate(this, this);

        return this;
    }

    /**
     * 负向量
     * @returns 返回新向量
     */
    negateTo(vout = new Vector4())
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4Negate(this, vout);
    }

    /**
     * 缩放指定系数
     * @param s 缩放系数
     * @returns 返回自身
     */
    scale(s: number)
    {
        // 委托纯函数层（#134 阶段 A2f），out 传 this 即就地缩放
        vec4ScaleNumber(this, s, this);

        return this;
    }

    /**
     * 缩放指定系数（修改 this 并返回）
     *
     * scale 的别名，与 Vector3.scaleNumber 命名一致。
     */
    scaleNumber(s: number)
    {
        return this.scale(s);
    }

    /**
     * 缩放指定系数
     * @param s 缩放系数
     * @returns 返回新向量
     */
    scaleTo(s: number)
    {
        // 委托纯函数层（#134 阶段 A2f）：语义是「返回新向量」，不改自身
        return vec4ScaleNumber(this, s, new Vector4());
    }

    /**
     * 如果当前 Vector4 对象和作为参数指定的 Vector4 对象均为单位顶点，此方法将返回这两个顶点之间所成角的余弦值。
     */
    dot(a: Vector4)
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4Dot(this, a);
    }

    /**
     * 获取到指定向量的插值
     * @param v 终点插值向量
     * @param alpha 插值系数
     * @returns 返回自身
     */
    lerp(v: Vector4, alpha: number)
    {
        // 委托纯函数层（#134 阶段 A2f），out 传 this 即就地插值
        vec4Lerp(this, v, alpha, this);

        return this;
    }

    /**
     * 获取到指定向量的插值
     * @param v 终点插值向量
     * @param alpha 插值系数
     * @returns 返回新向量
     */
    lerpTo(v: Vector4, alpha: number, vout = new Vector4())
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4Lerp(this, v, alpha, vout);
    }

    /**
     * 应用矩阵
     *
     * 待 A3（跨类型纯函数）补齐委托：`vec4ApplyMatrix4x4` 需要 `Matrix4x4` 的纯函数层，
     * 按方案 §5.5 暂留在 class 内用原实现。
     * @param mat 矩阵
     */
    applyMatrix4x4(mat: Matrix4x4)
    {
        mat.transformVector4(this, this);

        return this;
    }

    /**
     * 返回当前 Vector4 对象的字符串表示形式。
     */
    toString(): string
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4ToString(this);
    }

    // Linearly interpolates between two vectors.
    static Lerp(a: Vector4, b: Vector4, t: number)
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4LerpClamped(a, b, t, new Vector4());
    }

    // Linearly interpolates between two vectors without clamping the interpolant
    static LerpUnclamped(a: Vector4, b: Vector4, t: number)
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4LerpNumber(a, b, t, new Vector4());
    }

    // Moves a point /current/ towards /target/.
    static MoveTowards(current: Vector4, target: Vector4, maxDistanceDelta: number)
    {
        // 委托纯函数层（#134 阶段 A2f）：退化分支仍返回 target 本身（行为逐字不变）
        return vec4MoveTowards(current, target, maxDistanceDelta, new Vector4());
    }

    // Multiplies two vectors component-wise.
    static Scale(a: Vector4, b: Vector4)
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4Multiply(a, b, new Vector4());
    }

    // Multiplies every component of this vector by the same component of /scale/.
    Scale(scale: Vector4)
    {
        // 委托纯函数层（#134 阶段 A2f），out 传 this 即就地相乘（与原实现一样不返回任何值）
        vec4Multiply(this, scale, this);
    }

    // also required for being able to use Vector4s as keys in hash tables
    Equals(other: Vector4)
    {
        // 委托纯函数层（#134 阶段 A2f）：注意是严格相等，与 equals 的 precision 语义不同
        return vec4StrictEquals(this, other);
    }

    // *undoc* --- we have normalized property now
    static Normalize(a: Vector4)
    {
        // 委托纯函数层（#134 阶段 A2f）：退化时给出 (0,0,0,0)
        return vec4Normalized(a, new Vector4());
    }

    // Makes this vector have a ::ref::magnitude of 1.
    Normalize()
    {
        // 委托纯函数层（#134 阶段 A2f）：实例版只归一化 x/y/z，w 原样保留；
        // 与原实现一样不返回任何值
        vec4NormalizeXYZ(this, this);
    }

    // Returns this vector with a ::ref::magnitude of 1 (RO).
    get normalized()
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4Normalized(this, new Vector4());
    }

    // Dot Product of two vectors.
    static Dot(a: Vector4, b: Vector4)
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4Dot(a, b);
    }

    // Projects a vector onto another vector.
    static Project(a: Vector4, b: Vector4)
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4Project(a, b, new Vector4());
    }

    // Returns the distance between /a/ and /b/.
    static Distance(a: Vector4, b: Vector4)
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4Distance(a, b);
    }

    // *undoc* --- there's a property now
    static Magnitude(a: Vector4)
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4Length(a);
    }

    // Returns the length of this vector (RO).
    get magnitude()
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4Length(this);
    }

    // Returns the squared length of this vector (RO).
    get sqrMagnitude()
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4LengthSquared(this);
    }

    // Returns a vector that is made from the smallest components of two vectors.
    static Min(lhs: Vector4, rhs: Vector4)
    {
        // 委托纯函数层（#134 阶段 A2f）：用 Mathf.Min，参数顺序保持 (lhs, rhs)
        return vec4Min(lhs, rhs, new Vector4());
    }

    // Returns a vector that is made from the largest components of two vectors.
    public static Max(lhs: Vector4, rhs: Vector4)
    {
        // 委托纯函数层（#134 阶段 A2f）：用 Mathf.Max，参数顺序保持 (lhs, rhs)
        return vec4Max(lhs, rhs, new Vector4());
    }

    // Shorthand for writing @@Vector4(0,0,0,0)@@
    static readonly zero = Object.freeze(new Vector4(0, 0, 0, 0));
    // Shorthand for writing @@Vector4(1,1,1,1)@@
    static readonly one = Object.freeze(new Vector4(1, 1, 1, 1));
    // Shorthand for writing @@Vector3(float.PositiveInfinity, float.PositiveInfinity, float.PositiveInfinity)@@
    static readonly positiveInfinity = Object.freeze(new Vector4(Infinity, Infinity, Infinity, Infinity));
    // Shorthand for writing @@Vector3(float.NegativeInfinity, float.NegativeInfinity, float.NegativeInfinity)@@
    static readonly negativeInfinity = Object.freeze(new Vector4(-Infinity, -Infinity, -Infinity, -Infinity));

    // *undocumented*
    static readonly kEpsilon = VEC4_EPSILON;
}
