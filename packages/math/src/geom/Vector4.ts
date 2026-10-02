import { mathUtil } from '@feng3d/polyfill';
import { mat4TransformVector4 } from './matrix4x4Ops';
import type { Matrix4x4Like } from './matrix4x4Ops';
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

    /**
     * 从数组初始化
     *
     * 返回类型**显式标注 + 先写 `out` 再 `return out`**：不能写成
     * `return vec4FromArray(...)`——那会把这个公共方法的返回类型退化成 ops 的
     * `WritableVector4Like`，消费方（如 `PerspectiveCamera` 的 `p4.scaleTo(...)`）随即编译不过。
     * `tsc -p packages/math` 覆盖不到消费方，这类退化只能靠 `check-strict-dirs.mjs` 拦住。
     */
    static fromArray(array: ArrayLike<number>, offset = 0): Vector4
    {
        const result = new Vector4();

        vec4FromArray(array, offset, result);

        return result;
    }

    static fromVector3(vector3: Vector3, w = 0): Vector4
    {
        const result = new Vector4();

        vec4FromVector3(vector3, w, result);

        return result;
    }

    static random(): Vector4
    {
        const result = new Vector4();

        // Math.random 的调用次数与顺序与改造前逐字一致（x → y → z → w，各一次）
        vec4Random(result);

        return result;
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
    set(x: number, y: number, z = 0, w = 0): this
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
    fromArray(array: ArrayLike<number>, offset = 0): this
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
    fromVector3(vector3: Vector3, w = 0): this
    {
        // 委托纯函数层（#134 阶段 A2f），out 传 this 即就地写入
        vec4FromVector3(vector3, w, this);

        return this;
    }

    /**
     * 转换为三维向量
     * @param v3 三维向量
     */
    toVector3(v3 = new Vector3()): Vector3
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
    toArray(array: number[] = [], offset = 0): number[]
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4ToArray(this, array, offset);
    }

    /**
     * 加上指定向量得到新向量
     * @param v 加向量
     * @returns 返回新向量
     */
    add(v: Vector4): this
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
    addTo(v: Vector4, vout = new Vector4()): Vector4
    {
        // 先写 vout 再 return vout（不能直接 return ops 结果，否则公共返回类型退化成 WritableVector4Like）
        vec4Add(this, v, vout);

        return vout;
    }

    /**
     * 克隆一个向量
     * @returns 返回一个拷贝向量
     */
    clone(): Vector4
    {
        const result = new Vector4();

        vec4Copy(this, result);

        return result;
    }

    /**
     * 从指定向量拷贝数据
     * @param v 被拷贝向量
     * @returns 返回自身
     */
    copy(v: Vector4): this
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
    sub(v: Vector4): this
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
    subTo(v: Vector4, vout = new Vector4()): Vector4
    {
        vec4Sub(this, v, vout);

        return vout;
    }

    /**
     * 乘以指定向量
     * @param v 乘以的向量
     * @returns 返回自身
     */
    multiply(v: Vector4): this
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
    multiplyTo(v: Vector4, vout = new Vector4()): Vector4
    {
        vec4Multiply(this, v, vout);

        return vout;
    }

    /**
     * 除以指定向量
     * @param v 除以的向量
     * @returns 返回自身
     */
    div(v: Vector4): this
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
    divTo(v: Vector4, vout = new Vector4()): Vector4
    {
        vec4Divide(this, v, vout);

        return vout;
    }

    /**
     * 与指定向量比较是否相等
     * @param v 比较的向量
     * @param precision 允许误差
     * @returns 相等返回true，否则false
     */
    equals(v: Vector4, precision = mathUtil.PRECISION): boolean
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4Equals(this, v, precision);
    }

    /**
     * 负向量
     * @returns 返回自身
     */
    negate(): this
    {
        // 委托纯函数层（#134 阶段 A2f），out 传 this 即就地取负
        vec4Negate(this, this);

        return this;
    }

    /**
     * 负向量
     * @returns 返回新向量
     */
    negateTo(vout = new Vector4()): Vector4
    {
        vec4Negate(this, vout);

        return vout;
    }

    /**
     * 缩放指定系数
     * @param s 缩放系数
     * @returns 返回自身
     */
    scale(s: number): this
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
    scaleNumber(s: number): this
    {
        return this.scale(s);
    }

    /**
     * 缩放指定系数
     * @param s 缩放系数
     * @returns 返回新向量
     */
    scaleTo(s: number): Vector4
    {
        const result = new Vector4();

        // 委托纯函数层（#134 阶段 A2f）：语义是「返回新向量」，不改自身
        vec4ScaleNumber(this, s, result);

        return result;
    }

    /**
     * 如果当前 Vector4 对象和作为参数指定的 Vector4 对象均为单位顶点，此方法将返回这两个顶点之间所成角的余弦值。
     */
    dot(a: Vector4): number
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
    lerp(v: Vector4, alpha: number): this
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
    lerpTo(v: Vector4, alpha: number, vout = new Vector4()): Vector4
    {
        vec4Lerp(this, v, alpha, vout);

        return vout;
    }

    /**
     * 应用矩阵
     *
     * A3：跨类型委托给 `mat4TransformVector4`（即 `Matrix4x4.transformVector4` 的纯函数形式，
     * 公式含 `w` 分量：`x' = x·m0 + y·m4 + z·m8 + w·m12`）。
     * 阶段 C-e 起形参放宽为最小形状 `Matrix4x4Like`（`Matrix4x4` 的 class 已删除）。
     * @param mat 矩阵
     */
    applyMatrix4x4(mat: Matrix4x4Like): this
    {
        mat4TransformVector4(mat, this, this);

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
    static Lerp(a: Vector4, b: Vector4, t: number): Vector4
    {
        const result = new Vector4();

        vec4LerpClamped(a, b, t, result);

        return result;
    }

    // Linearly interpolates between two vectors without clamping the interpolant
    static LerpUnclamped(a: Vector4, b: Vector4, t: number): Vector4
    {
        const result = new Vector4();

        vec4LerpNumber(a, b, t, result);

        return result;
    }

    // Moves a point /current/ towards /target/.
    static MoveTowards(current: Vector4, target: Vector4, maxDistanceDelta: number): Vector4
    {
        // 退化分支的「已在目标上 / 一步到达」都返回入参 target **本身**（与改造前逐字一致）；
        // 这里显式分开写，而不是直接 return ops 结果——后者返回类型是
        // `Vector4Like | WritableVector4Like`，会让本方法的返回类型退化。
        const toVectorX = target.x - current.x;
        const toVectorY = target.y - current.y;
        const toVectorZ = target.z - current.z;
        const toVectorW = target.w - current.w;
        const sqdist = toVectorX * toVectorX + toVectorY * toVectorY + toVectorZ * toVectorZ + toVectorW * toVectorW;

        if (sqdist === 0 || (maxDistanceDelta >= 0 && sqdist <= maxDistanceDelta * maxDistanceDelta))
        {
            return target;
        }

        const result = new Vector4();

        vec4MoveTowards(current, target, maxDistanceDelta, result);

        return result;
    }

    // Multiplies two vectors component-wise.
    static Scale(a: Vector4, b: Vector4): Vector4
    {
        const result = new Vector4();

        vec4Multiply(a, b, result);

        return result;
    }

    // Multiplies every component of this vector by the same component of /scale/.
    Scale(scale: Vector4)
    {
        // 委托纯函数层（#134 阶段 A2f），out 传 this 即就地相乘（与原实现一样不返回任何值）
        vec4Multiply(this, scale, this);
    }

    // also required for being able to use Vector4s as keys in hash tables
    Equals(other: Vector4): boolean
    {
        // 委托纯函数层（#134 阶段 A2f）：注意是严格相等，与 equals 的 precision 语义不同
        return vec4StrictEquals(this, other);
    }

    // *undoc* --- we have normalized property now
    static Normalize(a: Vector4): Vector4
    {
        const result = new Vector4();

        // 退化分支给出 (0,0,0,0)（改造前是 Vector4.zero.clone()）
        vec4Normalized(a, result);

        return result;
    }

    // Makes this vector have a ::ref::magnitude of 1.
    Normalize()
    {
        // 委托纯函数层（#134 阶段 A2f）：实例版只归一化 x/y/z，w 原样保留；
        // 与原实现一样不返回任何值
        vec4NormalizeXYZ(this, this);
    }

    // Returns this vector with a ::ref::magnitude of 1 (RO).
    get normalized(): Vector4
    {
        const result = new Vector4();

        vec4Normalized(this, result);

        return result;
    }

    // Dot Product of two vectors.
    static Dot(a: Vector4, b: Vector4): number
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4Dot(a, b);
    }

    // Projects a vector onto another vector.
    static Project(a: Vector4, b: Vector4): Vector4
    {
        const result = new Vector4();

        vec4Project(a, b, result);

        return result;
    }

    // Returns the distance between /a/ and /b/.
    static Distance(a: Vector4, b: Vector4): number
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4Distance(a, b);
    }

    // *undoc* --- there's a property now
    static Magnitude(a: Vector4): number
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4Length(a);
    }

    // Returns the length of this vector (RO).
    get magnitude(): number
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4Length(this);
    }

    // Returns the squared length of this vector (RO).
    get sqrMagnitude(): number
    {
        // 委托纯函数层（#134 阶段 A2f）
        return vec4LengthSquared(this);
    }

    // Returns a vector that is made from the smallest components of two vectors.
    static Min(lhs: Vector4, rhs: Vector4): Vector4
    {
        const result = new Vector4();

        // 用 Mathf.Min（不是 Math.min），参数顺序保持 (lhs, rhs)
        vec4Min(lhs, rhs, result);

        return result;
    }

    // Returns a vector that is made from the largest components of two vectors.
    public static Max(lhs: Vector4, rhs: Vector4): Vector4
    {
        const result = new Vector4();

        // 用 Mathf.Max（不是 Math.max），参数顺序保持 (lhs, rhs)
        vec4Max(lhs, rhs, result);

        return result;
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
