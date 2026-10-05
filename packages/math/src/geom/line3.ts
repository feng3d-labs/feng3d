import { mathUtil } from '@feng3d/polyfill';
import type { Vector3Like, WritableVector3Like } from './vector3';
import {
    vec3Add,
    vec3Copy,
    vec3Dot,
    vec3Length,
    vec3NormalizeThickness,
    vec3Random,
    vec3Sub,
} from './vector3';

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
 * ## 阶段 C-d：`Line3` class 已删除
 *
 * 原 class 的成员**全部**落到纯函数层（A2h 起就已就绪，本批只是把 class 摘掉）：
 *
 * - `fromPoints` / `fromPosAndDir` / `random` / `getPoint` / `getPointWithZ` /
 *   `closestPointParameterWithPoint` / `closestPointWithPoint` / `distanceWithPoint` /
 *   `onWithPoint` / `equals` / `copy` / `clone` —— 本文件的 `line3*` 函数；
 * - `intersectWithLine3D` —— [intersection.ts](./intersection.ts) 的 `line3IntersectWithLine3D`
 *   （联合类型 + 结构化判别 `'origin' in r`，C-a 已就绪）；
 * - `applyMatri4x4` —— 直接用 `matrix4x4.ts` 的 `mat4TransformPoint3` / `mat4TransformVector3`
 *   两次变换的组合（A3 起就不再加一层只做转发的包装）；
 * - `getPlane`（原先是挂在 `Line3.prototype` 上的 `MixinsLine3` 补丁，定义在 `Plane.ts`）——
 *   [plane.ts](./plane.ts) 的 `planeFromLine3`（本批从 `Plane.ts` 的原型补丁搬来）。
 *
 * 接口与本文件同址（方案 §3.1）：`import { Line3 } from '@feng3d/math'` 一字不改。
 * `Ray3` 是本接口的**类型别名**（见 `Ray3.ts`），所以两个名字指向同一形状。
 */

/** 纯函数可接受的直线形状：纯数据字面量都满足（class 已于 C-d 删除）。 */
export interface Line3Like
{
    readonly origin: Vector3Like;
    readonly direction: Vector3Like;
}

/**
 * `Line3` 纯数据接口（**带判别字段**，方案 §5.9 的 D1 决策）。
 *
 * `Line3Like` / `WritableLine3Like` **刻意不带** `__type__`：它们是 A / B 阶段用来放宽
 * feng3d 签名的「最小形状」，带上判别字段会成片传导给普通字面量消费方（方案 §11.9.1 末段）。
 *
 * ⚠️ `Ray3` 是本接口的类型别名（`export type Ray3 = Line3`），
 * 因此**射线的判别字段也是 `'Line3'`**（`Ray3` 没有自有成员，方案 §11.7.7 的 `Ray3` 行）。
 */
export interface Line3 extends Line3Like
{
    readonly __type__: 'Line3';
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
