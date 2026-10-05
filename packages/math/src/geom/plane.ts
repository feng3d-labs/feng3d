import { mathUtil } from '@feng3d/polyfill';
import { PlaneClassification } from '../enums/PlaneClassification';
import type { Line3Like, WritableLine3Like } from './line3Ops';
import { line3Copy, line3GetPoint } from './line3Ops';
import type { Vector3Like, WritableVector3Like } from './vector3Ops';
import {
    vec3Add,
    vec3Cross,
    vec3Dot,
    vec3From,
    vec3IsParallel,
    vec3NormalizeThickness,
    vec3Random,
    vec3ScaleNumber,
    vec3Sub,
} from './vector3Ops';

/**
 * `Plane` 运算的**纯函数**形式（issue #134，方案见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md`）。
 *
 * ## 数据表示：`a` / `b` / `c` / `d`，不是 `normal` + `constant`
 *
 * 本仓的 `Plane` 用一般式 `ax+by+cz+d=0` 的四个系数存放平面（three.js 的
 * `normal` + `constant` 在本仓不存在），所以 `PlaneLike` 就是四个数字。
 * **构造默认值是 `a=0, b=1, c=0, d=0`**（`new Plane()` 即 `y=0` 平面），
 * 因此本文件缺省 `out` 全用这个初值（方案 §10.1 P6）。
 *
 * ## 唯一需要 P6 照顾的函数：`planeNormalize`
 *
 * 原 `Plane.normalize()` 在 `a=b=c=0` 时**只 `console.warn` 而不写任何分量**。
 * 缺省 `out` 若取全零，`planeNormalize({a:0,b:0,c:0,d:5})` 就会得到 `(0,0,0,0)` 而不是
 * `new Plane().normalize()` 的 `(0,1,0,0)`——所以缺省初值必须是构造默认。
 *
 * ## 跨类型
 *
 * `Vector3`（A1）与 `Line3`（A2h）的纯函数层已就绪，直接复用 `vec3*` / `line3*`；
 * 本文件不涉及 `Box3` / `Sphere`（`Plane` 自身没有依赖它们的方法）。
 *
 * `intersectWithLine3` 是**多态返回**（线在平面内返回直线、有唯一交点返回点、否则 `null`），
 * 纯函数层用 `'origin' in result` 判别，见 `PlaneLine3Intersection`。
 */

/**
 * 纯函数可接受的平面形状（`ax+by+cz+d=0`）：class 实例与纯数据字面量都满足。
 *
 * 原先这份定义在 `matrix4x4Ops.ts`（`mat4TransformPlane` 先用到），A2j 把归属收回到本文件，
 * 那边改为 type-only 重导出，既有 `import { PlaneLike } from './matrix4x4Ops'` 不受影响。
 */
export interface PlaneLike
{
    readonly a: number;
    readonly b: number;
    readonly c: number;
    readonly d: number;
}

/** 可写出的平面目标（`out` 参数用）。 */
export interface WritablePlaneLike
{
    a: number;
    b: number;
    c: number;
    d: number;
}

/**
 * `Plane` 纯数据接口（**带判别字段**，方案 §5.9 的 D1 决策）。
 *
 * `PlaneLike` / `WritablePlaneLike` **刻意不带** `__type__`：它们是 A / B 阶段用来放宽
 * feng3d 签名的「最小形状」，带上判别字段会成片传导给普通字面量消费方。
 *
 * 阶段 C-e 起 class 已删除，本接口与 `*Like` 同址（方案 §3.1）：
 * `import { Plane } from '@feng3d/math'` 一字不改。
 */
export interface Plane extends PlaneLike
{
    readonly __type__: 'Plane';
}

/** 缺省输出目标：与 `new Plane()` 的默认值一致（`a=0, b=1, c=0, d=0`，方案 §10.1 P6）。 */
function defaultOut(): WritablePlaneLike
{
    return { a: 0, b: 1, c: 0, d: 0 };
}

/** 缺省直线输出目标：与 `new Line3()` 的默认值一致（原点为零向量、方向为 +Z）。 */
function defaultLine3Out(): WritableLine3Like
{
    return { origin: { x: 0, y: 0, z: 0 }, direction: { x: 0, y: 0, z: 1 } };
}

/**
 * `Plane.prototype.set` 的纯函数形式：写入四个系数。
 */
export function planeSet(a: number, b: number, c: number, d: number, out: WritablePlaneLike = defaultOut()): WritablePlaneLike
{
    out.a = a;
    out.b = b;
    out.c = c;
    out.d = d;

    return out;
}

/**
 * `Plane.random`（静态与实例同义）的纯函数形式：法线取随机单位向量、`d` 取 `Math.random()`。
 *
 * 与 class 逐字一致：先算归一化法线（`vec3NormalizeThickness`，即 `Vector3.normalize()` 的
 * 「长度平方 > 0」判定，**不是** `Normalize()` 的 `kEpsilon` 判定），再取一次随机数当 `d`。
 */
export function planeRandom(out: WritablePlaneLike = defaultOut()): WritablePlaneLike
{
    const normal = vec3Random(1, false);

    vec3NormalizeThickness(normal, 1, normal);

    out.a = normal.x;
    out.b = normal.y;
    out.c = normal.z;
    out.d = Math.random();

    return out;
}

/**
 * `Plane.prototype.getOrigin` 的纯函数形式：原点在平面上的投影。
 */
export function planeGetOrigin(p: PlaneLike, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    planeProjectPoint(p, { x: 0, y: 0, z: 0 }, out);

    return out;
}

/**
 * `Plane.prototype.randomPoint` 的纯函数形式：平面上随机点。
 *
 * 原实现 `getOrigin(vout).add(getNormal().cross(Vector3.random()))`
 * （`cross` 就地写 `getNormal()` 的新对象），这里保持同样的运算顺序与随机数消费顺序。
 */
export function planeRandomPoint(p: PlaneLike, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    planeGetOrigin(p, out);

    const normal = planeGetNormal(p);

    vec3Cross(normal, vec3Random(1, false), normal);
    vec3Add(out, normal, out);

    return out;
}

/**
 * `Plane.prototype.getNormal` 的纯函数形式：法线即 `(a, b, c)`。
 */
export function planeGetNormal(p: PlaneLike, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    vec3From(p.a, p.b, p.c, out);

    return out;
}

/**
 * `Plane.prototype.fromPoints` 的纯函数形式：三点定义平面。
 *
 * 原实现 `p1.subTo(p0).crossTo(p2.subTo(p1)).normalize()`：
 * `subTo` / `crossTo` 都**不改调用者**（缺省 `vout = new Vector3()`），只有 `normalize()` 就地，
 * 所以这里 `vec3Sub` / `vec3Cross` 的中间结果同样逐字对应，入参三点只读。
 */
export function planeFromPoints(p0: Vector3Like, p1: Vector3Like, p2: Vector3Like, out: WritablePlaneLike = defaultOut()): WritablePlaneLike
{
    const v0 = vec3Sub(p1, p0);
    const v1 = vec3Sub(p2, p1);
    const normal = vec3Cross(v0, v1);

    vec3NormalizeThickness(normal, 1, normal);

    out.a = normal.x;
    out.b = normal.y;
    out.c = normal.z;
    out.d = -vec3Dot(normal, p0);

    return out;
}

/**
 * `Plane.prototype.fromNormalAndPoint` 的纯函数形式：法线 + 平面上一点。
 *
 * 原实现 `normal.clone().normalize()`（`clone` 复制后就地归一化），等价于把归一化结果写进新对象——
 * **入参 `normal` 不被修改**。
 */
export function planeFromNormalAndPoint(normal: Vector3Like, point: Vector3Like, out: WritablePlaneLike = defaultOut()): WritablePlaneLike
{
    const n = vec3NormalizeThickness(normal, 1, { x: 0, y: 0, z: 0 });

    out.a = n.x;
    out.b = n.y;
    out.c = n.z;
    out.d = -vec3Dot(n, point);

    return out;
}

/**
 * 「过一条直线的平面」的纯函数形式（issue #134 阶段 C-d）。
 *
 * 原实现是**挂在 `Line3.prototype` 上的 `MixinsLine3` 补丁**（`Plane.ts` 末尾的
 * `Line3.prototype.getPlane = function getPlane(plane = new Plane()) {...}`）：
 * 法线取 `Vector3.random().cross(direction)`、再过 `origin`——
 * 逐字对应 `planeFromNormalAndPoint(vec3Cross(vec3Random(), line.direction), line.origin, out)`。
 *
 * ## 为什么归属 `planeOps` 而不是 `line3Ops`
 *
 * 它**产出的是平面**，与 `planeFromPoints` / `planeFromNormalAndPoint` 同一族；
 * 而 `planeOps` 本来就 `import` `line3Ops`（`planeIntersectWithLine3` 要用 `line3Copy` / `line3GetPoint`），
 * 放进 `line3Ops.ts` 会造出 ops 层的**模块环**（方案 §3.1 要求 ops 层无环）。
 * `Line3.intersectWithLine3D` 内部那次「过 `a` 作平面」也改为调用本函数，
 * 所以 `Math.random()` 的消费次数与顺序与改造前逐字一致（方案 §10.1 的 P5）。
 */
export function planeFromLine3(line: Line3Like, out: WritablePlaneLike = defaultOut()): WritablePlaneLike
{
    return planeFromNormalAndPoint(vec3Cross(vec3Random(), line.direction), line.origin, out);
}

/**
 * `Plane.prototype.distanceWithPoint` 的纯函数形式：点到平面的有符号距离。
 *
 * 加法的结合顺序与原实现逐字一致（浮点最低位相同）。
 */
export function planeDistanceWithPoint(p: PlaneLike, point: Vector3Like): number
{
    return (p.a * point.x) + (p.b * point.y) + (p.c * point.z) + p.d;
}

/**
 * `Plane.prototype.onWithPoint` 的纯函数形式：点是否在平面上（距离按 `precision` 判零）。
 */
export function planeOnWithPoint(p: PlaneLike, point: Vector3Like, precision = mathUtil.PRECISION): boolean
{
    return mathUtil.equals(planeDistanceWithPoint(p, point), 0, precision);
}

/**
 * `Plane.prototype.classifyPoint` 的纯函数形式：点相对平面的位置分类。
 */
export function planeClassifyPoint(p: PlaneLike, point: Vector3Like, precision = mathUtil.PRECISION): PlaneClassification
{
    const len = planeDistanceWithPoint(p, point);

    if (mathUtil.equals(len, 0, precision))
    { return PlaneClassification.INTERSECT; }
    if (len < 0)
    { return PlaneClassification.BACK; }

    return PlaneClassification.FRONT;
}

/**
 * `Plane.prototype.parallelWithLine3D` 的纯函数形式：`direction · normal` 按 `precision` 判零。
 */
export function planeParallelWithLine3D(p: PlaneLike, line: Line3Like, precision = mathUtil.PRECISION): boolean
{
    if (mathUtil.equals(vec3Dot(line.direction, planeGetNormal(p)), 0, precision))
    { return true; }

    return false;
}

/**
 * `Plane.prototype.parallelWithPlane3D` 的纯函数形式：两法线是否平行。
 *
 * 参数顺序与原实现一致（`plane3D.getNormal().isParallel(this.getNormal())`）。
 */
export function planeParallelWithPlane3D(p: PlaneLike, plane3D: PlaneLike, precision = mathUtil.PRECISION): boolean
{
    if (vec3IsParallel(planeGetNormal(plane3D), planeGetNormal(p), precision))
    { return true; }

    return false;
}

/**
 * `Plane.prototype.intersectWithLine3` 的结果：**直线**（线在平面内）、**点**（唯一交点）或无交点。
 *
 * 三个形态与原实现的返回逐字对应（`line.clone()` / `line.getPoint(t)` / `null`），
 * 判别方式是 `'origin' in result`（`Line3Like` 有 `origin`，`Vector3Like` 没有）。
 */
export type PlaneLine3Intersection = Line3Like | Vector3Like | null;

/**
 * `Plane.prototype.intersectWithLine3` 的纯函数形式：平面与直线的交点。
 *
 * @see 3D数学基础：图形与游戏开发 P269
 */
export function planeIntersectWithLine3(p: PlaneLike, line: Line3Like): PlaneLine3Intersection
{
    const n = planeGetNormal(p);
    const d = line.direction;
    const dn = vec3Dot(d, n);

    if (mathUtil.equals(dn, 0))
    {
        // 处理直线在平面内
        if (planeOnWithPoint(p, line.origin))
        { return line3Copy(line); }

        return null;
    }
    const t = (-p.d - vec3Dot(line.origin, n)) / dn;
    const cp = line3GetPoint(line, t);

    return cp;
}

/**
 * `Plane.prototype.intersectWithPlane3D` 的纯函数形式：两平面的交线（平行时 `null`）。
 *
 * 解方程组的三个分支逐一照抄原实现（包括 `else` 分支抛出的字符串），
 * 写出前先 `normalize` 方向——原实现是 `new Line3(origin, direction)` 在构造函数里
 * `direction.normalize()`，两者等价。
 */
export function planeIntersectWithPlane3D(p: PlaneLike, plane3D: PlaneLike, out: WritableLine3Like = defaultLine3Out()): WritableLine3Like | null
{
    if (planeParallelWithPlane3D(p, plane3D))
    { return null; }
    const direction = vec3Cross(planeGetNormal(p), planeGetNormal(plane3D));
    const a0 = p.a;
    const b0 = p.b;
    const c0 = p.c;
    const d0 = p.d;
    const a1 = plane3D.a;
    const b1 = plane3D.b;
    const c1 = plane3D.c;
    const d1 = plane3D.d;

    let x: number;
    let y: number;
    let z: number;
    // 解 方程组 a0*x+b0*y+c0*z+d0=0;a1*x+b1*y+c1*z+d1=0;

    if ((b1 * c0) - (b0 * c1) !== 0)
    {
        x = 0;
        y = (-(c0 * d1) + (c1 * d0) + (((a0 * c1) - (a1 * c0)) * x)) / ((b1 * c0) - (b0 * c1));
        z = (-(b1 * d0) + (b0 * d1) + (((a1 * b0) - (a0 * b1)) * x)) / ((b1 * c0) - (b0 * c1));
    }
    else if ((a0 * c1) - (a1 * c0) !== 0)
    {
        y = 0;
        x = (-(c1 * d0) + (c0 * d1) + (((b1 * c0) - (b0 * c1)) * y)) / ((a0 * c1) - (a1 * c0));
        z = (-(a0 * d1) + (a1 * d0) + (((a1 * b0) - (a0 * b1)) * y)) / ((a0 * c1) - (a1 * c0));
    }
    else if ((a1 * b0) - (a0 * b1) !== 0)
    {
        z = 0;
        x = (-(b0 * d1) + (b1 * d0) + (((b1 * c0) - (b0 * c1)) * z)) / ((a1 * b0) - (a0 * b1));
        y = (-(a1 * d0) + (a0 * d1) + (((a0 * c1) - (a1 * c0)) * z)) / ((a1 * b0) - (a0 * b1));
    }
    else
    {
        throw '无法计算平面相交结果';
    }

    vec3From(x, y, z, out.origin);
    vec3NormalizeThickness(direction, 1, out.direction);

    return out;
}

/**
 * `Plane.prototype.normalize` 的纯函数形式：`(a,b,c)` 归一化，`d` 同比缩放。
 *
 * **退化分支（`a²+b²+c² <= 0`）只 `console.warn`、一个分量都不写**——这正是缺省 `out`
 * 必须取 `new Plane()` 默认值的原因（见文件头）。
 */
export function planeNormalize(p: PlaneLike, out: WritablePlaneLike = defaultOut()): WritablePlaneLike
{
    const a = p.a;
    const b = p.b;
    const c = p.c;
    const d = p.d;

    const s = (a * a) + (b * b) + (c * c);

    if (s > 0)
    {
        const invLen = 1 / Math.sqrt(s);

        out.a = a * invLen;
        out.b = b * invLen;
        out.c = c * invLen;
        out.d = d * invLen;
    }
    else
    {
        console.warn(`无效平面 ${planeToString(out)}`);
    }

    return out;
}

/**
 * `Plane.prototype.negate` 的纯函数形式：四个系数取反。
 */
export function planeNegate(p: PlaneLike, out: WritablePlaneLike = defaultOut()): WritablePlaneLike
{
    const a = -p.a;
    const b = -p.b;
    const c = -p.c;
    const d = -p.d;

    out.a = a;
    out.b = b;
    out.c = c;
    out.d = d;

    return out;
}

/**
 * `Plane.prototype.projectPoint` 的纯函数形式：点到平面的投影。
 *
 * 原实现 `getNormal(vout).scaleNumber(-distanceWithPoint(point)).add(point)`
 * ——**先写 `vout`（法线）再算距离**，本函数保持同样的求值顺序。
 */
export function planeProjectPoint(p: PlaneLike, point: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    planeGetNormal(p, out);
    vec3ScaleNumber(out, -planeDistanceWithPoint(p, point), out);
    vec3Add(out, point, out);

    return out;
}

/**
 * `Plane.prototype.closestPointWithPoint` 的纯函数形式：与指定点最近的点（即投影点）。
 */
export function planeClosestPointWithPoint(p: PlaneLike, point: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    planeProjectPoint(p, point, out);

    return out;
}

/**
 * `Plane.prototype.intersectWithTwoPlane3D` 的纯函数形式：三个平面相交于一点（无唯一交点时 `null`）。
 *
 * 原实现是一串就地写（`scaleNumberTo` / `add` / `scaleNumber`），涉及三个中间叉乘向量；
 * 这里用同样顺序的 `vec3*` 调用，中间量之间没有别名，结果逐位一致。
 *
 * @see 3D数学基础：图形与游戏开发 P271
 */
export function planeIntersectWithTwoPlane3D(p: PlaneLike, plane0: PlaneLike, plane1: PlaneLike, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like | null
{
    const n1 = planeGetNormal(plane0);
    const n2 = planeGetNormal(plane1);
    const n3 = planeGetNormal(p);

    const d1 = -plane0.d;
    const d2 = -plane1.d;
    const d3 = -p.d;

    const n1xn2 = vec3Cross(n1, n2);
    const n2xn3 = vec3Cross(n2, n3);
    const n3xn1 = vec3Cross(n3, n1);

    let m = vec3Dot(n1xn2, n3);

    if (mathUtil.equals(m, 0))
    {
        // 不存在交点或者不存在唯一的交点
        return null;
    }
    m = 1 / m;

    // p = (n2xn3 * d1 + n3xn1 * d2 + n1xn2 * d3) * m
    vec3ScaleNumber(n2xn3, d1, out);
    vec3Add(out, vec3ScaleNumber(n3xn1, d2), out);
    vec3Add(out, vec3ScaleNumber(n1xn2, d3), out);
    vec3ScaleNumber(out, m, out);

    return out;
}

/**
 * `Plane.prototype.equals` 的纯函数形式：四个系数按 `precision` 逐一比较。
 */
export function planeEquals(a: PlaneLike, b: PlaneLike, precision = mathUtil.PRECISION): boolean
{
    if (!mathUtil.equals(a.a - b.a, 0, precision))
    { return false; }
    if (!mathUtil.equals(a.b - b.b, 0, precision))
    { return false; }
    if (!mathUtil.equals(a.c - b.c, 0, precision))
    { return false; }
    if (!mathUtil.equals(a.d - b.d, 0, precision))
    { return false; }

    return true;
}

/**
 * `Plane.prototype.copy` / `Plane.prototype.clone` 的纯函数形式：复制四个系数。
 */
export function planeCopy(a: PlaneLike, out: WritablePlaneLike = defaultOut()): WritablePlaneLike
{
    out.a = a.a;
    out.b = a.b;
    out.c = a.c;
    out.d = a.d;

    return out;
}

/**
 * `Plane.prototype.toString` 的纯函数形式（字符串与原实现逐字一致）。
 */
export function planeToString(p: PlaneLike): string
{
    return `Plane3D [this.a:${p.a}, this.b:${p.b}, this.c:${p.c}, this.d:${p.d}]`;
}
