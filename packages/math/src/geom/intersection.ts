import type { Line3Like } from './line3Ops';
import { line3Copy, line3Equals, line3FromPoints, line3OnWithPoint } from './line3Ops';
import { planeFromLine3, planeFromPoints, planeIntersectWithLine3 } from './planeOps';
import type { Segment3Like, WritableSegment3Like } from './segment3Ops';
import { seg3ClampPoint, seg3Copy, seg3FromPoints, seg3GetLine, seg3OnWithPoint } from './segment3Ops';
import type { Triangle3Like } from './triangle3Ops';
import { tri3DecomposeWithPoint, tri3DecomposeWithPoints, tri3GetSegments, tri3OnWithPoint } from './triangle3Ops';
import type { Vector3Like } from './vector3Ops';
import { vec3Equals, vec3IsParallel } from './vector3Ops';

/**
 * 「联合类型 + `instanceof` 判别」这一族相交运算的**纯函数**形式
 * （issue #134 阶段 C-a，方案见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md` §11.7.7 的 P5）。
 *
 * ## 为什么单独一个文件（而不是塞进 `line3Ops.ts`）
 *
 * 这三个函数是**跨类型**的（直线 × 直线 → 线段 × 直线 → 三角形 × 直线），
 * 而其中 `line3IntersectWithLine3D` 需要「过一条直线的平面」——
 * 它必须同时用到 `planeOps`（`planeFromLine3` / `planeIntersectWithLine3`）与 `line3Ops`。
 * 而 `planeOps` 本来就 `import` 了 `line3Ops` 的 `line3Copy` / `line3GetPoint`，
 * 于是把 `line3IntersectWithLine3D` 放进 `line3Ops.ts` 会造出 ops 层的**第一个模块环**
 * （方案 §3.1 明确要求 ops 层无环：跨类型只走 type-only import）。
 * 放在这里则依赖方向单向：本文件 → {planeOps, line3Ops, segment3Ops, triangle3Ops}，谁都不反向依赖它。
 *
 * ## `instanceof` 的替代：结构化判别（沿用 `planeOps` 的既有做法）
 *
 * 原 class 用 `r instanceof Line3` / `instanceof Vector3` / `instanceof Segment3` 判别联合类型；
 * 纯数据形态没有原型，改用**字段判别**（`'origin' in r` 是直线、`'p0' in r` 是线段、否则是点）——
 * 与 `planeOps.planeIntersectWithLine3` 的 `PlaneLine3Intersection` 完全同款（方案 §5.5）。
 * 注意这里**没有**用 `__type__`：`Line3Like` / `Vector3Like` / `Segment3Like` 都是 A / B 阶段放宽过的
 * 「最小形状」，它们不带判别字段（方案 §11.7.7 的 P4），结构判别才是与它们匹配的做法。
 *
 * ## 与 class 的关系
 *
 * 三个原 class 方法（`Line3.intersectWithLine3D` / `Segment3.intersectionWithLine` /
 * `Triangle3.intersectionWithLine`）**已改为委托到本文件**，并把结果为字面量的部分**装配回 class 实例**
 * （`this.clone()` / `new Vector3(...)` / `Segment3.fromPoints(...)`），
 * 所以 class 侧对外的原型语义逐字不变（这正是 §11.7.7 提醒的「死结」的解法：
 * 纯函数只产字面量，装配留给 class）。
 *
 * ## 阶段 C-c 追加（`Segment3` / `Triangle3` 的 class 已删除）
 *
 * 原先「class 侧装配回实例」的那一半随 class 一起消失，本文件补齐剩下三个成员：
 * `seg3IntersectionWithSegment` / `tri3IntersectionWithSegment`（联合返回类型 + 结构化判别）
 * 与 `tri3DecomposeWithSegment` / `tri3DecomposeWithLine`（它们要先拿联合结果再分派，
 * 落在本文件才不会与 `triangle3Ops` 成环）。
 * 纯三角形运算的 `tri3DecomposeWithPoint` / `tri3DecomposeWithPoints` 仍在 `triangle3Ops.ts`。
 */

/** 纯函数层里「一条直线与另一条直线」的相交结果：交于一点（`Vector3Like`）、重合（`Line3Like`）或不相交。 */
export type Line3Line3Intersection = Line3Like | Vector3Like | null;

/**
 * `Line3.intersectWithLine3D` 的纯函数版：两直线求交。
 *
 * 逐字照抄原实现的分支顺序：**先判相等（重合）→ 再判平行 → 过 `a` 作平面 → 平面与 `b` 求交 → 判点是否在 `a` 上**。
 * 其中「过 `a` 作平面」与 `Line3.prototype.getPlane`（原先挂在原型上的 `MixinsLine3` 补丁）
 * 逐字一致：**法线取 `random() × direction`**（因此这里也保留了那次 `Math.random()` 调用，
 * 调用次数与顺序不变——方案 §10.1 的 P5 提醒过随机调用序列对既有测试是敏感的）。
 * 阶段 C-d 起该计算收敛为 `planeOps.planeFromLine3`（见那里的说明）。
 *
 * ⚠️ **逐字保留的既有可疑点**：原实现 `plane.intersectWithLine3(line3D) as Vector3` 在
 * 「`b` 落在该平面内」时拿到的是 `Line3` 对象，随后 `onWithPoint` 读它的 `x/y/z` 得到 `undefined`
 * → 比较恒为 `false` → 方法返回 `null`。这里把该分支显式写成 `return null`（行为等价，
 * 但不再依赖「强转 + NaN 比较」的巧合）。是否要改成「真的判重合」属于阶段 C 的既有语义决策，
 * 本批不动。
 */
export function line3IntersectWithLine3D(a: Line3Like, b: Line3Like): Line3Line3Intersection
{
    // 处理相等
    if (line3Equals(a, b))
    { return line3Copy(a); }
    // 处理平行
    if (vec3IsParallel(a.direction, b.direction))
    { return null; }

    const plane = planeFromLine3(a);
    const cross = planeIntersectWithLine3(plane, b);

    if (!cross)
    { return null; }
    // 落在平面内（原实现经 `as Vector3` + NaN 比较得到 null，见上面的说明）
    if ('origin' in cross)
    { return null; }
    if (line3OnWithPoint(a, cross))
    { return cross; }

    return null;
}

/** 「线段与直线」的相交结果：交于一点（`Vector3Like`）、重合于该线段（`Segment3Like`）或不相交。 */
export type Segment3Line3Intersection = Segment3Like | Vector3Like | null;

/**
 * `Segment3.intersectionWithLine` 的纯函数版：线段与直线求交。
 *
 * 原实现 `this.getLine()` 返回 **`Line3` 实例**，纯函数层用 `line3FromPoints(a.p0, a.p1)` 得到同形字面量
 * （`Line3.fromPoints` 内部就是它）；`this.clone()` 换成 `seg3Copy(a)`。
 */
export function seg3IntersectionWithLine(a: Segment3Like, line: Line3Like): Segment3Line3Intersection
{
    const l = line3FromPoints(a.p0, a.p1);
    const r = line3IntersectWithLine3D(l, line);

    if (!r) return null;
    if ('origin' in r)
    { return seg3Copy(a); }
    if (seg3OnWithPoint(a, r))
    { return r; }

    return null;
}

/** 「三角形与直线」的相交结果：交于一点（`Vector3Like`）、交于一段（`Segment3Like`）或不相交。 */
export type Tri3LineIntersection = Vector3Like | Segment3Like | null;

/**
 * `Triangle3.intersectionWithLine` 的纯函数版：三角形与直线求交。
 *
 * 分支与装配顺序逐字照抄原实现：
 * ① 三角形平面与直线的交点（`planeIntersectWithLine3` 返回直线时说明「直线落在三角形平面上」，转 ②）；
 * ② 三边分别与直线求交：任一边与之**重合**时直接返回该边（`crossSegment`），
 *    否则收集交点，最终 0 个 → `null`、1 个 → 该点、2 个相同 → 该点、2 个不同 → 以它们为端点的线段。
 *
 * `ps[0].equals(ps[1])` 换成 `vec3Equals(ps[0], ps[1])`（同一实现、同一默认精度）。
 */
export function tri3IntersectionWithLine(a: Triangle3Like, line: Line3Like): Tri3LineIntersection
{
    const plane3d = planeFromPoints(a.p0, a.p1, a.p2);
    const cross = planeIntersectWithLine3(plane3d, line);

    if (!cross)
    { return null; }
    if (!('origin' in cross))
    {
        if (tri3OnWithPoint(a, cross))
        { return cross; }

        return null;
    }

    // 直线落在三角形平面上：分别与三边求交
    let crossSegment: WritableSegment3Like | null = null;
    const ps: Vector3Like[] = [];

    for (const segment of tri3GetSegments(a))
    {
        const r = seg3IntersectionWithLine(segment, line);

        if (!r) continue;
        if ('p0' in r)
        {
            crossSegment = r;

            continue;
        }
        ps.push(r);
    }

    if (crossSegment)
    { return crossSegment; }
    if (ps.length === 0)
    { return null; }
    if (ps.length === 1)
    { return ps[0]; }
    if (vec3Equals(ps[0], ps[1]))
    { return ps[0]; }

    return seg3FromPoints(ps[0], ps[1]);
}

/** 「线段与线段」的相交结果：交于一点（`Vector3Like`）、重合于一段（`Segment3Like`）或不相交。 */
export type Segment3Segment3Intersection = Segment3Like | Vector3Like | null;

/**
 * `Segment3.intersectionWithSegment` 的纯函数版（issue #134 阶段 C-c）：线段与线段求交。
 *
 * 逐字照抄原实现：
 * ① 先按「线段 × 直线」求交（`seg3IntersectionWithLine(a, seg3GetLine(b))`，原实现是
 *    `this.intersectionWithLine(segment.getLine())`）；
 * ② 结果是**一段**（`'p0' in r`，原实现是 `r instanceof Segment3`）时，把本线段两个端点分别夹到
 *    对方线段内，只有当**起点**夹完之后仍落在本线段上才返回这条被裁出的段，否则不相交；
 * ③ 结果是**点**时，点必须落在本线段上。
 *
 * 注意 ② 的分支返回的是**新建**的段（`seg3FromPoints`），而不是原对象。
 */
export function seg3IntersectionWithSegment(a: Segment3Like, b: Segment3Like): Segment3Segment3Intersection
{
    const r = seg3IntersectionWithLine(a, seg3GetLine(b));

    if (!r) return null;
    if ('p0' in r)
    {
        const ps = [a.p0, a.p1].map((p) => seg3ClampPoint(b, p));

        if (seg3OnWithPoint(a, ps[0]))
        { return seg3FromPoints(ps[0], ps[1]); }

        return null;
    }
    if (seg3OnWithPoint(a, r))
    { return r; }

    return null;
}

/** 「三角形与线段」的相交结果：交于一点（`Vector3Like`）、交于一段（`Segment3Like`）或不相交。 */
export type Tri3SegmentIntersection = Vector3Like | Segment3Like | null;

/**
 * `Triangle3.intersectionWithSegment` 的纯函数版（issue #134 阶段 C-c）：三角形与线段求交。
 *
 * 逐字照抄原实现：先取线段所在直线与三角形求交，再按结果是点还是段分派——
 * 点是「线段与三角形所在平面相交，且交点落在线段上」，段是「线段两端点夹到线段内、
 * 起点的夹点仍落在原交段上」。
 * `p0.equals(p1)` 换成 `vec3Equals(p0, p1)`（同一实现、同一默认精度）。
 */
export function tri3IntersectionWithSegment(a: Triangle3Like, segment: Segment3Like): Tri3SegmentIntersection
{
    const r = tri3IntersectionWithLine(a, seg3GetLine(segment));

    if (!r) return null;
    if (!('p0' in r))
    {
        if (seg3OnWithPoint(segment, r))
        { return r; }

        return null;
    }
    const p0 = seg3ClampPoint(segment, r.p0);
    const p1 = seg3ClampPoint(segment, r.p1);

    if (!seg3OnWithPoint(r, p0))
    { return null; }
    if (vec3Equals(p0, p1))
    { return p0; }

    return seg3FromPoints(p0, p1);
}

/**
 * `Triangle3.decomposeWithSegment` 的纯函数版（issue #134 阶段 C-c）。
 *
 * 与原实现一致：拿不到交（或不成立）就返回原三角形（`[a]`），
 * 交于一点则按点切割（`tri3DecomposeWithPoint`），交于一段则用两个端点依次切割。
 */
export function tri3DecomposeWithSegment(a: Triangle3Like, segment: Segment3Like): Triangle3Like[]
{
    const r = tri3IntersectionWithSegment(a, segment);

    if (!r) return [a];
    if (!('p0' in r))
    {
        return tri3DecomposeWithPoint(a, r);
    }

    return tri3DecomposeWithPoints(a, [r.p0, r.p1]);
}

/**
 * `Triangle3.decomposeWithLine` 的纯函数版（issue #134 阶段 C-c）：分支与
 * `tri3DecomposeWithSegment` 逐字同构，只是交的对象换成直线。
 */
export function tri3DecomposeWithLine(a: Triangle3Like, line: Line3Like): Triangle3Like[]
{
    const r = tri3IntersectionWithLine(a, line);

    if (!r) return [a];
    if (!('p0' in r))
    {
        return tri3DecomposeWithPoint(a, r);
    }

    return tri3DecomposeWithPoints(a, [r.p0, r.p1]);
}
