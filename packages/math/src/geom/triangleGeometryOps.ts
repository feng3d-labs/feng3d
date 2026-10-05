import type { Box3Like, WritableBox3Like } from './box3Ops';
import { box3FromPoints, box3ToTriangles } from './box3Ops';
import { tri3IntersectionWithLine } from './intersectionOps';
import type { Line3Like } from './line3Ops';
import { line3FromPoints } from './line3Ops';
import type { Segment3Like, WritableSegment3Like } from './segment3Ops';
import { seg3ClampPoint, seg3Equals, seg3FromPoints, seg3OnWithPoint } from './segment3Ops';
import type { Triangle3Like, WritableTriangle3Like } from './triangle3Ops';
import { tri3ClosestPointWithPoint, tri3Copy, tri3GetNormal, tri3GetPoints, tri3GetSegments, tri3OnWithPoint } from './triangle3Ops';
import type { Vector3Like, WritableVector3Like } from './vector3Ops';
import { vec3Copy, vec3DistanceSquared, vec3Dot, vec3Equals, vec3Sub } from './vector3Ops';

/**
 * `TriangleGeometry` 运算的**纯函数**形式（issue #134 阶段 C-a，
 * 方案见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md` §11.7.6 的 C-a 行与 §11.7.7 的 `TriangleGeometry` 行）。
 *
 * ## 这是什么类型的容器
 *
 * `TriangleGeometry` **不是数值类型**，而是「三角形列表 + 一批几何算法」的容器（方案 §11.7.7 的原话），
 * 所以纯数据形态是 `{ triangles }` + 本文件的函数，而不是坐标式的 `*Like`。
 *
 * ## 与 `triangle3Ops` / `segment3Ops` 的分工
 *
 * 逐三角形、逐线段的运算**不在这里**——它们早在 A 阶段就落在 `triangle3Ops` / `segment3Ops` /
 * `line3Ops` 里；本文件只做「遍历 + 汇总 + 分类」这一层（原 class 的每个方法逐一对应一个函数）。
 * 唯一跨批的依赖是相交族：`Triangle3.intersectionWithLine` 曾是 class 内 `instanceof` 分支的成员
 * （方案 §11.7.7 的 P5），阶段 C-a 已把它纯函数化到 `intersectionOps.ts`，本文件直接用它。
 *
 * ## 与原 class 的逐条对应
 *
 * | 原 class 成员 | 纯函数 |
 * |---|---|
 * | `static fromBox(box)` / `fromBox(box)` | `triGeomFromBox(box, out?)` |
 * | `getPoints()` | `triGeomGetPoints(a)` |
 * | `isClosed()` | `triGeomIsClosed(a)` |
 * | `getBox(box?)` | `triGeomGetBox(a)` |
 * | `closestPointWithPoint(point, vout?)` | `triGeomClosestPointWithPoint(a, point, out?)` |
 * | `classifyPoint(p)` | `triGeomClassifyPoint(a, p)` |
 * | `containsPoint(p)` | `triGeomContainsPoint(a, p)` |
 * | `classifySegment(segment)` | `triGeomClassifySegment(a, segment)` |
 * | `classifyTriangle(triangle)` | `triGeomClassifyTriangle(a, triangle)`（原实现就是 `throw 未实现`） |
 * | `intersectionWithLine(line3d)` | `triGeomIntersectionWithLine(a, line)` |
 * | `intersectionWithSegment(segment)` | `triGeomIntersectionWithSegment(a, segment)` |
 * | `decomposeTriangle(triangle)` | `triGeomDecomposeTriangle(a, triangle)`（原实现就是 `throw 未实现`） |
 * | `copy(triangleGeometry)` / `clone()` | `triGeomCopy(a, out?)` |
 *
 * ## 逐字保留的三处既有行为（不做"顺手纠正"）
 *
 * 1. `triGeomClassifySegment` 的最后一个分支 `throw \`未实现\``（抛的是**字符串**，方案 §10.1 的 P8e
 *    登记过同类可疑点）；`classifyTriangle` / `decomposeTriangle` 同样原样抛 `未实现`。
 * 2. `triGeomClassifyPoint` 里 `cts` 为空时的 `v` 是 `undefined`，`undefined > 0` 为 `false` → 返回 `1`。
 * 3. `triGeomClosestPointWithPoint` 在 `triangles` 为空时对 `r[0].p` 取属性会抛 `TypeError`（原样保留）。
 */

/** 纯函数可接受的三角形几何体形状（只读三角形列表）。 */
export interface TriangleGeometryLike
{
    readonly triangles: readonly Triangle3Like[];
}

/** 可写出的三角形几何体目标（纯函数的 `out` 参数用）。 */
export interface WritableTriangleGeometryLike
{
    triangles: WritableTriangle3Like[];
}

/**
 * 纯数据三角形几何体（issue #134 阶段 C-a）：**取代原 `TriangleGeometry` class**。
 *
 * `TriangleGeometryLike` 是纯函数层的最小只读形状（`{ readonly triangles }`，**不带**判别字段），
 * 纯数据形态在它之上加 `readonly __type__: 'TriangleGeometry'`，做法与 `feng3d` 的
 * `core/Color3` / `core/Color4` 一致（方案 §5.9 的 D1 决策）。
 *
 * ⚠️ 与 `Euler` / `Rectangle` 同理：**`triGeom*` 纯函数的缺省 `out` 是新建的
 * `WritableTriangleGeometryLike`（不带 `__type__`）**——它们返回「算出来的值」；
 * 需要判别字段时由调用方显式写字面量 `{ __type__: 'TriangleGeometry', triangles }`。
 */
export interface TriangleGeometry extends TriangleGeometryLike
{
    readonly __type__: 'TriangleGeometry';
}

/** 「三角形几何体与直线 / 线段的相交结果」：相交线段列表 + 交点列表（原 class 返回的那个普通对象）。 */
export interface TriGeomIntersection
{
    segments: WritableSegment3Like[];
    points: WritableVector3Like[];
}

/** 缺省输出目标：空三角形列表（`new TriangleGeometry()` 的构造默认一致）。 */
function defaultOut(): WritableTriangleGeometryLike
{
    return { triangles: [] };
}

/**
 * `TriangleGeometry.fromBox` / `fromBox` 的纯函数版：用盒子的 12 个三角形**填充** `out.triangles`。
 *
 * 原实现是 `this.triangles.length = 0; box.toTriangles(this.triangles); return this;`
 * ——就地清空并复用同一个数组。这里照抄：`out` 传自己即就地，缺省则新建。
 */
export function triGeomFromBox(box: Box3Like, out: WritableTriangleGeometryLike = defaultOut()): WritableTriangleGeometryLike
{
    out.triangles.length = 0;
    box3ToTriangles(box, out.triangles);

    return out;
}

/**
 * `TriangleGeometry.getPoints` 的纯函数版：所有顶点**去重**后的列表。
 *
 * 去重用本文件的 `uniqueInPlace(ps, (a, b) => vec3Equals(a, b))`（原实现是 `a.equals(b)`，同一实现与默认精度），
 * 与原实现一样**就地**修改传入的那个数组。
 */
export function triGeomGetPoints(a: TriangleGeometryLike): Vector3Like[]
{
    const ps = a.triangles.reduce((v: Vector3Like[], t) => v.concat(tri3GetPoints(t)), [] as Vector3Like[]);

    uniqueInPlace(ps, (a0, b0) => vec3Equals(a0, b0));

    return ps;
}

/**
 * `TriangleGeometry.isClosed` 的纯函数版：是否闭合。
 *
 * 方案：获取所有三角形的线段，当每条线段（a,b）都存在且仅有一条与之相对的线段（b,a）时几何体闭合
 * （逐字照抄原实现的判定式，包括它是 O(n²) 的）。
 */
export function triGeomIsClosed(a: TriangleGeometryLike): boolean
{
    // 获取所有线段
    const ss = a.triangles.reduce((v: WritableSegment3Like[], t) => v.concat(tri3GetSegments(t)), [] as WritableSegment3Like[]);

    // 当每条线段（a,b）都存在与之相对的线段（b，a）时几何体闭合
    return ss.every((s) => ss.filter((s0) => vec3Equals(s.p0, s0.p1) && vec3Equals(s.p1, s0.p0)).length === 1);
}

/**
 * `TriangleGeometry.getBox` 的纯函数版：包围盒。
 *
 * 原实现 `box.fromPoints(this.getPoints())` 是「写进传入的盒子并返回它」；纯函数层按 §3.3 的约定
 * 让 `box3FromPoints` 的缺省 `out` 负责新建（需要就地写入时直接调用 `box3FromPoints(points, out)`）。
 */
export function triGeomGetBox(a: TriangleGeometryLike): WritableBox3Like
{
    return box3FromPoints(triGeomGetPoints(a));
}

/**
 * `TriangleGeometry.closestPointWithPoint` 的纯函数版：与指定点最近的三角形上的最近点。
 *
 * 原实现按「点到各三角形最近点」的距离平方排序后取第一个，再 `vout.copy(...)`；
 * 这里用 `vec3Copy` 写出（`out` 缺省新建）。
 */
export function triGeomClosestPointWithPoint(a: TriangleGeometryLike, point: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    // 计算指定点到所有三角形的最近点，并按距离排序
    const r = a.triangles.map((t) =>
    {
        const p = tri3ClosestPointWithPoint(t, point);

        return { p, d: vec3DistanceSquared(point, p) };
    }).sort((a0, b0) => a0.d - b0.d);

    return vec3Copy(r[0].p, out);
}

/**
 * `TriangleGeometry.classifyPoint` 的纯函数版：给指定点分类。
 *
 * @returns 点相对于几何体位置；0:在几何体表面上，1：在几何体外，-1：在几何体内
 *
 * 方案与原实现一致：当指定点不在几何体上时，在几何体上找到距离指定点最近点，
 * 最近点到给定点形成的向量与最近点所在面（当最近点在多个面上时取点乘模最大的面）法线点乘
 * 大于 0 时给定点在几何体内，否则在几何体外。
 */
export function triGeomClassifyPoint(a: TriangleGeometryLike, p: Vector3Like): number
{
    if (!triGeomIsClosed(a))
    { return 1; }

    // 是否在表面
    const onface = a.triangles.reduce((v, t) =>
        v || tri3OnWithPoint(t, p), false);

    if (onface) return 0;

    // 最近点
    const cp = triGeomClosestPointWithPoint(a, p);
    // 到最近点的向量
    const cpv = vec3Sub(cp, p);
    // 最近点所在平面
    const cts = a.triangles.filter((t) => tri3OnWithPoint(t, cp));
    // 最近点向量与所在平面方向相同则点在几何体内
    const v = cts.map((t) => vec3Dot(tri3GetNormal(t), cpv)).sort((a0, b0) => Math.abs(b0) - Math.abs(a0))[0];

    if (v > 0)
    { return -1; }

    return 1;
}

/**
 * `TriangleGeometry.containsPoint` 的纯函数版：是否包含指定点（`classifyPoint(p) <= 0`）。
 */
export function triGeomContainsPoint(a: TriangleGeometryLike, p: Vector3Like): boolean
{
    return triGeomClassifyPoint(a, p) <= 0;
}

/**
 * `TriangleGeometry.classifySegment` 的纯函数版：给指定线段分类。
 *
 * @returns 线段相对于几何体位置；0:在几何体表面上，1：在几何体外，-1：在几何体内，2：横跨几何体
 *
 * 各分支逐字照抄原实现，**包括末尾分支为「相交于点」时的 `throw \`未实现\``**（抛的是字符串）。
 * 注意该分支**实测可达**：任何真正与几何体相交的线段都走它（见实现里的注释）——这是既有缺陷，本批不动。
 */
export function triGeomClassifySegment(a: TriangleGeometryLike, segment: Segment3Like): number
{
    // 线段与几何体不相交时
    const r = triGeomIntersectionWithSegment(a, segment);

    if (!r)
    {
        if (triGeomClassifyPoint(a, segment.p0) > 0)
        { return 1; }

        return -1;
    }
    // 相交多条线段时 横跨
    if (r.segments.length > 1)
    { return 2; }
    if (r.segments.length === 1)
    {
        // 相交线段相对 几何体的位置
        const pc = [r.segments[0].p0, r.segments[0].p1].map((p) => triGeomClassifyPoint(a, p));

        if (pc[0] * pc[1] < 0) return 2;
        if (pc[0] + pc[1] === 0) return 0;
        if (pc[0] + pc[1] < 0) return -1;

        return 1;
    }
    // 相交于点
    // 实测（`test/geom/TriangleGeometry.spec.ts`）：只要线段真的与几何体相交，`triGeomIntersectionWithSegment`
    // 给出的就是「交点」形态，于是**任何真正相交的线段都会走到这里**（从盒子中心向外穿出一个面、贯穿盒子
    // 都是如此）——上面的 `-1` / `1` 只在**不相交**时给出。原实现这一分支就是 `throw \`未实现\``（抛字符串），
    // 本批逐字保留（修它属于行为变更，要单独一批 + 文档）。
    throw `未实现`;
}

/**
 * `TriangleGeometry.classifyTriangle` 的纯函数版：原实现就是 `throw \`未实现\``（保留）。
 */
export function triGeomClassifyTriangle(_a: TriangleGeometryLike, _triangle: Triangle3Like): number
{
    throw `未实现`;
}

/**
 * `TriangleGeometry.intersectionWithLine` 的纯函数版：与直线相交。
 *
 * 原实现遍历三角形调用 `Triangle3.intersectionWithLine`（阶段 C-a 已纯函数化到 `intersectionOps`），
 * 按 `instanceof Segment3` 分成「相交线段」与「交点」两组，两组各自去重、并**剔除落在相交线段上的交点**。
 */
export function triGeomIntersectionWithLine(a: TriangleGeometryLike, line3d: Line3Like): TriGeomIntersection | null
{
    // 线段与三角形碰撞
    const ss: WritableSegment3Like[] = [];
    let ps: WritableVector3Like[] = [];

    for (const t of a.triangles)
    {
        const r = tri3IntersectionWithLine(t, line3d);

        if (!r) continue;
        if ('p0' in r)
        {
            ss.push(r);

            continue;
        }
        ps.push(r);
    }

    // 清除相同的线段
    uniqueInPlace(ss, (a0, b0) => seg3Equals(a0, b0));
    // 删除在相交线段上的交点
    ps = ps.filter((p) => ss.every((s) => !seg3OnWithPoint(s, p)));
    // 清除相同点
    uniqueInPlace(ps, (a0, b0) => vec3Equals(a0, b0));
    if (ss.length + ps.length === 0)
    { return null; }

    return { segments: ss, points: ps };
}

/**
 * `TriangleGeometry.intersectionWithSegment` 的纯函数版：与线段相交。
 *
 * 先取线段所在直线求交（`line3FromPoints`，原实现是 `segment.getLine()`），
 * 再把结果裁剪到线段范围内：交点过滤到线段上、相交线段按 `seg3ClampPoint` 压缩
 * （压缩后退化为一个点的，从线段列表移到交点列表）。
 *
 * @returns 不相交时返回 null，相交时返回 碰撞线段列表与碰撞点列表
 */
export function triGeomIntersectionWithSegment(a: TriangleGeometryLike, segment: Segment3Like): TriGeomIntersection | null
{
    const line = line3FromPoints(segment.p0, segment.p1);
    const r = triGeomIntersectionWithLine(a, line);

    if (!r) return null;
    const ps = r.points = r.points.filter((p) => seg3OnWithPoint(segment, p));

    r.segments = r.segments.reduce((v: WritableSegment3Like[], s) =>
    {
        const p0 = seg3ClampPoint(segment, s.p0);
        const p1 = seg3ClampPoint(segment, s.p1);

        if (!seg3OnWithPoint(s, p0))
        { return v; }
        if (vec3Equals(p0, p1))
        {
            ps.push(p0);

            return v;
        }
        v.push(seg3FromPoints(p0, p1));

        return v;
    }, []);

    if (r.segments.length + r.points.length === 0)
    { return null; }

    return r;
}

/**
 * `TriangleGeometry.decomposeTriangle` 的纯函数版：原实现就是 `throw \`未实现\``（保留）。
 */
export function triGeomDecomposeTriangle(_a: TriangleGeometryLike, _triangle: Triangle3Like): number
{
    throw `未实现`;
}

/**
 * `TriangleGeometry.copy` / `clone` 的纯函数版：深拷贝三角形列表（每个三角形走 `tri3Copy`）。
 *
 * 原实现 `copy` 是**替换** `this.triangles`（不是就地改元素），这里同样给 `out.triangles` 赋新数组。
 */
export function triGeomCopy(a: TriangleGeometryLike, out: WritableTriangleGeometryLike = defaultOut()): WritableTriangleGeometryLike
{
    out.triangles = a.triangles.map((t) => tri3Copy(t));

    return out;
}

/**
 * 就地去掉「按 `compare` 相等」的重复元素，保留首次出现的那个（O(n²)）。
 *
 * 为什么 `math` 包内自带这一支（而不是 `import { ArrayUtils } from '@feng3d/polyfill'`）：
 * `@feng3d/math` 是分层里的 **Layer 0 地基包**，`@feng3d/polyfill` 在它之上；
 * 原先 `math` 对 `polyfill` 的依赖只剩 `MathUtil`（已迁入本包并与 `Mathf` 合并）与本文件这一处，
 * 而这里要的只是「就地去重」这一条语义（`ArrayUtils.unique` 的其余方法是给上层包用的通用工具）。
 * 内联这一支后 `math → polyfill` 依赖整体解开，见 `packages/math/package.json` 与
 * `scripts/check-layer-deps.mjs` 的白名单。修改时请与 `packages/polyfill/src/ArrayUtils.ts` 的
 * `unique` 保持语义一致（`compare` 默认 `a === b`、就地修改、返回同一个数组引用）。
 */
function uniqueInPlace<T>(array: T[], compare: (a: T, b: T) => boolean = (a, b) => a === b): T[]
{
    const deleteMap: boolean[] = [];

    for (let i = 0; i < array.length; i++)
    {
        if (deleteMap[i]) continue;
        for (let j = i + 1; j < array.length; j++)
        {
            if (compare(array[i], array[j])) deleteMap[j] = true;
        }
    }

    for (let i = array.length - 1; i >= 0; i--)
    {
        if (deleteMap[i]) array.splice(i, 1);
    }

    return array;
}
