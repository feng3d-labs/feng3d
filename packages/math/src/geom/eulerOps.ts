import { mathUtil } from '@feng3d/polyfill';
import { RotationOrder } from '../enums/RotationOrder';
import type { Matrix4x4Like } from './matrix4x4Ops';
import { mat4FromQuaternion } from './matrix4x4Ops';
import type { QuaternionLike } from './quaternionOps';
import { quatFromEuler } from './quaternionOps';
import type { Vector3Like, WritableVector3Like } from './vector3Ops';
import { vec3From } from './vector3Ops';

/**
 * `Euler` 运算的**纯函数**形式（issue #134，方案见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md` 阶段 A2l）。
 *
 * 与 `vector3Ops.ts` / `quaternionOps.ts` / `line3Ops.ts` 同构：入参用最小形状 `EulerLike`（只读），
 * 结果写 `out`（`out` 传自己即就地运算），class 的同名方法转发到这里。
 *
 * ## 三个必须留意的点
 *
 * 1. **缺省 `out` 与 `new Euler()` 的默认值一致**（`x/y/z = 0`、`order = mathUtil.DefaultRotationOrder`）。
 *    `eulerSet` 在 `order === undefined` 时**不写** `order`，此时缺省 out 的 `order` 必须仍是默认旋转序（方案 §10.1 P6）。
 * 2. **`eulerFromRotationMatrix` 逐字照抄原实现**：六个旋转序分支的公式、`Math.abs(...) < 0.9999999` 的退化分支、
 *    以及「未知旋转序：三个轴都不参与计算、保持对象原有角度不变 + `console.warn`」的行为全部保留。
 *    照抄是有意的——`RotationOrder` 的枚举值顺序与字面顺序不一致（`XYZ=0, ZXY=1, ZYX=2, YXZ=3, YZX=4, XZY=5`），
 *    而 `Matrix4x4.fromTRS` / `toTRS` 的部分分支名与公式本身存在既有错位，翻译阶段不"顺手纠正"。
 * 3. **`eulerReorder` 会改数值**（先转四元数再按新序分解回欧拉角）：即便 `newOrder === a.order`，
 *    角度也会被归一到 `[-π, π]` 附近的等价表示，这不是本函数引入的变化，见 `test/geom/Euler.spec.ts` 的实测记录。
 *
 * 依赖：`@feng3d/polyfill` 的 `mathUtil`（默认旋转序）、`../enums/RotationOrder`、
 * `./matrix4x4Ops`（`mat4FromQuaternion`）、`./quaternionOps`（`quatFromEuler`）、`./vector3Ops`（`vec3From`）。
 * 运行时依赖方向是 `Euler.ts → eulerOps.ts → {matrix4x4,quaternion,vector3}Ops.ts`，对方类型全部 type-only 引入，不成环。
 */

/** 纯函数可接受的最小欧拉角形状：class 实例与纯数据字面量都满足。 */
export interface EulerLike
{
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly order: RotationOrder;
}

/** 可写出的欧拉角目标（纯函数的 `out` 参数用）。 */
export interface WritableEulerLike
{
    x: number;
    y: number;
    z: number;
    order: RotationOrder;
}

/** 缺省输出目标：与 `new Euler()` 的默认值一致（见文件头第 1 条）。 */
const DEFAULT_OUT: WritableEulerLike = { x: 0, y: 0, z: 0, order: mathUtil.DefaultRotationOrder };

/**
 * `Euler.set` 的纯函数版：写入三个分量；`order` 为 `undefined` 时**不修改** `out.order`（与 class 一致）。
 */
export function eulerSet(x: number, y: number, z: number, order?: RotationOrder, out: WritableEulerLike = { ...DEFAULT_OUT }): WritableEulerLike
{
    out.x = x;
    out.y = y;
    out.z = z;
    if (order !== undefined)
    {
        out.order = order;
    }

    return out;
}

/**
 * `Euler.random` 的纯函数版：三个分量取 `[0, 2π)` 随机值，旋转序取 `0..5` 的随机整数。
 *
 * `mathUtil.randInt(0, 5)` 的调用与 class 原实现逐字一致（顺序与次数都不变）。
 */
export function eulerRandom(out: WritableEulerLike = { ...DEFAULT_OUT }): WritableEulerLike
{
    out.x = Math.random() * Math.PI * 2;
    out.y = Math.random() * Math.PI * 2;
    out.z = Math.random() * Math.PI * 2;
    out.order = mathUtil.randInt(0, 5);

    return out;
}

/**
 * `Euler.clone` 的纯函数版：复制四个字段。
 */
export function eulerCopy(a: EulerLike, out: WritableEulerLike = { ...DEFAULT_OUT }): WritableEulerLike
{
    out.x = a.x;
    out.y = a.y;
    out.z = a.z;
    out.order = a.order;

    return out;
}

/**
 * `Euler.fromRotationMatrix` 的纯函数版：从只含旋转的矩阵分解出欧拉角。
 *
 * `order` 缺省取 `a.order`；未知旋转序时不写 `x/y/z`（保持 `out` 的原值）、把 `order` 写为传入值并 `console.warn`。
 * 六个分支的公式与 `Matrix4x4.prototype.toTRS` 的旋转部分**逐字相同**（两边本来就是同一份实现）。
 */
export function eulerFromRotationMatrix(
    a: EulerLike,
    rotationMatrix: Matrix4x4Like,
    order?: RotationOrder,
    out: WritableEulerLike = { ...DEFAULT_OUT },
): WritableEulerLike
{
    const te = rotationMatrix.elements;
    const m11 = te[0];
    const m12 = te[4];
    const m13 = te[8];
    const m21 = te[1];
    const m22 = te[5];
    const m23 = te[9];
    const m31 = te[2];
    const m32 = te[6];
    const m33 = te[10];

    if (order === undefined)
    {
        order = a.order;
    }

    let x: number;
    let y: number;
    let z: number;

    switch (order)
    {
        case RotationOrder.XYZ:
            y = Math.asin(mathUtil.clamp(m13, -1, 1));
            if (Math.abs(m13) < 0.9999999)
            {
                x = Math.atan2(-m23, m33);
                z = Math.atan2(-m12, m11);
            }
            else
            {
                x = Math.atan2(m32, m22);
                z = 0;
            }
            break;
        case RotationOrder.YXZ:
            x = Math.asin(-mathUtil.clamp(m23, -1, 1));
            if (Math.abs(m23) < 0.9999999)
            {
                y = Math.atan2(m13, m33);
                z = Math.atan2(m21, m22);
            }
            else
            {
                y = Math.atan2(-m31, m11);
                z = 0;
            }
            break;

        case RotationOrder.ZXY:
            x = Math.asin(mathUtil.clamp(m32, -1, 1));
            if (Math.abs(m32) < 0.9999999)
            {
                y = Math.atan2(-m31, m33);
                z = Math.atan2(-m12, m22);
            }
            else
            {
                y = 0;
                z = Math.atan2(m21, m11);
            }
            break;

        case RotationOrder.ZYX:
            y = Math.asin(-mathUtil.clamp(m31, -1, 1));
            if (Math.abs(m31) < 0.9999999)
            {
                x = Math.atan2(m32, m33);
                z = Math.atan2(m21, m11);
            }
            else
            {
                x = 0;
                z = Math.atan2(-m12, m22);
            }
            break;
        case RotationOrder.YZX:
            z = Math.asin(mathUtil.clamp(m21, -1, 1));
            if (Math.abs(m21) < 0.9999999)
            {
                x = Math.atan2(-m23, m22);
                y = Math.atan2(-m31, m11);
            }
            else
            {
                x = 0;
                y = Math.atan2(m13, m33);
            }
            break;

        case RotationOrder.XZY:
            z = Math.asin(-mathUtil.clamp(m12, -1, 1));
            if (Math.abs(m12) < 0.9999999)
            {
                x = Math.atan2(m32, m22);
                y = Math.atan2(m13, m11);
            }
            else
            {
                x = Math.atan2(-m23, m33);
                y = 0;
            }
            break;
        default:
            // 未知旋转顺序：三个轴都不参与本次计算，保持对象原有角度不变
            x = a.x;
            y = a.y;
            z = a.z;
            console.warn(`THREE.Euler: .fromRotationMatrix() encountered an unknown order: ${order}`);
    }

    out.x = x;
    out.y = y;
    out.z = z;
    out.order = order;

    return out;
}

/**
 * `Euler.fromQuaternion` 的纯函数版：四元数 → 旋转矩阵 → 欧拉角。
 *
 * 与 class 一致地先转矩阵再分解（`order` 缺省取 `a.order`）。
 */
export function eulerFromQuaternion(a: EulerLike, q: QuaternionLike, order?: RotationOrder, out: WritableEulerLike = { ...DEFAULT_OUT }): WritableEulerLike
{
    const matrix = mat4FromQuaternion(q);

    eulerFromRotationMatrix(a, matrix, order, out);

    return out;
}

/**
 * `Euler.fromVector3` 的纯函数版：把向量的三个分量当作欧拉角（`order` 缺省取 `a.order`，且一定写入）。
 */
export function eulerFromVector3(a: EulerLike, v: Vector3Like, order?: RotationOrder, out: WritableEulerLike = { ...DEFAULT_OUT }): WritableEulerLike
{
    if (order === undefined)
    {
        order = a.order;
    }

    eulerSet(v.x, v.y, v.z, order, out);

    return out;
}

/**
 * `Euler.reorder` 的纯函数版：在不改变旋转量的前提下更换旋转序。
 *
 * 实现与原 class 相同：`a` → 四元数 → 按 `newOrder` 分解回欧拉角（结果写 `out`）。
 * ⚠️ 分量数值会被归一化，见文件头第 3 条。
 */
export function eulerReorder(a: EulerLike, newOrder: RotationOrder, out: WritableEulerLike = { ...DEFAULT_OUT }): WritableEulerLike
{
    const quaternion = quatFromEuler(a.x, a.y, a.z, a.order);

    eulerFromQuaternion(a, quaternion, newOrder, out);

    return out;
}

/**
 * `Euler.equals` 的纯函数版：四个字段全等（严格 `===`，无精度参数）。
 */
export function eulerEquals(a: EulerLike, b: EulerLike): boolean
{
    return (b.x === a.x) && (b.y === a.y) && (b.z === a.z) && (b.order === a.order);
}

/**
 * `Euler.fromArray` 的纯函数版：从数组读 `[x, y, z, order]`（`offset` 为起始下标）。
 *
 * 与 class 一致地**四个字段全写**，所以缺省 `out` 的初值不影响结果（仍与 `new Euler()` 对齐）。
 */
export function eulerFromArray(array: ArrayLike<number>, offset = 0, out: WritableEulerLike = { ...DEFAULT_OUT }): WritableEulerLike
{
    out.x = array[offset];
    out.y = array[offset + 1];
    out.z = array[offset + 2];
    out.order = array[offset + 3];

    return out;
}

/**
 * `Euler.toArray` 的纯函数版：写出 `[x, y, z, order]`（`offset` 为起始下标，返回同一个数组）。
 */
export function eulerToArray(a: EulerLike, array: number[] = [], offset = 0): number[]
{
    array[offset] = a.x;
    array[offset + 1] = a.y;
    array[offset + 2] = a.z;
    array[offset + 3] = a.order;

    return array;
}

/**
 * `Euler.toVector3` 的纯函数版：把三个角度分量写进目标向量。
 *
 * 只取 `x/y/z`（不含 `order`），与 class 一致。
 */
export function eulerToVector3(a: EulerLike, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    vec3From(a.x, a.y, a.z, out);

    return out;
}
