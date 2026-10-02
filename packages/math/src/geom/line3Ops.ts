import { mathUtil } from '@feng3d/polyfill';
import type { Vector3Like, WritableVector3Like } from './vector3Ops';
import {
    vec3Add,
    vec3Copy,
    vec3Dot,
    vec3Length,
    vec3NormalizeThickness,
    vec3Random,
    vec3Sub,
} from './vector3Ops';

/**
 * `Line3` 运算的**纯函数**形式（issue #134，方案见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md`）。
 *
 * 与 `Segment3` 一样是**嵌套结构**（`{ origin, direction }`，两个 `Vector3`），
 * 实现复用 A1 的 `vec3*` 纯函数。
 *
 * ## 注意 `normalize` 而不是 `Normalize`
 *
 * 原实现里方向向量用的是 `normalize()`（「长度平方 > 0」判定），**不是** `Normalize()`
 * （`kEpsilon` 判定）——退化分支不同，所以这里一律用 `vec3NormalizeThickness(..., 1, ...)`。
 *
 * ## 本文件不做的部分
 *
 * `intersectWithLine3D` 的返回值是 `Line3 | Vector3 | null` 联合类型，需要显式判别字段
 * （方案 §7 阶段 C 的 `__type__`），仍留在 class 内；
 * 它内部用到的纯计算（`Plane` / `Line3` 的各个 ops）都已就绪。
 * `applyMatri4x4`（A3）已改为在 class 内直接委托 `matrix4x4Ops.ts` 的
 * `mat4TransformPoint3` / `mat4TransformVector3`——它的纯函数形式就是这两次变换的组合，
 * 不需要在本文件再加一层只做转发的包装。
 */

/** 纯函数可接受的直线形状：class 实例与纯数据字面量都满足。 */
export interface Line3Like
{
    readonly origin: Vector3Like;
    readonly direction: Vector3Like;
}

/** 可写出的直线目标（`out` 参数用）。 */
export interface WritableLine3Like
{
    origin: WritableVector3Like;
    direction: WritableVector3Like;
}

/** 缺省输出目标：原点为零向量、方向为 +Z（与构造函数的默认一致）。 */
function defaultOut(): WritableLine3Like
{
    return { origin: { x: 0, y: 0, z: 0 }, direction: { x: 0, y: 0, z: 1 } };
}

/**
 * `Line3.fromPoints` 的纯函数版：`origin = p0`、`direction = normalize(p1 - p0)`。
 *
 * 与 `seg3FromPoints` 同理，`origin` 取**值语义**（复制分量）而不是原实现的引用赋值。
 */
export function line3FromPoints(p0: Vector3Like, p1: Vector3Like, out: WritableLine3Like = defaultOut()): WritableLine3Like
{
    vec3Copy(p0, out.origin);
    vec3NormalizeThickness(vec3Sub(p1, p0), 1, out.direction);

    return out;
}

/**
 * `Line3.fromPosAndDir` 的纯函数版：`origin = position`、`direction = normalize(direction)`。
 */
export function line3FromPosAndDir(position: Vector3Like, direction: Vector3Like, out: WritableLine3Like = defaultOut()): WritableLine3Like
{
    vec3Copy(position, out.origin);
    vec3NormalizeThickness(direction, 1, out.direction);

    return out;
}

/**
 * `Line3.random`（静态与实例同义）的纯函数版：随机原点 + 随机方向的归一化。
 */
export function line3Random(out: WritableLine3Like = defaultOut()): WritableLine3Like
{
    vec3Random(1, false, out.origin);
    vec3Random(1, false, out.direction);
    vec3NormalizeThickness(out.direction, 1, out.direction);

    return out;
}

/**
 * `Line3.getPoint` 的纯函数版：`out = direction * length + origin`。
 */
export function line3GetPoint(a: Line3Like, length = 0, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const x = (a.direction.x * length) + a.origin.x;
    const y = (a.direction.y * length) + a.origin.y;
    const z = (a.direction.z * length) + a.origin.z;

    out.x = x;
    out.y = y;
    out.z = z;

    return out;
}

/**
 * `Line3.getPointWithZ` 的纯函数版：取直线上 z 等于给定值的点。
 */
export function line3GetPointWithZ(a: Line3Like, z: number, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    return line3GetPoint(a, (z - a.origin.z) / a.direction.z, out);
}

/**
 * `Line3.closestPointParameterWithPoint` 的纯函数版：`dot(point - origin, direction)`。
 */
export function line3ClosestPointParameterWithPoint(a: Line3Like, point: Vector3Like): number
{
    return vec3Dot(vec3Sub(point, a.origin), a.direction);
}

/**
 * `Line3.closestPointWithPoint` 的纯函数版：直线上离指定点最近的点。
 */
export function line3ClosestPointWithPoint(a: Line3Like, point: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    return line3GetPoint(a, line3ClosestPointParameterWithPoint(a, point), out);
}

/**
 * `Line3.distanceWithPoint` 的纯函数版：点到直线的距离。
 */
export function line3DistanceWithPoint(a: Line3Like, point: Vector3Like): number
{
    return vec3Length(vec3Sub(line3ClosestPointWithPoint(a, point), point));
}

/**
 * `Line3.onWithPoint` 的纯函数版：点到直线距离按 `precision` 判零。
 */
export function line3OnWithPoint(a: Line3Like, point: Vector3Like, precision = mathUtil.PRECISION): boolean
{
    return mathUtil.equals(line3DistanceWithPoint(a, point), 0, precision);
}

/**
 * `Line3.equals` 的纯函数版：对方线的原点与「原点 + 方向」都落在本直线上。
 */
export function line3Equals(a: Line3Like, b: Line3Like, precision = mathUtil.PRECISION): boolean
{
    if (!line3OnWithPoint(a, b.origin, precision))
    {
        return false;
    }
    if (!line3OnWithPoint(a, vec3Add(b.origin, b.direction), precision))
    {
        return false;
    }

    return true;
}

/**
 * `Line3.copy` / `Line3.clone` 的纯函数版：复制原点与方向。
 */
export function line3Copy(a: Line3Like, out: WritableLine3Like = defaultOut()): WritableLine3Like
{
    vec3Copy(a.origin, out.origin);
    vec3Copy(a.direction, out.direction);

    return out;
}
