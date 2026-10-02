import { mathUtil } from '@feng3d/polyfill';
import { RotationOrder } from '../enums/RotationOrder';
import type { Matrix4x4Like } from './matrix4x4Ops';
import { mat4ToTRS } from './matrix4x4Ops';
import type { Vector3Like, WritableVector3Like } from './vector3Ops';
import { vec3Cross, vec3Dot } from './vector3Ops';

/**
 * `Quaternion` 运算的**纯函数**形式（issue #134，方案见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md`）。
 *
 * 与 `vector3Ops.ts` / `color4Ops.ts` 同构：入参用最小形状 `QuaternionLike`，
 * 只读入参、结果写 `out`（`out` 传自己即就地运算），class 的同名方法转发到这里。
 *
 * ## 两个必须留意的点
 *
 * 1. **缺省 `out` 用 `{ x: 0, y: 0, z: 0, w: 1 }`**（与 `new Quaternion()` 的默认值一致）。
 *    尤其 `quatInverse` 只写 `x/y/z`、`w` 是**从入参带过来**的——缺省 out 若 `w` 取 0 就会错（方案 §10.1 P6）。
 * 2. **`quatToAxisAngle` 不改入参**：原 `toAxisAngle()` 会先 `this.normalize()`（副作用）。
 *    那个副作用留在 class 侧（先归一化再委托），ops 层只用副本，保持"纯函数不修改入参"的契约。
 *
 * 依赖：`@feng3d/polyfill` 的 `mathUtil`（精度与默认旋转序）、`../enums/RotationOrder`、
 * `./vector3Ops`（`vec3Dot` / `vec3Cross` 与向量类型）、以及 `./matrix4x4Ops` 的**类型**
 * （type-only，A3 起从 `./Matrix4x4` 改为引 ops 文件）与值函数 `mat4ToTRS`（`quatFromMatrix`）。
 *
 * ## 阶段 C-e：`Quaternion` class 已删除
 *
 * 原 class 的成员**全部**落到纯函数层（A2b 起就已就绪，本批只是把 class 摘掉）；
 * `fromMatrix` 用 `mat4ToTRS`，`toAxisAngle` 的「先归一化 this」副作用由调用方显式做
 * （见 `toAxisAngle` 的说明）。接口 `Quaternion` 落在本文件（方案 §3.1）。
 */

/** 纯函数可接受的最小四元数形状：class 实例与纯数据字面量都满足。 */
export interface QuaternionLike
{
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
}

/** 可写出的四元数目标（需要写回时用，例如传 class 实例或普通字面量）。 */
export interface WritableQuaternionLike
{
    x: number;
    y: number;
    z: number;
    w: number;
}

/**
 * `Quaternion` 纯数据接口（**带判别字段**，方案 §5.9 的 D1 决策）。
 *
 * `QuaternionLike` / `WritableQuaternionLike` **刻意不带** `__type__`：它们是 A / B 阶段用来放宽
 * feng3d 签名的「最小形状」，带上判别字段会成片传导给普通字面量消费方。
 *
 * 阶段 C-e 起 class 已删除，本接口与 `*Like` 同址（方案 §3.1）：
 * `import { Quaternion } from '@feng3d/math'` 一字不改。
 * 原 `Quaternion.ts` 里 `declare global { interface MixinsQuaternion }` 的声明合并
 * （`Matrix4x4.ts` 末尾给它加的 `toMatrix` 原型方法）一并消失，
 * 纯函数形态是 `matrix4x4Ops.quatToMatrix4x4`（见 `matrix4x4Ops.ts`）。
 */
export interface Quaternion extends QuaternionLike
{
    readonly __type__: 'Quaternion';
}

/** 缺省输出目标：与 `new Quaternion()` 的默认值一致（见文件头）。 */
const DEFAULT_OUT: WritableQuaternionLike = { x: 0, y: 0, z: 0, w: 1 };

/**
 * `Quaternion.set` 的纯函数版：用四个分量填充 `out`（缺省新建）。
 */
export function quatSet(x = 0, y = 0, z = 0, w = 1, out: WritableQuaternionLike = { ...DEFAULT_OUT }): WritableQuaternionLike
{
    out.x = x;
    out.y = y;
    out.z = z;
    out.w = w;

    return out;
}

/**
 * `Quaternion.random`（**静态与实例同义**）的纯函数版：三个欧拉角各取 `[0, 2π)` 的随机值。
 *
 * ⚠️ **这条是阶段 C-e 补上的缺口**：原 class 的 `random()` 并没有委托给纯函数层
 * （它自己调 `this.fromEuler(2πr, 2πr, 2πr)`），所以删 class 时会把「随机四元数」这个能力
 * 一起删掉。本函数按原实现逐字重写（`Math.random()` 的**调用次数与顺序**都与原来一致），
 * 与 `planeRandom` / `eulerRandom` / `mat4Random` / `sphereRandom` 同构。
 */
export function quatRandom(out: WritableQuaternionLike = { ...DEFAULT_OUT }): WritableQuaternionLike
{
    return quatFromEuler(
        Math.PI * 2 * Math.random(),
        Math.PI * 2 * Math.random(),
        Math.PI * 2 * Math.random(),
        mathUtil.DefaultRotationOrder,
        out);
}

/**
 * `Quaternion.fromArray` 的纯函数版：从数组 `offset` 起读四位写进 `out`（缺省新建）。
 */
export function quatFromArray(array: ArrayLike<number>, offset = 0, out: WritableQuaternionLike = { ...DEFAULT_OUT }): WritableQuaternionLike
{
    out.x = array[offset];
    out.y = array[offset + 1];
    out.z = array[offset + 2];
    out.w = array[offset + 3];

    return out;
}

/**
 * `Quaternion.toArray` 的纯函数版：把四位写进 `array` 的 `offset` 起并返回该数组。
 */
export function quatToArray(q: QuaternionLike, array?: number[], offset = 0): number[]
{
    const target = array || [];

    target[offset] = q.x;
    target[offset + 1] = q.y;
    target[offset + 2] = q.z;
    target[offset + 3] = q.w;

    return target;
}

/**
 * `Quaternion.magnitude` 的纯函数版：四元数模长。
 */
export function quatMagnitude(q: QuaternionLike): number
{
    return Math.sqrt((q.w * q.w) + (q.x * q.x) + (q.y * q.y) + (q.z * q.z));
}

/**
 * `Quaternion.copy` / `Quaternion.clone` 的纯函数版：把 `a` 复制进 `out`（缺省新建）。
 */
export function quatCopy(a: QuaternionLike, out: WritableQuaternionLike = { ...DEFAULT_OUT }): WritableQuaternionLike
{
    out.x = a.x;
    out.y = a.y;
    out.z = a.z;
    out.w = a.w;

    return out;
}

/**
 * `Quaternion.mult` / `Quaternion.multTo` 的纯函数版：四元数乘法。
 *
 * 所有分量先取到局部变量再写 `out`，所以 `out === a`（就地乘法）安全。
 */
export function quatMult(a: QuaternionLike, b: QuaternionLike, out: WritableQuaternionLike = { ...DEFAULT_OUT }): WritableQuaternionLike
{
    const ax = a.x;
    const ay = a.y;
    const az = a.z;
    const aw = a.w;
    const bx = b.x;
    const by = b.y;
    const bz = b.z;
    const bw = b.w;

    out.x = (ax * bw) + (aw * bx) + (ay * bz) - (az * by);
    out.y = (ay * bw) + (aw * by) + (az * bx) - (ax * bz);
    out.z = (az * bw) + (aw * bz) + (ax * by) - (ay * bx);
    out.w = (aw * bw) - (ax * bx) - (ay * by) - (az * bz);

    return out;
}

/**
 * `Quaternion.inverse` / `Quaternion.inverseTo` 的纯函数版：共轭（取负 `x/y/z`，`w` 不变）。
 *
 * `w` 显式从入参带过来：原实现的 `inverseTo` 靠 `target.copy(this)` 保留 `w`，
 * 缺省 out 新建时必须自己写，否则会留下默认值 1（方案 §10.1 P6）。
 */
export function quatInverse(a: QuaternionLike, out: WritableQuaternionLike = { ...DEFAULT_OUT }): WritableQuaternionLike
{
    out.x = -a.x;
    out.y = -a.y;
    out.z = -a.z;
    out.w = a.w;

    return out;
}

/**
 * `Quaternion.multiplyVector` 的纯函数版：四元数乘一个向量（结果是四元数）。
 */
export function quatMultiplyVector(q: QuaternionLike, vector: Vector3Like, out: WritableQuaternionLike = { ...DEFAULT_OUT }): WritableQuaternionLike
{
    const x2 = vector.x;
    const y2 = vector.y;
    const z2 = vector.z;

    out.w = -(q.x * x2) - (q.y * y2) - (q.z * z2);
    out.x = (q.w * x2) + (q.y * z2) - (q.z * y2);
    out.y = (q.w * y2) - (q.x * z2) + (q.z * x2);
    out.z = (q.w * z2) + (q.x * y2) - (q.y * x2);

    return out;
}

/**
 * `Quaternion.fromAxisAngle` 的纯函数版：绕 `axis` 转 `angle` 弧度，末尾归一化。
 */
export function quatFromAxisAngle(axis: Vector3Like, angle: number, out: WritableQuaternionLike = { ...DEFAULT_OUT }): WritableQuaternionLike
{
    const sinA = Math.sin(angle / 2);
    const cosA = Math.cos(angle / 2);

    out.x = axis.x * sinA;
    out.y = axis.y * sinA;
    out.z = axis.z * sinA;
    out.w = cosA;

    return quatNormalize(out, 1, out);
}

/**
 * `Quaternion.toAxisAngle` 的纯函数版：解出轴与角度（弧度）。
 *
 * **不修改入参**：内部对副本归一化。原实例方法会先 `this.normalize()`，
 * 那个副作用由 class 侧保留（见文件头）。
 *
 * @returns `[轴, 弧度]`
 */
export function quatToAxisAngle(q: QuaternionLike, targetAxis: WritableVector3Like = { x: 0, y: 0, z: 0 }): [WritableVector3Like, number]
{
    const n = quatNormalize(q);
    const angle = 2 * Math.acos(n.w);
    const s = Math.sqrt(1 - (n.w * n.w)); // 归一化后 w ≤ 1，所以该项非负

    if (s < 0.001)
    {
        // s 接近 0 时轴的方向不重要
        targetAxis.x = n.x;
        targetAxis.y = n.y;
        targetAxis.z = n.z;
    }
    else
    {
        targetAxis.x = n.x / s;
        targetAxis.y = n.y / s;
        targetAxis.z = n.z / s;
    }

    return [targetAxis, angle];
}

/**
 * `Quaternion.fromUnitVectors` 的纯函数版：把单位向量 `u` 转到 `v` 所需的旋转。
 */
export function quatFromUnitVectors(u: Vector3Like, v: Vector3Like, out: WritableQuaternionLike = { ...DEFAULT_OUT }): WritableQuaternionLike
{
    let r = vec3Dot(u, v) + 1;

    if (r < mathUtil.PRECISION)
    {
        r = 0;

        if (Math.abs(u.x) > Math.abs(u.z))
        {
            out.x = -u.y;
            out.y = u.x;
            out.z = 0;
            out.w = r;
        }
        else
        {
            out.x = 0;
            out.y = -u.z;
            out.z = u.y;
            out.w = r;
        }
    }
    else
    {
        const a = vec3Cross(u, v);

        out.x = a.x;
        out.y = a.y;
        out.z = a.z;
        out.w = r;
    }

    return quatNormalize(out, 1, out);
}

/**
 * `Quaternion.slerp` 的纯函数版：球面插值。
 *
 * 逐字保留原实现的分支（含 `cosHalfTheta < 0` 时取反、`>= 1` 时回退到 `a`、
 * `sqrSinHalfTheta` 极小时退化为线性插值再归一化）。
 */
export function quatSlerp(a: QuaternionLike, b: QuaternionLike, t: number, out: WritableQuaternionLike = { ...DEFAULT_OUT }): WritableQuaternionLike
{
    if (t === 0)
    {
        return quatCopy(a, out);
    }
    if (t === 1)
    {
        return quatCopy(b, out);
    }

    const x = a.x;
    const y = a.y;
    const z = a.z;
    const w = a.w;

    let cosHalfTheta = (w * b.w) + (x * b.x) + (y * b.y) + (z * b.z);

    if (cosHalfTheta < 0)
    {
        out.w = -b.w;
        out.x = -b.x;
        out.y = -b.y;
        out.z = -b.z;

        cosHalfTheta = -cosHalfTheta;
    }
    else
    {
        quatCopy(b, out);
    }

    if (cosHalfTheta >= 1.0)
    {
        out.w = w;
        out.x = x;
        out.y = y;
        out.z = z;

        return out;
    }

    const sqrSinHalfTheta = 1.0 - (cosHalfTheta * cosHalfTheta);

    if (sqrSinHalfTheta <= Number.EPSILON)
    {
        const s = 1 - t;

        out.w = (s * w) + (t * out.w);
        out.x = (s * x) + (t * out.x);
        out.y = (s * y) + (t * out.y);
        out.z = (s * z) + (t * out.z);

        quatNormalize(out, 1, out);

        return out;
    }

    const sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
    const halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
    const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
    const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

    out.w = (w * ratioA) + (out.w * ratioB);
    out.x = (x * ratioA) + (out.x * ratioB);
    out.y = (y * ratioA) + (out.y * ratioB);
    out.z = (z * ratioA) + (out.z * ratioB);

    return out;
}

/**
 * `Quaternion.lerp` 的纯函数版：线性插值后归一化。
 *
 * 注意：原方法**没有返回值**，class 侧也保持无返回值。
 */
export function quatLerp(qa: QuaternionLike, qb: QuaternionLike, t: number, out: WritableQuaternionLike = { ...DEFAULT_OUT }): WritableQuaternionLike
{
    const w1 = qa.w;
    const x1 = qa.x;
    const y1 = qa.y;
    const z1 = qa.z;
    let w2 = qb.w;
    let x2 = qb.x;
    let y2 = qb.y;
    let z2 = qb.z;

    // 取最短方向
    if ((w1 * w2) + (x1 * x2) + (y1 * y2) + (z1 * z2) < 0)
    {
        w2 = -w2;
        x2 = -x2;
        y2 = -y2;
        z2 = -z2;
    }

    out.w = w1 + (t * (w2 - w1));
    out.x = x1 + (t * (x2 - x1));
    out.y = y1 + (t * (y2 - y1));
    out.z = z1 + (t * (z2 - z1));

    const len = 1.0 / Math.sqrt((out.w * out.w) + (out.x * out.x) + (out.y * out.y) + (out.z * out.z));

    out.w *= len;
    out.x *= len;
    out.y *= len;
    out.z *= len;

    return out;
}

/**
 * `Quaternion.normalize` 的纯函数版：归一化到长度 `val`（缺省 1）。
 *
 * 长度恰为 0 时置为 `(0,0,0,1)`。
 */
export function quatNormalize(a: QuaternionLike, val = 1, out: WritableQuaternionLike = { ...DEFAULT_OUT }): WritableQuaternionLike
{
    let l = (a.x * a.x) + (a.y * a.y) + (a.z * a.z) + (a.w * a.w);

    if (l === 0)
    {
        out.x = 0;
        out.y = 0;
        out.z = 0;
        out.w = 1;
    }
    else
    {
        l = Math.sqrt(l);
        l = val / l;
        out.x = a.x * l;
        out.y = a.y * l;
        out.z = a.z * l;
        out.w = a.w * l;
    }

    return out;
}

/**
 * `Quaternion.normalizeFast` 的纯函数版：近似归一化（快速）。
 *
 * 系数 `f` 恰为 0 时四分量全部置 0（与实现一致，注意这里是全 0 而非 `w=1`）。
 */
export function quatNormalizeFast(a: QuaternionLike, out: WritableQuaternionLike = { ...DEFAULT_OUT }): WritableQuaternionLike
{
    const f = (3.0 - ((a.x * a.x) + (a.y * a.y) + (a.z * a.z) + (a.w * a.w))) / 2.0;

    if (f === 0)
    {
        out.x = 0;
        out.y = 0;
        out.z = 0;
        out.w = 0;
    }
    else
    {
        out.x = a.x * f;
        out.y = a.y * f;
        out.z = a.z * f;
        out.w = a.w * f;
    }

    return out;
}

/**
 * `Quaternion.toString` 的纯函数版（输出文本与实现逐字一致）。
 */
export function quatToString(a: QuaternionLike): string
{
    return `{this.x:${a.x} this.y:${a.y} this.z:${a.z} this.w:${a.w}}`;
}

/**
 * `Quaternion.fromMatrix` 的纯函数版：取矩阵 TRS 的第二项当欧拉角。
 *
 * 入参是 `Matrix4x4Like`（只要求 `elements`），**不再是 class 类型**——
 * `Matrix4x4` 已于 A2d 纯函数化（`mat4ToTRS`），所以这里不再依赖 class。
 */
export function quatFromMatrix(matrix: Matrix4x4Like, out: WritableQuaternionLike = { ...DEFAULT_OUT }): WritableQuaternionLike
{
    const v = mat4ToTRS(matrix)[1];

    return quatFromEuler(v.x, v.y, v.z, mathUtil.DefaultRotationOrder, out);
}

/**
 * `Quaternion.rotatePoint` 的纯函数版：旋转一个点，结果写进 `out`（缺省新建）。
 */
export function quatRotatePoint(q: QuaternionLike, point: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const x2 = point.x;
    const y2 = point.y;
    const z2 = point.z;

    // p*q'
    const w1 = -(q.x * x2) - (q.y * y2) - (q.z * z2);
    const x1 = (q.w * x2) + (q.y * z2) - (q.z * y2);
    const y1 = (q.w * y2) - (q.x * z2) + (q.z * x2);
    const z1 = (q.w * z2) + (q.x * y2) - (q.y * x2);

    out.x = -(w1 * q.x) + (x1 * q.w) - (y1 * q.z) + (z1 * q.y);
    out.y = -(w1 * q.y) + (x1 * q.z) + (y1 * q.w) - (z1 * q.x);
    out.z = -(w1 * q.z) - (x1 * q.y) + (y1 * q.x) + (z1 * q.w);

    return out;
}

/**
 * `Quaternion.integrate` / `Quaternion.integrateTo` 的纯函数版：按角速度积分一个时间步。
 *
 * 语义是**在入参基础上累加**：先把 `a` 复制进 `out`，再累加增量；
 * `bx/by/bz/bw` 取的是**累加前**的值（与实现一致）。
 */
export function quatIntegrate(q: QuaternionLike, angularVelocity: Vector3Like, dt: number, angularFactor: Vector3Like, out: WritableQuaternionLike = { ...DEFAULT_OUT }): WritableQuaternionLike
{
    const ax = angularVelocity.x * angularFactor.x;
    const ay = angularVelocity.y * angularFactor.y;
    const az = angularVelocity.z * angularFactor.z;

    const bx = q.x;
    const by = q.y;
    const bz = q.z;
    const bw = q.w;

    const halfDt = dt * 0.5;

    quatCopy(q, out);

    out.x += halfDt * ((ax * bw) + (ay * bz) - (az * by));
    out.y += halfDt * ((ay * bw) + (az * bx) - (ax * bz));
    out.z += halfDt * ((az * bw) + (ax * by) - (ay * bx));
    out.w += halfDt * (-(ax * bx) - (ay * by) - (az * bz));

    return out;
}

/**
 * `Quaternion.vmult` 的纯函数版：四元数乘一个向量（结果写进向量）。
 */
export function quatVmult(q: QuaternionLike, v: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const x = v.x;
    const y = v.y;
    const z = v.z;

    const qx = q.x;
    const qy = q.y;
    const qz = q.z;
    const qw = q.w;

    // q*v
    const ix = (qw * x) + (qy * z) - (qz * y);
    const iy = (qw * y) + (qz * x) - (qx * z);
    const iz = (qw * z) + (qx * y) - (qy * x);
    const iw = -(qx * x) - (qy * y) - (qz * z);

    out.x = (ix * qw) + (iw * -qx) + (iy * -qz) - (iz * -qy);
    out.y = (iy * qw) + (iw * -qy) + (iz * -qx) - (ix * -qz);
    out.z = (iz * qw) + (iw * -qz) + (ix * -qy) - (iy * -qx);

    return out;
}

/**
 * `Quaternion.fromEuler` 的纯函数版：从欧拉角（弧度）构造四元数。
 *
 * 逐字保留六种旋转序的分支；**未知序时不写任何分量**（与实现一致——原方法此时直接 `return this`）。
 */
export function quatFromEuler(x: number, y: number, z: number, order: RotationOrder = mathUtil.DefaultRotationOrder, out: WritableQuaternionLike = { ...DEFAULT_OUT }): WritableQuaternionLike
{
    const cosX = Math.cos(x / 2);
    const coxY = Math.cos(y / 2);
    const cosZ = Math.cos(z / 2);
    const sinX = Math.sin(x / 2);
    const sinY = Math.sin(y / 2);
    const sinZ = Math.sin(z / 2);

    if (order === RotationOrder.XYZ)
    {
        out.x = (sinX * coxY * cosZ) + (cosX * sinY * sinZ);
        out.y = (cosX * sinY * cosZ) - (sinX * coxY * sinZ);
        out.z = (cosX * coxY * sinZ) + (sinX * sinY * cosZ);
        out.w = (cosX * coxY * cosZ) - (sinX * sinY * sinZ);
    }
    else if (order === RotationOrder.YXZ)
    {
        out.x = (sinX * coxY * cosZ) + (cosX * sinY * sinZ);
        out.y = (cosX * sinY * cosZ) - (sinX * coxY * sinZ);
        out.z = (cosX * coxY * sinZ) - (sinX * sinY * cosZ);
        out.w = (cosX * coxY * cosZ) + (sinX * sinY * sinZ);
    }
    else if (order === RotationOrder.ZXY)
    {
        out.x = (sinX * coxY * cosZ) - (cosX * sinY * sinZ);
        out.y = (cosX * sinY * cosZ) + (sinX * coxY * sinZ);
        out.z = (cosX * coxY * sinZ) + (sinX * sinY * cosZ);
        out.w = (cosX * coxY * cosZ) - (sinX * sinY * sinZ);
    }
    else if (order === RotationOrder.ZYX)
    {
        out.x = (sinX * coxY * cosZ) - (cosX * sinY * sinZ);
        out.y = (cosX * sinY * cosZ) + (sinX * coxY * sinZ);
        out.z = (cosX * coxY * sinZ) - (sinX * sinY * cosZ);
        out.w = (cosX * coxY * cosZ) + (sinX * sinY * sinZ);
    }
    else if (order === RotationOrder.YZX)
    {
        out.x = (sinX * coxY * cosZ) + (cosX * sinY * sinZ);
        out.y = (cosX * sinY * cosZ) + (sinX * coxY * sinZ);
        out.z = (cosX * coxY * sinZ) - (sinX * sinY * cosZ);
        out.w = (cosX * coxY * cosZ) - (sinX * sinY * sinZ);
    }
    else if (order === RotationOrder.XZY)
    {
        out.x = (sinX * coxY * cosZ) - (cosX * sinY * sinZ);
        out.y = (cosX * sinY * cosZ) - (sinX * coxY * sinZ);
        out.z = (cosX * coxY * sinZ) + (sinX * sinY * cosZ);
        out.w = (cosX * coxY * cosZ) + (sinX * sinY * sinZ);
    }

    return out;
}

/**
 * `Quaternion.equals` 的纯函数版：按 `precision` 判等，**整体内积为负时按取负等价比较**。
 *
 * 内积必须整体算：只看 `x` 分量时，`x === 0` 的四元数会被误判（#489）。
 */
export function quatEquals(a: QuaternionLike, b: QuaternionLike, precision = mathUtil.PRECISION): boolean
{
    const dot = (a.x * b.x) + (a.y * b.y) + (a.z * b.z) + (a.w * b.w);

    if (dot >= 0)
    {
        if (!mathUtil.equals(a.x - b.x, 0, precision))
        {
            return false;
        }
        if (!mathUtil.equals(a.y - b.y, 0, precision))
        {
            return false;
        }
        if (!mathUtil.equals(a.z - b.z, 0, precision))
        {
            return false;
        }
        if (!mathUtil.equals(a.w - b.w, 0, precision))
        {
            return false;
        }
    }
    else
    {
        if (!mathUtil.equals(a.x + b.x, 0, precision))
        {
            return false;
        }
        if (!mathUtil.equals(a.y + b.y, 0, precision))
        {
            return false;
        }
        if (!mathUtil.equals(a.z + b.z, 0, precision))
        {
            return false;
        }
        if (!mathUtil.equals(a.w + b.w, 0, precision))
        {
            return false;
        }
    }

    return true;
}
