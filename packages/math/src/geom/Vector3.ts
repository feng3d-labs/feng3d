import { mathUtil } from '@feng3d/polyfill';
import { Mathf } from '../MathF';
import { Time } from '../Time';
import { Matrix3x3 } from './Matrix3x3';
import { mat3Set } from './matrix3x3Ops';
import { Matrix4x4 } from './Matrix4x4';
import { mat4TransformPoint3 } from './matrix4x4Ops';
import { Quaternion } from './Quaternion';
import { quatVmult } from './quaternionOps';
import { Vector } from './Vector';
import { Vector2 } from './Vector2';
import { Vector4 } from './Vector4';
import {
    VEC3_EPSILON,
    VEC3_EPSILON_NORMAL_SQRT,
    vec2ToVec3,
    vec3Add,
    vec3AddNumber,
    vec3AddScaled,
    vec3AlmostZero,
    vec3Angle,
    vec3Ceil,
    vec3Clamp,
    vec3Copy,
    vec3Cross,
    vec3Distance,
    vec3DistanceSquared,
    vec3Divide,
    vec3DivideNumber,
    vec3Dot,
    vec3Equals,
    vec3Floor,
    vec3From,
    vec3FromArray,
    vec3Greater,
    vec3GreaterEqual,
    vec3Inverse,
    vec3IsAntiparallel,
    vec3IsParallel,
    vec3IsZero,
    vec3Length,
    vec3LengthSquared,
    vec3Lerp,
    vec3LerpClamped,
    vec3LerpNumber,
    vec3Less,
    vec3LessEqual,
    vec3Max,
    vec3Min,
    vec3Multiply,
    vec3Negate,
    vec3Normalized,
    vec3NormalizeThickness,
    vec3Random,
    vec3Reflect,
    vec3Round,
    vec3RoundToZero,
    vec3Scale,
    vec3ScaleNumber,
    vec3SetZero,
    vec3SignedAngle,
    vec3Sub,
    vec3SubNumber,
    vec3Tangents,
    vec3ToArray,
    vec3ToString,
    vec3ToVec2,
    vec3ToVec4,
    vec3Unit,
} from './vector3Ops';

export interface Vector3Like
{
    x: number;
    y: number;
    z: number;
}

/**
 * Vector3 类使用笛卡尔坐标 x、y 和 z 表示三维空间中的点或位置
 */
export class Vector3 implements Vector, Vector3Like
{

    /**
    * 定义为 Vector3 对象的 x 轴，坐标为 (1,0,0)。
    */
    static X_AXIS = Object.freeze(new Vector3(1, 0, 0));

    /**
    * 定义为 Vector3 对象的 y 轴，坐标为 (0,1,0)
    */
    static Y_AXIS = Object.freeze(new Vector3(0, 1, 0));

    /**
    * 定义为 Vector3 对象的 z 轴，坐标为 (0,0,1)
    */
    static Z_AXIS = Object.freeze(new Vector3(0, 0, 1));

    /**
     * 原点 Vector3(0,0,0)
     */
    static ZERO = Object.freeze(new Vector3());

    /**
     * Vector3(1, 1, 1)
     */
    static ONE = Object.freeze(new Vector3(1, 1, 1));

    /**
     * 从数组中初始化向量
     * @param array 数组
     * @param offset 偏移
     * @returns 返回新向量
     */
    static fromArray(array: ArrayLike<number>, offset = 0)
    {
        return new Vector3().fromArray(array, offset);
    }

    /**
     * 随机三维向量
     *
     * @param size 尺寸
     * @param double 如果值为false，随机范围在[0,size],否则[-size,size]。默认为false。
     */
    static random(size = 1, double = false)
    {
        const v = new Vector3();

        vec3Random(size, double, v);

        return v;
    }

    /**
     * 将当前向量初始化为随机值（修改 this 并返回）
     *
     * @param size 缩放系数
     * @param double 是否映射到 [-size, size]（默认 [0, size]）
     */
    random(size = 1, double = false)
    {
        vec3Random(size, double, this);

        return this;
    }

    /**
     * 从Vector2初始化
     *
     * ⚠️ 静态工厂**不能**写成 `return vec2ToVec3(...)`：那会返回纯字面量而不是 `Vector3` 实例，
     * 消费方拿到的东西没有原型方法（方案 §10.1 P8c/P8f）。这里保持「先 `new Vector3()` 再写入」。
     */
    static fromVector2(vector: Vector2, z = 0): Vector3
    {
        return new Vector3().fromVector2(vector, z);
    }

    /**
    * Vector3 对象中的第一个元素，例如，三维空间中某个点的 x 坐标。默认值为 0
    */
    x = 0;

    /**
     * Vector3 对象中的第二个元素，例如，三维空间中某个点的 y 坐标。默认值为 0
     */
    y = 0;

    /**
     * Vector3 对象中的第三个元素，例如，三维空间中某个点的 z 坐标。默认值为 0
     */
    z = 0;

    /**
    * 当前 Vector3 对象的长度（大小），即从原点 (0,0,0) 到该对象的 x、y 和 z 坐标的距离。w 属性将被忽略。单位矢量具有的长度或大小为一。
    */
    get length(): number
    {
        return vec3Length(this);
    }

    /**
    * 当前 Vector3 对象长度的平方，它是使用 x、y 和 z 属性计算出来的。w 属性将被忽略。尽可能使用 lengthSquared() 方法，而不要使用 Vector3.length() 方法的 Math.sqrt() 方法调用，后者速度较慢。
    */
    get lengthSquared(): number
    {
        return vec3LengthSquared(this);
    }

    /**
     * 创建 Vector3 对象的实例。如果未指定构造函数的参数，则将使用元素 (0,0,0,0) 创建 Vector3 对象。
     * @param x 第一个元素，例如 x 坐标。
     * @param y 第二个元素，例如 y 坐标。
     * @param z 第三个元素，例如 z 坐标。
     */
    constructor(x = 0, y = 0, z = 0)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /**
     * 将 Vector3 的成员设置为指定值
     */
    set(x: number, y: number, z: number)
    {
        vec3From(x, y, z, this);

        return this;
    }

    /**
     * 把所有分量都设为零
     */
    setZero()
    {
        vec3SetZero(this);
    }

    /**
     * 从Vector2初始化
     *
     * A3：跨类型委托给 `vec2ToVec3`（`out` 传 `this`，就地语义不变）。
     */
    fromVector2(vector: Vector2, z = 0): this
    {
        vec2ToVec3(vector, z, this);

        return this;
    }

    fromArray(array: ArrayLike<number>, offset = 0)
    {
        vec3FromArray(array, offset, this);

        return this;
    }

    /**
     * 转换为Vector2
     *
     * A3：跨类型委托给 `vec3ToVec2`（先写 `vout` 再返回，返回类型不退化成 `WritableVector2Like`）。
     */
    toVector2(vector = new Vector2()): Vector2
    {
        vec3ToVec2(this, vector);

        return vector;
    }

    /**
     * 加上指定向量
     * @param v 加向量
     */
    add(v: Vector3)
    {
        vec3Add(this, v, this);

        return this;
    }

    /**
     * 加上指定向量得到新向量
     * @param v 加向量
     * @returns 返回新向量
     */
    addTo(v: Vector3, vout = new Vector3())
    {
        vec3Add(this, v, vout);

        return vout;
    }

    /**
     * 减去向量
     * @param a 减去的向量
     * @returns 返回新向量
     */
    sub(a: Vector3)
    {
        vec3Sub(this, a, this);

        return this;
    }

    /**
     * 减去向量返回新向量
     * @param v 减去的向量
     * @returns 返回的新向量
     */
    subTo(v: Vector3, vout = new Vector3())
    {
        vec3Sub(this, v, vout);

        return vout;
    }

    /**
     * 乘以向量
     * @param v 向量
     */
    multiply(v: Vector3)
    {
        vec3Multiply(this, v, this);

        return this;
    }

    /**
     * 乘以向量
     * @param v 向量
     * @param vout 输出向量
     */
    multiplyTo(v: Vector3, vout = new Vector3())
    {
        vec3Multiply(this, v, vout);

        return vout;
    }

    /**
     * 除以向量
     * @param a 向量
     */
    divide(a: Vector3)
    {
        vec3Divide(this, a, this);

        return this;
    }

    /**
     * 除以向量
     * @param a 向量
     * @param vout 输出向量
     */
    divideTo(a: Vector3Like, vout = new Vector3())
    {
        vec3Divide(this, a, vout);

        return vout;
    }

    /**
     * 通过将当前 Vector3 对象的 x、y 和 z 元素与指定的 Vector3 对象的 x、y 和 z 元素进行比较，确定这两个对象是否相等。
     */
    equals(v: Vector3Like, precision = mathUtil.PRECISION)
    {
        return vec3Equals(this, v, precision);
    }

    /**
     * 将源 Vector3 对象中的所有矢量数据复制到调用方 Vector3 对象中。
     * @returns 要从中复制数据的 Vector3 对象。
     */
    copy(v: Vector3Like)
    {
        vec3Copy(v, this);

        return this;
    }

    /**
     * 与目标点之间的距离
     * @param p 目标点
     */
    distance(p: Vector3Like)
    {
        return vec3Distance(this, p);
    }

    /**
     * 与目标点之间的距离平方
     * @param p 目标点
     */
    distanceSquared(p: Vector3Like)
    {
        return vec3DistanceSquared(this, p);
    }

    /**
     * 通过将最前面的三个元素（x、y、z）除以矢量的长度可将 Vector3 对象转换为单位矢量。
     */
    normalize(thickness = 1)
    {
        vec3NormalizeThickness(this, thickness, this);

        return this;
    }

    /**
     * Scale a vector and add it to this vector. Save the result in "this". (this = this + vector * scalar)
     * @param scalar
     * @param vector
     */
    addScaledVector(scalar: number, vector: Vector3)
    {
        vec3AddScaled(this, scalar, vector, this);

        return this;
    }

    /**
     * Scale a vector and add it to this vector. Save the result in "target". (target = this + vector * scalar)
     * @param scalar
     * @param vector
     * @param target The vector to save the result in.
     */
    addScaledVectorTo(scalar: number, vector: Vector3Like, target = new Vector3())
    {
        vec3AddScaled(this, scalar, vector, target);

        return target;
    }

    /**
     * 叉乘向量
     * @param a 向量
     */
    cross(a: Vector3Like): Vector3
    {
        vec3Cross(this, a, this);

        return this;
    }

    /**
     * 叉乘向量
     * @param a 向量
     * @param vout 输出向量
     */
    crossTo(a: Vector3Like, vout = new Vector3())
    {
        vec3Cross(this, a, vout);

        return vout;
    }

    /**
     * 如果当前 Vector3 对象和作为参数指定的 Vector3 对象均为单位顶点，此方法将返回这两个顶点之间所成角的余弦值。
     */
    dot(a: Vector3Like)
    {
        return vec3Dot(this, a);
    }

    /**
     * 是否为零向量
     */
    isZero()
    {
        return vec3IsZero(this);
    }

    tangents(t1: Vector3, t2: Vector3)
    {
        vec3Tangents(this, t1, t2);
    }

    /**
     * 检查一个向量是否接近零
     *
     * @param precision
     */
    almostZero(precision = mathUtil.PRECISION)
    {
        return vec3AlmostZero(this, precision);
    }

    /**
     * 检查这个向量是否与另一个向量反平行。
     *
     * @param v
     * @param precision 设置为零以进行精确比较
     */
    isAntiparallelTo(v: Vector3, precision = mathUtil.PRECISION)
    {
        return vec3IsAntiparallel(this, v, precision);
    }

    /**
     * 加上标量
     * @param n 标量
     */
    addNumber(n: number)
    {
        vec3AddNumber(this, n, this);

        return this;
    }

    /**
     * 增加标量
     * @param n 标量
     */
    addNumberTo(n: number, vout = new Vector3())
    {
        vec3AddNumber(this, n, vout);

        return vout;
    }

    /**
     * 减去标量
     * @param n 标量
     */
    subNumber(n: number)
    {
        vec3SubNumber(this, n, this);

        return this;
    }

    /**
     * 减去标量
     * @param n 标量
     */
    subNumberTo(n: number, vout = new Vector3())
    {
        vec3SubNumber(this, n, vout);

        return vout;
    }

    /**
     * 乘以标量
     * @param n 标量
     */
    multiplyNumber(n: number)
    {
        vec3ScaleNumber(this, n, this);

        return this;
    }

    /**
     * 乘以标量
     * @param n 标量
     * @param vout 输出向量
     */
    multiplyNumberTo(n: number, vout = new Vector3())
    {
        vec3ScaleNumber(this, n, vout);

        return vout;
    }

    /**
     * 除以标量
     * @param n 标量
     */
    divideNumber(n: number)
    {
        vec3DivideNumber(this, n, this);

        return this;
    }

    /**
     * 除以标量
     * @param n 标量
     * @param vout 输出向量
     */
    divideNumberTo(n: number, vout = new Vector3())
    {
        vec3DivideNumber(this, n, vout);

        return vout;
    }

    /**
     * 返回一个新 Vector3 对象，它是与当前 Vector3 对象完全相同的副本。
     * @returns 一个新 Vector3 对象，它是当前 Vector3 对象的副本。
     */
    clone()
    {
        const result = new Vector3();

        vec3Copy(this, result);

        return result;
    }

    /**
     * 负向量
     * (a,b,c)->(-a,-b,-c)
     */
    negate()
    {
        vec3Negate(this, this);

        return this;
    }

    /**
     * 负向量
     * (a,b,c)->(-a,-b,-c)
     */
    negateTo(vout = new Vector3())
    {
        vec3Negate(this, vout);

        return vout;
    }

    /**
     * 倒向量
     * (a,b,c)->(1/a,1/b,1/c)
     */
    inverse()
    {
        vec3Inverse(this, this);

        return this;
    }

    /**
     * 倒向量
     * (a,b,c)->(1/a,1/b,1/c)
     */
    inverseTo(vout = new Vector3())
    {
        vec3Inverse(this, vout);

        return vout;
    }

    /**
     * 得到这个向量长度为1
     */
    unit(target: Vector3 = new Vector3())
    {
        vec3Unit(this, target);

        return target;
    }

    /**
     * 按标量（大小）缩放当前的 Vector3 对象。
     */
    scaleNumber(s: number)
    {
        vec3ScaleNumber(this, s, this);

        return this;
    }

    /**
     * 按标量（大小）缩放当前的 Vector3 对象。
     */
    scaleNumberTo(s: number, vout = new Vector3())
    {
        vec3ScaleNumber(this, s, vout);

        return vout;
    }

    /**
     * 缩放
     * @param s 缩放量
     */
    scale(s: Vector3)
    {
        vec3Scale(this, s, this);

        return this;
    }

    /**
     * 缩放
     * @param s 缩放量
     */
    scaleTo(s: Vector3, vout = new Vector3())
    {
        vec3Scale(this, s, vout);

        return vout;
    }

    /**
     * 插值到指定向量
     * @param v 目标向量
     * @param alpha 插值系数
     * @returns 返回自身
     */
    lerp(v: Vector3, alpha: Vector3)
    {
        vec3Lerp(this, v, alpha, this);

        return this;
    }

    /**
     * 插值到指定向量
     * @param v 目标向量
     * @param alpha 插值系数
     * @returns 返回自身
     */
    lerpTo(v: Vector3, alpha: Vector3, vout = new Vector3())
    {
        vec3Lerp(this, v, alpha, vout);

        return vout;
    }

    /**
     * 插值到指定向量
     * @param v 目标向量
     * @param alpha 插值系数
     * @returns 返回自身
     */
    lerpNumber(v: Vector3, alpha: number)
    {
        vec3LerpNumber(this, v, alpha, this);

        return this;
    }

    /**
     * 插值到指定向量
     * @param v 目标向量
     * @param alpha 插值系数
     * @returns 返回自身
     */
    lerpNumberTo(v: Vector3, alpha: number, vout = new Vector3())
    {
        vec3LerpNumber(this, v, alpha, vout);

        return vout;
    }

    /**
     * 小于指定点
     * @param p 点
     */
    less(p: Vector3)
    {
        return vec3Less(this, p);
    }

    /**
     * 小于等于指定点
     * @param p 点
     */
    lessequal(p: Vector3)
    {
        return vec3LessEqual(this, p);
    }

    /**
     * 大于指定点
     * @param p 点
     */
    greater(p: Vector3)
    {
        return vec3Greater(this, p);
    }

    /**
     * 大于等于指定点
     * @param p 点
     */
    greaterequal(p: Vector3)
    {
        return vec3GreaterEqual(this, p);
    }

    /**
     * 夹紧？
     * @param min 最小值
     * @param max 最大值
     */
    clamp(min: Vector3, max: Vector3)
    {
        vec3Clamp(this, min, max, this);

        return this;
    }

    /**
     * 夹紧？
     * @param min 最小值
     * @param max 最大值
     */
    clampTo(min: Vector3, max: Vector3, vout = new Vector3())
    {
        vec3Clamp(this, min, max, vout);

        return vout;
    }

    /**
     * 取最小元素
     * @param v 向量
     */
    min(v: Vector3)
    {
        vec3Min(this, v, this);

        return this;
    }

    /**
     * 取最大元素
     * @param v 向量
     */
    max(v: Vector3)
    {
        vec3Max(this, v, this);

        return this;
    }

    /**
     * 反射
     * @param normal
     */
    reflect(normal: Vector3)
    {
        vec3Reflect(this, normal, this);

        return this;
    }

    /**
     * 向下取整
     */
    floor()
    {
        vec3Floor(this, this);

        return this;
    }

    /**
     * 向上取整
     */
    ceil()
    {
        vec3Ceil(this, this);

        return this;
    }

    /**
     * 四舍五入
     */
    round()
    {
        vec3Round(this, this);

        return this;
    }

    /**
     * 向0取整
     */
    roundToZero()
    {
        vec3RoundToZero(this, this);

        return this;
    }

    /**
     * 与指定向量是否平行
     * @param v 向量
     */
    isParallel(v: Vector3, precision = mathUtil.PRECISION)
    {
        return vec3IsParallel(this, v, precision);
    }

    /**
     * 从向量中得到叉乘矩阵a_cross，使得a x b = a_cross * b = c
     * @see http://www8.cs.umu.se/kurser/TDBD24/VT06/lectures/Lecture6.pdf
     *
     * A3：跨类型委托给 `mat3Set`（与 Matrix3x3.set 走的是同一个函数，元素数组同样是**直接持有**）。
     */
    crossmat(this: Vector3, outMatrix: Matrix3x3): Matrix3x3
    {
        mat3Set([0, -this.z, this.y,
            this.z, 0, -this.x,
            -this.y, this.x, 0], outMatrix);

        return outMatrix;
    }

    /**
     * 应用四元素
     * @param q 四元素
     *
     * A3：跨类型委托给 `quatVmult`（即 `Quaternion.vmult` 的纯函数形式，公式逐字相同）。
     */
    applyQuaternion(q: Quaternion): this
    {
        quatVmult(q, this, this);

        return this;
    }

    /**
     * 应用矩阵
     * @param mat 矩阵
     *
     * A3：跨类型委托给 `mat4TransformPoint3`（变换**点**，含平移；不是 `mat4TransformVector3`）。
     */
    applyMatrix4x4(mat: Matrix4x4): this
    {
        mat4TransformPoint3(mat, this, this);

        return this;
    }

    /**
     * 返回当前 Vector3 对象的字符串表示形式。
     */
    toString(): string
    {
        return vec3ToString(this);
    }

    /**
     * 转换为数组
     * @param array 数组
     * @param offset 偏移
     * @returns 返回数组
     */
    toArray(array: number[] = [], offset = 0)
    {
        return vec3ToArray(this, array, offset);
    }

    /**
     * 转换为Vector4
     *
     * A3：跨类型委托给 `vec3ToVec4`——只写 `x/y/z`，**保留 `vector4.w` 原值**（与改造前一致）。
     */
    toVector4(vector4: Vector4): Vector4
    {
        vec3ToVec4(this, vector4);

        return vector4;
    }

    // *Undocumented*
    static readonly kEpsilon = VEC3_EPSILON;
    // *Undocumented*
    static readonly kEpsilonNormalSqrt = VEC3_EPSILON_NORMAL_SQRT;

    // Linearly interpolates between two vectors.
    static Lerp(a: Vector3, b: Vector3, t: number)
    {
        const result = new Vector3();

        vec3LerpClamped(a, b, t, result);

        return result;
    }

    // Linearly interpolates between two vectors without clamping the interpolant
    static LerpUnclamped(a: Vector3, b: Vector3, t: number)
    {
        const result = new Vector3();

        vec3LerpNumber(a, b, t, result);

        return result;
    }

    // Moves a point /current/ in a straight line towards a /target/ point.
    static MoveTowards(current: Vector3, target: Vector3, maxDistanceDelta: number)
    {
        // avoid vector ops because current scripting backends are terrible at inlining
        const toVectorX = target.x - current.x;
        const toVectorY = target.y - current.y;
        const toVectorZ = target.z - current.z;

        const sqdist = toVectorX * toVectorX + toVectorY * toVectorY + toVectorZ * toVectorZ;

        if (sqdist === 0 || (maxDistanceDelta >= 0 && sqdist <= maxDistanceDelta * maxDistanceDelta))
        {
            return target;
        }
        const dist = Math.sqrt(sqdist);

        return new Vector3(current.x + toVectorX / dist * maxDistanceDelta,
            current.y + toVectorY / dist * maxDistanceDelta,
            current.z + toVectorZ / dist * maxDistanceDelta);
    }

    static SmoothDamp(current: Vector3, target: Vector3, currentVelocity: Vector3, smoothTime: number, maxSpeed: number)
    {
        const deltaTime = Time.deltaTime;

        return Vector3.SmoothDamp2(current, target, currentVelocity, smoothTime, maxSpeed, deltaTime);
    }

    static SmoothDamp1(current: Vector3, target: Vector3, currentVelocity: Vector3, smoothTime: number)
    {
        const deltaTime = Time.deltaTime;
        const maxSpeed = Mathf.Infinity;

        return Vector3.SmoothDamp2(current, target, currentVelocity, smoothTime, maxSpeed, deltaTime);
    }

    // Gradually changes a vector towards a desired goal over time.
    static SmoothDamp2(current: Vector3, target: Vector3, currentVelocity: Vector3, smoothTime: number, maxSpeed = Mathf.Infinity, deltaTime = Time.deltaTime)
    {
        let outputX = 0;
        let outputY = 0;
        let outputZ = 0;

        // Based on Game Programming Gems 4 Chapter 1.10
        smoothTime = Mathf.Max(0.0001, smoothTime);
        const omega = 2 / smoothTime;

        const x = omega * deltaTime;
        const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);

        let changeX = current.x - target.x;
        let changeY = current.y - target.y;
        let changeZ = current.z - target.z;
        const originalTo = target;

        // Clamp maximum speed
        const maxChange = maxSpeed * smoothTime;

        const maxChangeSq = maxChange * maxChange;
        const sqrmag = changeX * changeX + changeY * changeY + changeZ * changeZ;
        if (sqrmag > maxChangeSq)
        {
            const mag = Math.sqrt(sqrmag);
            changeX = changeX / mag * maxChange;
            changeY = changeY / mag * maxChange;
            changeZ = changeZ / mag * maxChange;
        }

        target.x = current.x - changeX;
        target.y = current.y - changeY;
        target.z = current.z - changeZ;

        const tempX = (currentVelocity.x + omega * changeX) * deltaTime;
        const tempY = (currentVelocity.y + omega * changeY) * deltaTime;
        const tempZ = (currentVelocity.z + omega * changeZ) * deltaTime;

        currentVelocity.x = (currentVelocity.x - omega * tempX) * exp;
        currentVelocity.y = (currentVelocity.y - omega * tempY) * exp;
        currentVelocity.z = (currentVelocity.z - omega * tempZ) * exp;

        outputX = target.x + (changeX + tempX) * exp;
        outputY = target.y + (changeY + tempY) * exp;
        outputZ = target.z + (changeZ + tempZ) * exp;

        // Prevent overshooting
        const origMinusCurrentX = originalTo.x - current.x;
        const origMinusCurrentY = originalTo.y - current.y;
        const origMinusCurrentZ = originalTo.z - current.z;
        const outMinusOrigX = outputX - originalTo.x;
        const outMinusOrigY = outputY - originalTo.y;
        const outMinusOrigZ = outputZ - originalTo.z;

        if (origMinusCurrentX * outMinusOrigX + origMinusCurrentY * outMinusOrigY + origMinusCurrentZ * outMinusOrigZ > 0)
        {
            outputX = originalTo.x;
            outputY = originalTo.y;
            outputZ = originalTo.z;

            currentVelocity.x = (outputX - originalTo.x) / deltaTime;
            currentVelocity.y = (outputY - originalTo.y) / deltaTime;
            currentVelocity.z = (outputZ - originalTo.z) / deltaTime;
        }

        return new Vector3(outputX, outputY, outputZ);
    }

    // Multiplies two vectors component-wise.
    static Scale(a: Vector3, b: Vector3)
    {
        const result = new Vector3();

        vec3Scale(a, b, result);

        return result;
    }

    // Cross Product of two vectors.
    static Cross(lhs: Vector3, rhs: Vector3)
    {
        const result = new Vector3();

        vec3Cross(lhs, rhs, result);

        return result;
    }

    // Reflects a vector off the plane defined by a normal.
    static Reflect(inDirection: Vector3, inNormal: Vector3)
    {
        const result = new Vector3();

        vec3Reflect(inDirection, inNormal, result);

        return result;
    }

    // *undoc* --- we have normalized property now
    static Normalize(value: Vector3)
    {
        const result = new Vector3();

        vec3Normalized(value, result);

        return result;
    }

    // Makes this vector have a ::ref::magnitude of 1.
    Normalize()
    {
        vec3Normalized(this, this);
    }

    // Returns this vector with a ::ref::magnitude of 1 (RO).
    get normalized()
    {
        return Vector3.Normalize(this);
    }

    // Dot Product of two vectors.
    static Dot(lhs: Vector3, rhs: Vector3)
    {
        return vec3Dot(lhs, rhs);
    }

    // Projects a vector onto another vector.
    static Project(vector: Vector3, onNormal: Vector3)
    {
        const sqrMag = Vector3.Dot(onNormal, onNormal);
        if (sqrMag < Mathf.Epsilon)
        {
            return Vector3.zero;
        }
        const dot = Vector3.Dot(vector, onNormal);

        return new Vector3(onNormal.x * dot / sqrMag,
            onNormal.y * dot / sqrMag,
            onNormal.z * dot / sqrMag);
    }

    // Projects a vector onto a plane defined by a normal orthogonal to the plane.
    static ProjectOnPlane(vector: Vector3, planeNormal: Vector3)
    {
        const sqrMag = Vector3.Dot(planeNormal, planeNormal);
        if (sqrMag < Mathf.Epsilon)
        {
            return vector;
        }
        const dot = Vector3.Dot(vector, planeNormal);

        return new Vector3(vector.x - planeNormal.x * dot / sqrMag,
            vector.y - planeNormal.y * dot / sqrMag,
            vector.z - planeNormal.z * dot / sqrMag);
    }

    // Returns the angle in degrees between /from/ and /to/. This is always the smallest
    static Angle(from: Vector3, to: Vector3)
    {
        return vec3Angle(from, to);
    }

    // The smaller of the two possible angles between the two vectors is returned, therefore the result will never be greater than 180 degrees or smaller than -180 degrees.
    // If you imagine the from and to vectors as lines on a piece of paper, both originating from the same point, then the /axis/ vector would point up out of the paper.
    // The measured angle between the two vectors would be positive in a clockwise direction and negative in an anti-clockwise direction.
    static SignedAngle(from: Vector3, to: Vector3, axis: Vector3)
    {
        return vec3SignedAngle(from, to, axis);
    }

    // Returns the distance between /a/ and /b/.
    static Distance(a: Vector3, b: Vector3)
    {
        return vec3Distance(a, b);
    }

    // Returns a copy of /vector/ with its magnitude clamped to /maxLength/.
    static ClampMagnitude(vector: Vector3, maxLength: number)
    {
        const sqrmag = vector.sqrMagnitude;
        if (sqrmag > maxLength * maxLength)
        {
            const mag = Math.sqrt(sqrmag);
            // these intermediate variables force the intermediate result to be
            // of float precision. without this, the intermediate result can be of higher
            // precision, which changes behavior.
            const normalizedX = vector.x / mag;
            const normalizedY = vector.y / mag;
            const normalizedZ = vector.z / mag;

            return new Vector3(normalizedX * maxLength, normalizedY * maxLength, normalizedZ * maxLength);
        }

        return vector;
    }

    // *undoc* --- there's a property now
    static Magnitude(vector: Vector3)
    {
        return vec3Length(vector);
    }

    // Returns the length of this vector (RO).
    get magnitude()
    {
        return vec3Length(this);
    }

    // *undoc* --- there's a property now
    static SqrMagnitude(vector: Vector3)
    {
        return vec3LengthSquared(vector);
    }

    // Returns the squared length of this vector (RO).
    get sqrMagnitude()
    {
        return vec3LengthSquared(this);
    }

    // Returns a vector that is made from the smallest components of two vectors.
    static Min(lhs: Vector3, rhs: Vector3)
    {
        return new Vector3(Mathf.Min(lhs.x, rhs.x), Mathf.Min(lhs.y, rhs.y), Mathf.Min(lhs.z, rhs.z));
    }

    // Returns a vector that is made from the largest components of two vectors.
    static Max(lhs: Vector3, rhs: Vector3)
    {
        return new Vector3(Mathf.Max(lhs.x, rhs.x), Mathf.Max(lhs.y, rhs.y), Mathf.Max(lhs.z, rhs.z));
    }

    static readonly zero = Object.freeze(new Vector3(0, 0, 0));
    static readonly one = Object.freeze(new Vector3(1, 1, 1));
    static readonly up = Object.freeze(new Vector3(0, 1, 0));
    static readonly down = Object.freeze(new Vector3(0, -1, 0));
    static readonly left = Object.freeze(new Vector3(-1, 0, 0));
    static readonly right = Object.freeze(new Vector3(1, 0, 0));
    static readonly forward = Object.freeze(new Vector3(0, 0, -1));
    static readonly back = Object.freeze(new Vector3(0, 0, 1));
    static readonly positiveInfinity = Object.freeze(new Vector3(Infinity, Infinity, Infinity));
    static readonly negativeInfinity = Object.freeze(new Vector3(-Infinity, -Infinity, -Infinity));
}
