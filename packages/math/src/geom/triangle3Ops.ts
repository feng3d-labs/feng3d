import { mathUtil } from '@feng3d/polyfill';
import { planeClosestPointWithPoint, planeFromPoints } from './planeOps';
import type { Vector3Like, WritableVector3Like } from './vector3Ops';
import {
    vec3Add,
    vec3Copy,
    vec3Cross,
    vec3Distance,
    vec3DistanceSquared,
    vec3Dot,
    vec3Equals,
    vec3From,
    vec3Inverse,
    vec3Length,
    vec3LengthSquared,
    vec3Max,
    vec3Min,
    vec3Negate,
    vec3NormalizeThickness,
    vec3Random,
    vec3Round,
    vec3Scale,
    vec3Sub,
} from './vector3Ops';
import type { WritableSegment3Like } from './segment3Ops';
import { seg3ClosestPointWithPoint, seg3FromPoints, seg3OnWithPoint } from './segment3Ops';

/**
 * `Triangle3` 运算的**纯函数**形式（issue #134，方案见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md` 阶段 A2k）。
 *
 * ## 与数值类型的不同
 *
 * 和 `Segment3` / `Line3` 一样，`Triangle3` 是**嵌套结构**——它持有三个 `Vector3`（`p0` / `p1` / `p2`），
 * 所以形状是 `{ p0: Vector3Like; p1: Vector3Like; p2: Vector3Like }`，实现直接复用已就绪的
 * `vec3*`（A1）与 `seg3*`（A2g）纯函数。
 *
 * ## 就地语义与别名
 *
 * 入参一律只读，结果只写 `out`；`out` 传自己就是就地运算。**当 `out` 与某个入参别名时
 * （例如 `tri3GetPoint(a, p, a.p0)`）本文件的函数同样正确**——凡结果跨入参分量依赖的运算，
 * 都先算进局部变量再写 `out`（P2）。
 *
 * ## 一处与 `seg3FromPoints` / `line3FromPoints` **不同**的取舍：保留引用赋值
 *
 * 原 `Triangle3.fromPoints(p0, p1, p2)` 是**引用赋值**（`this.p0 = p0`），而 `seg3FromPoints`
 * 当初把它改成了值语义（复制分量）。Triangle3 上**不能**照搬这个收紧：主仓既有用例
 * `Box3.spec.ts` 明确断言 `triangle.p0 === p0`（`Box3.intersectsTriangle` 会经它就地点顶点），
 * 改成复制会让那条用例失败（实施时确实踩到）。所以 `tri3FromPoints` 直接**装配引用**，
 * 只有缺省 `out`（新建字面量）时才谈「返回新三角形」。
 *
 * 由此也说明：`Triangle3Like` 的只读字段仍是**别名**，调用方改 `p0` 会牵动三角形——与 class 一致。
 *
 * ## 随机调用次数（P5）
 *
 * `tri3Random` 与 `tri3RandomPoint` 的 `Math.random` 调用**次数与顺序**与原实现逐字一致：
 * 前者 3 个顶点 × 3 分量 = 9 次，后者 2 次（`a` → `b`，`c` 由二者推出）。
 *
 * ## 本文件不做的部分（阶段 C-c 收口后）
 *
 * 相交族与切割族的「联合类型」成员落在 [intersectionOps.ts](./intersectionOps.ts)
 * （跨类型，且本文件已反向被它引用，放在这里会造出模块环）：
 * `tri3IntersectionWithSegment` / `tri3DecomposeWithSegment` / `tri3DecomposeWithLine`。
 *
 * 留在**本文件**的是纯三角形运算——包括本批新增的 `tri3ContainsPoint`（原 `static containsPoint`）
 * 与 `tri3DecomposeWithPoint` / `tri3DecomposeWithPoints`：
 * 原实现里它们「必须构造 `Triangle3` 实例、且顶点就是原对象」的约束在纯数据形态下自然消解——
 * 字面量 `{ p0, p1, p2 }` **直接装配引用**，与 `Triangle3.fromPoints` 的引用赋值逐字同义。
 *
 * `getPlane3d`（→ `planeFromPoints`）与 `closestPointWithPoint` / `distanceWithPoint` /
 * `distanceSquaredWithPoint`（→ 下面的 `tri3ClosestPointWithPoint` 系列）已在 A3 改为委托。
 */

/** 纯函数可接受的三角形形状：class 实例与纯数据字面量都满足。 */
export interface Triangle3Like
{
    readonly p0: Vector3Like;
    readonly p1: Vector3Like;
    readonly p2: Vector3Like;
}

/**
 * `Triangle3` 纯数据接口（**带判别字段**，方案 §5.9 的 D1 决策）。
 *
 * `Triangle3Like` / `WritableTriangle3Like` **刻意不带** `__type__`（理由见 `segment3Ops.ts` 同名字段的注释）。
 */
export interface Triangle3 extends Triangle3Like
{
    readonly __type__: 'Triangle3';
}

/** 可写出的三角形目标（`out` 参数用）。 */
export interface WritableTriangle3Like
{
    p0: WritableVector3Like;
    p1: WritableVector3Like;
    p2: WritableVector3Like;
}

/** 缺省输出目标：三个顶点各为零向量（与 `new Triangle3()` 的默认一致，P6）。 */
function defaultOut(): WritableTriangle3Like
{
    return { p0: { x: 0, y: 0, z: 0 }, p1: { x: 0, y: 0, z: 0 }, p2: { x: 0, y: 0, z: 0 } };
}

/** 新建零向量（仅本文件内部使用，避免每处重复写字面量）。 */
function newVec3(): WritableVector3Like
{
    return { x: 0, y: 0, z: 0 };
}

/**
 * 把 `src` 的分量写进 `out`，**但两者已经是同一个对象时原样保留**。
 *
 * `tri3FromPoints` 要保持原实现的**引用赋值**语义（`this.p0 = p0`）；当 `out` 与 `src`
 * 是同一个对象时既没有可复制的信息、又会平白换掉对象身份，此时直接返回 `out` 更忠实
 * （也顺带兼容 `Vector3.ZERO` 这类冻结常量，不会撞上严格模式下的只读赋值）。
 */
function assignPoint(out: WritableVector3Like, src: Vector3Like): WritableVector3Like
{
    if ((out as unknown as Vector3Like) === src)
    {
        return out;
    }

    return vec3Copy(src, out);
}

/**
 * `Triangle3.fromPoints`（静态与实例同义）的纯函数版。
 *
 * **保留原实现的引用赋值语义**：`out.p0 / p1 / p2` 直接指向传入的三个点对象，而不是复制。
 * 主仓的 `Box3.spec.ts` 明确断言 `triangle.p0 === p0`（`Box3.intersectsTriangle` 会就地点
 * 顶点坐标），把它改成值语义会让那条既有用例失败——实施时确实踩到过。
 * 只有 `out` 缺省（新建字面量）时才谈得上「复制分量」。
 */
export function tri3FromPoints(p0: Vector3Like, p1: Vector3Like, p2: Vector3Like, out: WritableTriangle3Like = defaultOut()): WritableTriangle3Like
{
    out.p0 = assignPoint(out.p0, p0) as WritableVector3Like;
    out.p1 = assignPoint(out.p1, p1) as WritableVector3Like;
    out.p2 = assignPoint(out.p2, p2) as WritableVector3Like;

    return out;
}

/**
 * `Triangle3.fromPositions` 的纯函数版：从 `positions` 的 0 / 3 / 6 起各读三个分量作为三个顶点。
 *
 * 与原实现一致，三个顶点是**新建**的字面量；`out` 缺省即「返回新三角形」。
 */
export function tri3FromPositions(positions: number[], out: WritableTriangle3Like = defaultOut()): WritableTriangle3Like
{
    out.p0 = vec3From(positions[0], positions[1], positions[2]);
    out.p1 = vec3From(positions[3], positions[4], positions[5]);
    out.p2 = vec3From(positions[6], positions[7], positions[8]);

    return out;
}

/**
 * `Triangle3.random`（静态与实例同义）的纯函数版：三个顶点各取一个随机向量。
 */
export function tri3Random(size = 1, out: WritableTriangle3Like = defaultOut()): WritableTriangle3Like
{
    vec3Random(size, false, out.p0);
    vec3Random(size, false, out.p1);
    vec3Random(size, false, out.p2);

    return out;
}

/**
 * `Triangle3.getPoints` 的纯函数版：`[p0, p1, p2]`。
 */
export function tri3GetPoints(a: Triangle3Like): Vector3Like[]
{
    return [a.p0, a.p1, a.p2];
}

/**
 * `Triangle3.getSegments` 的纯函数版：三条边（p0p1 / p1p2 / p2p0）。
 */
export function tri3GetSegments(a: Triangle3Like): WritableSegment3Like[]
{
    return [
        seg3FromPoints(a.p0, a.p1),
        seg3FromPoints(a.p1, a.p2),
        seg3FromPoints(a.p2, a.p0),
    ];
}

/**
 * `Triangle3.getNormal` 的纯函数版：`normalize((p1 - p0) × (p2 - p1))`。
 *
 * 原实现末尾是 `normalize()`（「长度平方 > 0」判定）而**不是** `Normalize()`（`VEC3_EPSILON` 判定），
 * 所以用 `vec3NormalizeThickness`（与 `seg3GetNormalWithPoint` / `line3FromPoints` 同一取舍）。
 */
export function tri3GetNormal(a: Triangle3Like, out: WritableVector3Like = newVec3()): WritableVector3Like
{
    const n = vec3Cross(vec3Sub(a.p1, a.p0), vec3Sub(a.p2, a.p1));

    return vec3NormalizeThickness(n, 1, out);
}

/**
 * `Triangle3.getBarycenter` 的纯函数版：重心 = `(p0 + p1 + p2) * (1 / 3)`。
 *
 * 原实现是 `copy(p0).add(p1).add(p2).scaleNumber(1 / 3)`，即**先累加再乘 `1/3`**
 * （不是每项除以 3）——浮点上两者差 1ulp，这里照抄原顺序。
 */
export function tri3GetBarycenter(a: Triangle3Like, out: WritableVector3Like = newVec3()): WritableVector3Like
{
    const x = (a.p0.x + a.p1.x + a.p2.x) * (1 / 3);
    const y = (a.p0.y + a.p1.y + a.p2.y) * (1 / 3);
    const z = (a.p0.z + a.p1.z + a.p2.z) * (1 / 3);

    out.x = x;
    out.y = y;
    out.z = z;

    return out;
}

/**
 * `Triangle3.getCircumcenter` 的纯函数版：外心（三边垂直平分线的交点）。
 *
 * 对应原式 `pout.copy(p0).scaleNumber(a0).add(p1.scaleNumberTo(b0)).add(p2.scaleNumberTo(c0))`：
 * `scaleNumber(a0)` 是整体乘 `a0`，两个 `scaleNumberTo` **不改变** `p1` / `p2`（都是 `To` 版本），
 * 所以等价于按权重线性组合三个顶点。
 */
export function tri3GetCircumcenter(a: Triangle3Like, out: WritableVector3Like = newVec3()): WritableVector3Like
{
    const ea = vec3Sub(a.p2, a.p1);
    const eb = vec3Sub(a.p0, a.p2);
    const ec = vec3Sub(a.p1, a.p0);
    const d = 2 * vec3LengthSquared(vec3Cross(ec, ea));
    const a0 = -vec3Dot(ea, ea) * vec3Dot(ec, eb) / d;
    const b0 = -vec3Dot(eb, eb) * vec3Dot(ec, ea) / d;
    const c0 = -vec3Dot(ec, ec) * vec3Dot(eb, ea) / d;
    const x = (a.p0.x * a0) + (a.p1.x * b0) + (a.p2.x * c0);
    const y = (a.p0.y * a0) + (a.p1.y * b0) + (a.p2.y * c0);
    const z = (a.p0.z * a0) + (a.p1.z * b0) + (a.p2.z * c0);

    out.x = x;
    out.y = y;
    out.z = z;

    return out;
}

/**
 * `Triangle3.getInnercenter` 的纯函数版：内心（三条内角平分线的交点）。
 *
 * 权重是三边长（对边长度），整体再乘 `1 / (a + b + c)`——对应原式
 * `(p0 * a + p1 * b + p2 * c) * (1 / (a + b + c))`。
 */
export function tri3GetInnercenter(a: Triangle3Like, out: WritableVector3Like = newVec3()): WritableVector3Like
{
    const wa = vec3Length(vec3Sub(a.p2, a.p1));
    const wb = vec3Length(vec3Sub(a.p0, a.p2));
    const wc = vec3Length(vec3Sub(a.p1, a.p0));
    const s = 1 / (wa + wb + wc);
    const x = ((a.p0.x * wa) + (a.p1.x * wb) + (a.p2.x * wc)) * s;
    const y = ((a.p0.y * wa) + (a.p1.y * wb) + (a.p2.y * wc)) * s;
    const z = ((a.p0.z * wa) + (a.p1.z * wb) + (a.p2.z * wc)) * s;

    out.x = x;
    out.y = y;
    out.z = z;

    return out;
}

/**
 * `Triangle3.getOrthocenter` 的纯函数版：垂心（三条高或其延长线的交点）。
 *
 * 对应原式 `pout.copy(p0).scaleNumber(a0).add(p1.scaleNumberTo(b0)).add(p2.scaleNumberTo(c0))
 * .scaleNumber(1 / (a0 + b0 + c0))`：三个权重都在最外层统一除，而不是分摊到各项。
 */
export function tri3GetOrthocenter(a: Triangle3Like, out: WritableVector3Like = newVec3()): WritableVector3Like
{
    const ea = vec3Sub(a.p2, a.p1);
    const eb = vec3Sub(a.p0, a.p2);
    const ec = vec3Sub(a.p1, a.p0);
    const a0 = vec3Dot(ea, eb) * vec3Dot(ea, ec);
    const b0 = vec3Dot(eb, ec) * vec3Dot(eb, ea);
    const c0 = vec3Dot(ec, ea) * vec3Dot(ec, eb);
    // 原式：pout = p0 * a0 + p1 * b0 + p2 * c0，再整体乘 1 / (a0 + b0 + c0)
    const k = 1 / (a0 + b0 + c0);
    const x = ((a.p0.x * a0) + (a.p1.x * b0) + (a.p2.x * c0)) * k;
    const y = ((a.p0.y * a0) + (a.p1.y * b0) + (a.p2.y * c0)) * k;
    const z = ((a.p0.z * a0) + (a.p1.z * b0) + (a.p2.z * c0)) * k;

    out.x = x;
    out.y = y;
    out.z = z;

    return out;
}

/**
 * `Triangle3.getPoint` 的纯函数版：重心坐标 `p` 对三个顶点的加权和。
 *
 * 先把 `p` 的三个分量取进局部变量，等价于原实现
 * `pout.copy(p0).scaleNumber(p.x).add(p1.scaleNumberTo(p.y)).add(p2.scaleNumberTo(p.z))`
 * 里逐次读 `p.x` → `p.y` → `p.z` 的时机（也顺带避免 `out` 与 `p` 别名时自污染）。
 */
export function tri3GetPoint(a: Triangle3Like, p: Vector3Like, out: WritableVector3Like = newVec3()): WritableVector3Like
{
    const wx = p.x;
    const wy = p.y;
    const wz = p.z;
    const x = (a.p0.x * wx) + (a.p1.x * wy) + (a.p2.x * wz);
    const y = (a.p0.y * wx) + (a.p1.y * wy) + (a.p2.y * wz);
    const z = (a.p0.z * wx) + (a.p1.z * wy) + (a.p2.z * wz);

    out.x = x;
    out.y = y;
    out.z = z;

    return out;
}

/**
 * `Triangle3.randomPoint` 的纯函数版：三角形内的随机点。
 */
export function tri3RandomPoint(a: Triangle3Like, out: WritableVector3Like = newVec3()): WritableVector3Like
{
    const r1 = Math.random();
    const r2 = Math.random() * (1 - r1);
    const r3 = 1 - r1 - r2;

    return tri3GetPoint(a, { x: r1, y: r2, z: r3 }, out);
}

/**
 * `Triangle3.getBarycentricCoordinates` 的纯函数版：求指定点的重心坐标系坐标。
 *
 * 按原实现逐字翻译（含三个投影轴分支）：先取九个顶点分量与两个边向量，用叉积绝对值最大的
 * 分量选出投影平面，再解 2×2 线性方程组。
 *
 * 原实现在 `denom === 0` 时**没有检查**（`return null` 那段是被注释掉的），这里同样是裸的
 * `1 / denom`，所以退化输入会得到 `±Infinity` / `NaN`——与 class 行为一致。
 */
export function tri3GetBarycentricCoordinates(a: Triangle3Like, p: Vector3Like, out: WritableVector3Like = newVec3()): WritableVector3Like
{
    const p0x = a.p0.x;
    const p0y = a.p0.y;
    const p0z = a.p0.z;
    const p1x = a.p1.x;
    const p1y = a.p1.y;
    const p1z = a.p1.z;
    const p2x = a.p2.x;
    const p2y = a.p2.y;
    const p2z = a.p2.z;

    const d1x = p1x - p0x;
    const d1y = p1y - p0y;
    const d1z = p1z - p0z;
    const d2x = p2x - p1x;
    const d2y = p2y - p1y;
    const d2z = p2z - p1z;

    const nx = (d1y * d2z) - (d1z * d2y);
    const ny = (d1z * d2x) - (d1x * d2z);
    const nz = (d1x * d2y) - (d1y * d2x);

    let u1: number;
    let u2: number;
    let u3: number;
    let u4: number;
    let v1: number;
    let v2: number;
    let v3: number;
    let v4: number;

    if ((Math.abs(nx) >= Math.abs(ny)) && (Math.abs(nx) >= Math.abs(nz)))
    {
        u1 = p0y - p2y;
        u2 = p1y - p2y;
        u3 = p.y - p0y;
        u4 = p.y - p2y;
        v1 = p0z - p2z;
        v2 = p1z - p2z;
        v3 = p.z - p0z;
        v4 = p.z - p2z;
    }
    else if (Math.abs(ny) >= Math.abs(nz))
    {
        u1 = p0z - p2z;
        u2 = p1z - p2z;
        u3 = p.z - p0z;
        u4 = p.z - p2z;
        v1 = p0x - p2x;
        v2 = p1x - p2x;
        v3 = p.x - p0x;
        v4 = p.x - p2x;
    }
    else
    {
        u1 = p0x - p2x;
        u2 = p1x - p2x;
        u3 = p.x - p0x;
        u4 = p.x - p2x;
        v1 = p0y - p2y;
        v2 = p1y - p2y;
        v3 = p.y - p0y;
        v4 = p.y - p2y;
    }
    const denom = (v1 * u2) - (v2 * u1);
    const oneOverDenom = 1 / denom;

    const bx = ((v4 * u2) - (v2 * u4)) * oneOverDenom;
    const by = ((v1 * u3) - (v3 * u1)) * oneOverDenom;

    out.x = bx;
    out.y = by;
    out.z = 1 - bx - by;

    return out;
}

/**
 * `Triangle3.onWithPoint` 的纯函数版：点是否在三角形上。
 *
 * 两个判据与原实现一致：① 点是否在三角形所在平面上；② 重心坐标系分量是否都不小于
 * `-precision`（原实现把 `precision` 取负后复用同一个变量，这里用局部变量避免改写入参式写法）。
 */
export function tri3OnWithPoint(a: Triangle3Like, p: Vector3Like, precision = mathUtil.PRECISION): boolean
{
    // 判断点是否在平面上（对应原实现 `p0.subTo(p1).cross(p1.subTo(p2)).dot(p.subTo(p0))`）
    const dot = vec3Dot(vec3Cross(vec3Sub(a.p0, a.p1), vec3Sub(a.p1, a.p2)), vec3Sub(p, a.p0));

    if (!mathUtil.equals(dot, 0, precision))
    { return false; }

    // 求点的重心坐标系坐标
    const bp = tri3GetBarycentricCoordinates(a, p);

    // 当重心坐标系坐标任意分量小于0表示点在三角形外
    const negPrecision = -precision;
    const bx = bp.x;
    const by = bp.y;
    const bz = bp.z;

    if (bx < negPrecision || by < negPrecision || bz < negPrecision)
    { return false; }

    return true;
}

/**
 * `Triangle3.closestPointWithPoint` 的纯函数形式（issue #134 A3）。
 *
 * 逐字对应原实现：先把点投影到三角形所在平面，若落在三角形上就是答案；
 * 否则取三条边各自最近点里距离平方最小者。
 *
 * 后半段**照抄原实现的「map → sort → 取第一个」**（而不是改写成「循环取最小」）：
 * 退化三角形上距离可能是 `NaN`，两种写法在 `NaN` 下的取值不同，这里优先保证逐字等价。
 */
export function tri3ClosestPointWithPoint(a: Triangle3Like, point: Vector3Like, out: WritableVector3Like = newVec3()): WritableVector3Like
{
    planeClosestPointWithPoint(planeFromPoints(a.p0, a.p1, a.p2), point, out);

    if (tri3OnWithPoint(a, out))
    { return out; }

    const p = tri3GetSegments(a).map((s) =>
    {
        const pointOnSegment = seg3ClosestPointWithPoint(s, point, newVec3());

        return { point: pointOnSegment, d: vec3DistanceSquared(point, pointOnSegment) };
    }).sort((l, r) => l.d - r.d)[0].point;

    return vec3Copy(p, out);
}

/**
 * `Triangle3.distanceWithPoint` 的纯函数形式：点到三角形的最近距离。
 */
export function tri3DistanceWithPoint(a: Triangle3Like, point: Vector3Like): number
{
    return vec3Distance(tri3ClosestPointWithPoint(a, point), point);
}

/**
 * `Triangle3.distanceSquaredWithPoint` 的纯函数形式：点到三角形的最近距离平方。
 */
export function tri3DistanceSquaredWithPoint(a: Triangle3Like, point: Vector3Like): number
{
    return vec3DistanceSquared(tri3ClosestPointWithPoint(a, point), point);
}

/**
 * `Triangle3.blendWithPoint` 的纯函数版：指定点分别占三个顶点的混合值。
 *
 * ★ 这里有个**极易误译**的点：原实现先在 `n` 上取 `area = n.length`、**之后**才 `n.normalize()`，
 * 但 `n0` / `n1` / `n2` 是**先 `length` 再 `normalize` 再点乘**——也就是说
 * `area0 / area` 里的 `area0` 是**归一化之前**的模长，而 `n.dot(n0)` 用的是**归一化之后**的单位向量。
 * 若把 `area0` 也算成归一化后的模长（恒为 1），结果会整体从 `cos θ` 变成 1，
 * 三点混合值全部退化成 1——本文件第一版就是这么错的，由「原实现 vs ops」对照探针抓出。
 */
export function tri3BlendWithPoint(a: Triangle3Like, p: Vector3Like, out: WritableVector3Like = newVec3()): WritableVector3Like
{
    const n = vec3Cross(vec3Sub(a.p1, a.p0), vec3Sub(a.p2, a.p1));
    const area = vec3Length(n);

    vec3NormalizeThickness(n, 1, n);

    const n0 = vec3Cross(vec3Sub(a.p1, p), vec3Sub(a.p2, a.p1));
    const area0 = vec3Length(n0);

    vec3NormalizeThickness(n0, 1, n0);
    const b0 = area0 / area * vec3Dot(n, n0);
    const n1 = vec3Cross(vec3Sub(a.p2, p), vec3Sub(a.p0, a.p2));
    const area1 = vec3Length(n1);

    vec3NormalizeThickness(n1, 1, n1);
    const b1 = area1 / area * vec3Dot(n, n1);
    const n2 = vec3Cross(vec3Sub(a.p0, p), vec3Sub(a.p1, a.p0));
    const area2 = vec3Length(n2);

    vec3NormalizeThickness(n2, 1, n2);
    const b2 = area2 / area * vec3Dot(n, n2);

    out.x = b0;
    out.y = b1;
    out.z = b2;

    return out;
}

/**
 * `Triangle3.area` 的纯函数版：`|(p1 - p0) × (p2 - p1)| / 2`。
 */
export function tri3Area(a: Triangle3Like): number
{
    return vec3Length(vec3Cross(vec3Sub(a.p1, a.p0), vec3Sub(a.p2, a.p1))) * 0.5;
}

/**
 * `Triangle3.rasterize` 的纯函数版：把三角形点阵化为 XYZ 轴间距 1 的整数格点。
 *
 * 注意原实现用的是 `Vector3.min` / `Vector3.max`（`Math.min` / `Math.max` 语义，与静态
 * `Vector3.Min` / `Vector3.Max` 的 `Mathf.Min` / `Mathf.Max` 不同），所以对应 `vec3Min` / `vec3Max`。
 */
export function tri3Rasterize(a: Triangle3Like): number[]
{
    const min = vec3Round(vec3Min(vec3Min(a.p0, a.p1), a.p2));
    const max = vec3Round(vec3Max(vec3Max(a.p0, a.p1), a.p2));
    const point = newVec3();
    const result: number[] = [];

    for (let x = min.x; x <= max.x; x++)
    {
        for (let y = min.y; y <= max.y; y++)
        {
            for (let z = min.z; z <= max.z; z++)
            {
                // 判定是否在三角形上
                const onTri = tri3OnWithPoint(a, vec3From(x, y, z, point), 0.5);

                if (onTri)
                {
                    result.push(x, y, z);
                }
            }
        }
    }

    return result;
}

/**
 * `Triangle3.translateVector3` 的纯函数版：三个顶点各加 `v`。
 */
export function tri3Translate(a: Triangle3Like, v: Vector3Like, out: WritableTriangle3Like = defaultOut()): WritableTriangle3Like
{
    const x = v.x;
    const y = v.y;
    const z = v.z;

    out.p0.x = a.p0.x + x;
    out.p0.y = a.p0.y + y;
    out.p0.z = a.p0.z + z;
    out.p1.x = a.p1.x + x;
    out.p1.y = a.p1.y + y;
    out.p1.z = a.p1.z + z;
    out.p2.x = a.p2.x + x;
    out.p2.y = a.p2.y + y;
    out.p2.z = a.p2.z + z;

    return out;
}

/**
 * `Triangle3.scaleVector3` 的纯函数版：三个顶点各按分量乘 `v`。
 */
export function tri3ScaleVector3(a: Triangle3Like, v: Vector3Like, out: WritableTriangle3Like = defaultOut()): WritableTriangle3Like
{
    const x = v.x;
    const y = v.y;
    const z = v.z;

    out.p0.x = a.p0.x * x;
    out.p0.y = a.p0.y * y;
    out.p0.z = a.p0.z * z;
    out.p1.x = a.p1.x * x;
    out.p1.y = a.p1.y * y;
    out.p1.z = a.p1.z * z;
    out.p2.x = a.p2.x * x;
    out.p2.y = a.p2.y * y;
    out.p2.z = a.p2.z * z;

    return out;
}

/**
 * `Triangle3.copy` / `Triangle3.clone` 的纯函数版：复制三个顶点。
 */
export function tri3Copy(a: Triangle3Like, out: WritableTriangle3Like = defaultOut()): WritableTriangle3Like
{
    vec3Copy(a.p0, out.p0);
    vec3Copy(a.p1, out.p1);
    vec3Copy(a.p2, out.p2);

    return out;
}

/**
 * `Triangle3.rasterizeCustom` 的纯函数版：按 `voxelSize` / `origin` 自定义栅格化。
 *
 * 步骤与原实现逐字一致：先把三角形平移到「减 origin、除 voxelSize」的格子空间
 * （原实现是 `clone().translateVector3(origin.negateTo()).scaleVector3(voxelSize.inverseTo())`），
 * 再取整格点，最后把格点按反变换映射回原空间。
 */
export function tri3RasterizeCustom(a: Triangle3Like, voxelSize: Vector3Like = { x: 1, y: 1, z: 1 }, origin: Vector3Like = { x: 0, y: 0, z: 0 }): { xi: number, yi: number, zi: number, xv: number, yv: number, zv: number }[]
{
    const tri = tri3ScaleVector3(tri3Translate(a, vec3Negate(origin)), vec3Inverse(voxelSize));
    const ps = tri3Rasterize(tri);
    const vec = newVec3();
    const result: { xi: number, yi: number, zi: number, xv: number, yv: number, zv: number }[] = [];

    ps.forEach((v, i) =>
    {
        if (i % 3 === 0)
        {
            vec3Add(vec3Scale(vec3From(ps[i], ps[i + 1], ps[i + 2], vec), voxelSize), origin, vec);
            result.push({ xi: ps[i], yi: ps[i + 1], zi: ps[i + 2], xv: vec.x, yv: vec.y, zv: vec.z });
        }
    });

    return result;
}

/**
 * `Triangle3.containsPoint`（原 `static`）的纯函数版：把三个顶点装配成三角形后判点是否在内。
 *
 * 与 `tri3FromPoints` 同款——**引用装配**（顶点就是传入的三个对象），所以它只读不写。
 */
export function tri3ContainsPoint(
    p0: Vector3Like, p1: Vector3Like, p2: Vector3Like, p: Vector3Like, precision = mathUtil.PRECISION,
): boolean
{
    return tri3OnWithPoint({ p0, p1, p2 }, p, precision);
}

/**
 * `Triangle3.decomposeWithPoint` 的纯函数版：用点切割三角形。
 *
 * 逐字对应原实现的分支顺序（先判点是否在三角形上、再判点是否就是某个顶点、
 * 再判点落在哪条边上、最后是「内部点 → 三个子三角形」）。
 *
 * `Triangle3.fromPoints(...)` 在纯数据形态下就是 `{ p0, p1, p2 }` 的**引用装配**
 * （原实现同样是引用赋值），所以子三角形的顶点与传入对象是同一身份——
 * §11.7.7 担心的「装回 class 会丢原型」不再存在。
 */
export function tri3DecomposeWithPoint(a: Triangle3Like, p: Vector3Like): Triangle3Like[]
{
    if (!tri3OnWithPoint(a, p))
    { return [a]; }
    if (vec3Equals(a.p0, p) || vec3Equals(a.p1, p) || vec3Equals(a.p2, p))
    { return [a]; }
    if (seg3OnWithPoint({ p0: a.p0, p1: a.p1 }, p))
    { return [{ p0: a.p0, p1: p, p2: a.p2 }, { p0: p, p1: a.p1, p2: a.p2 }]; }
    if (seg3OnWithPoint({ p0: a.p1, p1: a.p2 }, p))
    { return [{ p0: a.p1, p1: p, p2: a.p0 }, { p0: p, p1: a.p2, p2: a.p0 }]; }
    if (seg3OnWithPoint({ p0: a.p2, p1: a.p0 }, p))
    { return [{ p0: a.p2, p1: p, p2: a.p1 }, { p0: p, p1: a.p0, p2: a.p1 }]; }

    return [
        { p0: p, p1: a.p0, p2: a.p1 },
        { p0: p, p1: a.p1, p2: a.p2 },
        { p0: p, p1: a.p2, p2: a.p0 },
    ];
}

/**
 * `Triangle3.decomposeWithPoints` 的纯函数版：依次用多个点切割（原实现只是两层 `reduce`）。
 */
export function tri3DecomposeWithPoints(a: Triangle3Like, ps: readonly Vector3Like[]): Triangle3Like[]
{
    return ps.reduce((v: Triangle3Like[], p) => v.reduce((v0: Triangle3Like[], t) =>
        v0.concat(tri3DecomposeWithPoint(t, p)), []), [a]);
}
