import { mathUtil } from '@feng3d/polyfill';
import type { WritableLine3Like } from './line3';
import { line3ClosestPointWithPoint, line3FromPoints } from './line3';
import type { Vector3Like, WritableVector3Like } from './vector3';
import {
    vec3Copy,
    vec3Cross,
    vec3DistanceSquared,
    vec3Equals,
    vec3NormalizeThickness,
    vec3Random,
    vec3Sub,
} from './vector3';

/**
 * `Segment3` 运算的**纯函数**形式（issue #134，方案见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md`）。
 *
 * ## 几何类型与数值类型的不同
 *
 * `Vector3` / `Quaternion` / `Color4` 的 `XxxLike` 是一层**平的**数字分量；
 * 而 `Segment3` 这类几何类型是**嵌套结构**——它持有两个 `Vector3`（`p0` / `p1`）。
 * 所以这里的形状是 `{ p0: Vector3Like; p1: Vector3Like }`，实现跨类型运算时
 * 直接复用已就绪的 `vec3*` 纯函数（A1 阶段完成）。
 *
 * ## 一处有意的语义收紧
 *
 * 原 `fromPoints(p0, p1)` 是**引用赋值**（`this.p0 = p0`），于是外部改了 `p0` 会牵动线段。
 * 纯数据字面量之间不存在"共享引用"这回事，所以 `seg3FromPoints` 取**值语义**（复制分量）——
 * 这是本方案里唯一一处有意的语义收紧，其余函数都逐字保持原行为。
 *
 * ## 阶段 C-c：`Segment3` class 已删除
 *
 * 原 class 的成员**全部**落到纯函数层：
 *
 * - `fromPoints` / `random` / `copy` / `clone` / `getLength*` / `getPoint` / `onWithPoint` /
 *   `projectOnWithPoint` / `getPositionByPoint` / `getNormalWithPoint` / `getPointDistance*` /
 *   `clampPoint` / `equals` —— 本文件（A2g 起就已就绪）；
 * - `getLine`（→ `seg3GetLine`）与 `closestPointWithPoint`（→ `seg3ClosestPointWithPoint`）——
 *   本批新增：A3 把它们留在 class 内，理由是「`getLine` 要产出 `Line3` 实例」，
 *   纯数据形态下 `line3FromPoints` 的字面量与实例同形，这条理由随之消失（方案 §11.7.7 P5）；
 * - `intersectionWithLine` / `intersectionWithSegment`——返回值是联合类型，判别改用**结构化字段**
 *   （`'p0' in r` = 线段、否则是点）替代 `instanceof`，落在
 *   [intersection.ts](./intersection.ts)（跨类型 + `plane` 依赖，放进本文件会造出模块环）。
 *
 * 接口与本文件同址（方案 §3.1）：`import { Segment3 } from '@feng3d/math'` 一字不改。
 */

/** 纯函数可接受的线段形状：class 实例与纯数据字面量都满足。 */
export interface Segment3Like
{
    readonly p0: Vector3Like;
    readonly p1: Vector3Like;
}

/**
 * `Segment3` 纯数据接口（**带判别字段**，方案 §5.9 的 D1 决策）。
 *
 * `Segment3Like` / `WritableSegment3Like` **刻意不带** `__type__`：它们是 A / B 阶段用来放宽
 * feng3d 签名的「最小形状」，带上判别字段会成片传导给普通字面量消费方（方案 §11.9.1 末段）。
 */
export interface Segment3 extends Segment3Like
{
    readonly __type__: 'Segment3';
}

/** 可写出的线段目标（`out` 参数用）。 */
export interface WritableSegment3Like
{
    p0: WritableVector3Like;
    p1: WritableVector3Like;
}

/** 缺省输出目标：两个端点各为零向量。 */
function defaultOut(): WritableSegment3Like
{
    return { p0: { x: 0, y: 0, z: 0 }, p1: { x: 0, y: 0, z: 0 } };
}

/**
 * `Segment3.fromPoints` / `Segment3.fromPoints(实例)` 的纯函数版。
 *
 * 取**值语义**（复制分量）而不是原实现的引用赋值，理由见文件头。
 */
export function seg3FromPoints(p0: Vector3Like, p1: Vector3Like, out: WritableSegment3Like = defaultOut()): WritableSegment3Like
{
    vec3Copy(p0, out.p0);
    vec3Copy(p1, out.p1);

    return out;
}

/**
 * `Segment3.random`（静态与实例同义）的纯函数版：两个端点各取一个随机向量。
 */
export function seg3Random(out: WritableSegment3Like = defaultOut()): WritableSegment3Like
{
    vec3Random(1, false, out.p0);
    vec3Random(1, false, out.p1);

    return out;
}

/**
 * `Segment3.copy` / `Segment3.clone` 的纯函数版：复制两个端点。
 */
export function seg3Copy(a: Segment3Like, out: WritableSegment3Like = defaultOut()): WritableSegment3Like
{
    vec3Copy(a.p0, out.p0);
    vec3Copy(a.p1, out.p1);

    return out;
}

/**
 * `Segment3.getLengthSquared` 的纯函数版：端点距离的平方。
 */
export function seg3GetLengthSquared(a: Segment3Like): number
{
    return vec3DistanceSquared(a.p0, a.p1);
}

/**
 * `Segment3.getLength` 的纯函数版：端点距离。
 */
export function seg3GetLength(a: Segment3Like): number
{
    return Math.sqrt(seg3GetLengthSquared(a));
}

/**
 * `Segment3.getPoint` 的纯函数版：`position = 0` 取 `p0`、`1` 取 `p1`。
 *
 * 等价于原实现 `pout.copy(p0).add(p1.subTo(p0).scaleNumber(position))`；
 * 逐分量算完再写 `out`，所以 `out === p0` 也安全。
 */
export function seg3GetPoint(a: Segment3Like, position: number, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const x = a.p0.x + ((a.p1.x - a.p0.x) * position);
    const y = a.p0.y + ((a.p1.y - a.p0.y) * position);
    const z = a.p0.z + ((a.p1.z - a.p0.z) * position);

    out.x = x;
    out.y = y;
    out.z = z;

    return out;
}

/**
 * `Segment3.getPositionByPoint` 的纯函数版：点在直线上的投影参数。
 */
export function seg3GetPositionByPoint(a: Segment3Like, point: Vector3Like): number
{
    const dx = a.p1.x - a.p0.x;
    const dy = a.p1.y - a.p0.y;
    const dz = a.p1.z - a.p0.z;
    const px = point.x - a.p0.x;
    const py = point.y - a.p0.y;
    const pz = point.z - a.p0.z;

    return ((px * dx) + (py * dy) + (pz * dz)) / ((dx * dx) + (dy * dy) + (dz * dz));
}

/**
 * `Segment3.projectOnWithPoint` 的纯函数版：投影参数四舍五入到 6 位后是否落在 `[0,1]`。
 */
export function seg3ProjectOnWithPoint(a: Segment3Like, point: Vector3Like): boolean
{
    let position = seg3GetPositionByPoint(a, point);

    position = Number(position.toFixed(6));

    return position >= 0 && position <= 1;
}

/**
 * `Segment3.getPointDistanceSquare` 的纯函数版：点到线段的距离平方（投影落在线段外时取到最近端点）。
 */
export function seg3GetPointDistanceSquare(a: Segment3Like, point: Vector3Like): number
{
    const position = seg3GetPositionByPoint(a, point);

    let lengthSquared: number;

    if (position <= 0)
    {
        lengthSquared = vec3DistanceSquared(point, a.p0);
    }
    else if (position >= 1)
    {
        lengthSquared = vec3DistanceSquared(point, a.p1);
    }
    else
    {
        const s0 = vec3DistanceSquared(point, a.p0);
        const s1 = position * position * vec3DistanceSquared(a.p1, a.p0);

        lengthSquared = Math.abs(s0 - s1);
    }

    return lengthSquared;
}

/**
 * `Segment3.getPointDistance` 的纯函数版：点到线段的距离。
 */
export function seg3GetPointDistance(a: Segment3Like, point: Vector3Like): number
{
    return Math.sqrt(seg3GetPointDistanceSquare(a, point));
}

/**
 * `Segment3.onWithPoint` 的纯函数版：点到线段距离是否按 `precision` 判零。
 */
export function seg3OnWithPoint(a: Segment3Like, point: Vector3Like, precision = mathUtil.PRECISION): boolean
{
    return mathUtil.equals(seg3GetPointDistance(a, point), 0, precision);
}

/**
 * `Segment3.getNormalWithPoint` 的纯函数版：线段到点的垂直方向。
 *
 * 注意原实现末尾是 `normalize()`（用「长度平方 > 0」判定）而**不是** `Normalize()`
 * （用 `kEpsilon` 判定）——两者退化分支不同，这里必须用 `vec3NormalizeThickness` 对应前者。
 */
export function seg3GetNormalWithPoint(a: Segment3Like, point: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const direction = vec3Sub(a.p1, a.p0);
    const l1 = vec3Sub(point, a.p0);
    const n = vec3Cross(vec3Cross(direction, l1), direction);

    return vec3NormalizeThickness(n, 1, out);
}

/**
 * `Segment3.clampPoint` 的纯函数版：把点压到线段范围内。
 */
export function seg3ClampPoint(a: Segment3Like, point: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    return seg3GetPoint(a, mathUtil.clamp(seg3GetPositionByPoint(a, point), 0, 1), out);
}

/**
 * `Segment3.equals` 的纯函数版：两个端点按 `precision` 双向比较（方向无关）。
 */
export function seg3Equals(a: Segment3Like, b: Segment3Like, precision = mathUtil.PRECISION): boolean
{
    return (vec3Equals(a.p0, b.p0, precision) && vec3Equals(a.p1, b.p1, precision))
        || (vec3Equals(a.p0, b.p1, precision) && vec3Equals(a.p1, b.p0, precision));
}

/**
 * `Segment3.getLine` 的纯函数版：取线段所在直线（`origin = p0`、`direction = normalize(p1 - p0)`）。
 *
 * 原实现是 `line.fromPoints(this.p0.clone(), this.p1.clone())`——两次 `clone()` 只是为了不与调用方
 * 共享 `Vector3`；`line3FromPoints` 本身已是**值语义**（复制分量），所以直接传 `p0` / `p1`。
 * 缺省 `out` 与 `line3` 的缺省一致（原点替零、方向 +Z）——纯数据形态下没有「构造器默认值」，
 * 这里按同一默认显式写出来，语义与 `new Line3()` 对齐（方案 §10.1 的 P6）。
 */
export function seg3GetLine(
    a: Segment3Like,
    out: WritableLine3Like = { origin: { x: 0, y: 0, z: 0 }, direction: { x: 0, y: 0, z: 1 } },
): WritableLine3Like
{
    return line3FromPoints(a.p0, a.p1, out);
}

/**
 * `Segment3.closestPointWithPoint` 的纯函数版：线段上离指定点最近的点。
 *
 * 逐字对应原实现：先取**所在直线**上的最近点，若它落在线段内就是答案，
 * 否则取距离平方更小的那个端点。
 */
export function seg3ClosestPointWithPoint(
    a: Segment3Like,
    point: Vector3Like,
    out: WritableVector3Like = { x: 0, y: 0, z: 0 },
): WritableVector3Like
{
    line3ClosestPointWithPoint(seg3GetLine(a), point, out);

    if (seg3OnWithPoint(a, out))
    { return out; }

    if (vec3DistanceSquared(point, a.p0) < vec3DistanceSquared(point, a.p1))
    { return vec3Copy(a.p0, out); }

    return vec3Copy(a.p1, out);
}
