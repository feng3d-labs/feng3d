import { mathUtil } from '@feng3d/polyfill';
import { mat4TransformPoint3 } from './matrix4x4Ops';
import type { Matrix4x4Like } from './matrix4x4Ops';
import {
    vec3Add,
    vec3Clamp,
    vec3Copy,
    vec3DistanceSquared,
    vec3Equals,
    vec3GreaterEqual,
    vec3Lerp,
    vec3LessEqual,
    vec3Max,
    vec3Min,
    vec3Scale,
    vec3ScaleNumber,
    vec3SetZero,
    vec3Sub,
    vec3ToString,
} from './vector3Ops';
import type { Vector3Like, WritableVector3Like } from './vector3Ops';

/**
 * `Box3` 运算的**纯函数**形式（issue #134 阶段 A2i，方案见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md`）。
 *
 * ## 几何类型的嵌套结构
 *
 * `Vector3` / `Quaternion` / `Color4` 的 `XxxLike` 是一层**平的**数字分量；
 * `Box3` 与 `Segment3` / `Line3` 一样是**嵌套结构**——持有两个 `Vector3`（`min` / `max`）。
 * 所以这里的形状是 `{ min: Vector3Like; max: Vector3Like }`，自身运算直接复用
 * A1 阶段已就绪的 `vec3*` 纯函数。
 *
 * ## 缺省 `out` 必须与 `new Box3()` 的默认一致
 *
 * `new Box3()` 构造出的是**空盒**：`min` 为 `+Infinity`、`max` 为 `-Infinity`
 * （这样逐个 `expandByPoint` 收点时不会漏掉任何点）。所以缺省 `out` 的初值取
 * `+Infinity` / `-Infinity`，而**不是**零向量——见方案 §10.1 的 P6
 * （`Color4` 的 `a` 默认 `1` 就踩过这个坑）。
 *
 * ## 「产出型」与「写入型」两种目标
 *
 * - 产出型（`box3FormPositions` / `box3FromPoints`）：目标盒可以是一对新字面量，函数自己写 min/max；
 * - 写入型（`box3Copy` / `box3Scale` / `box3ExpandByPoint` …）：目标盒的 `min` / `max`
 *   必须**已经存在**，函数只写分量——这与 `Segment3.copy` 写入 `this.p0` / `this.p1`
 *   而不是替换引用是一致的（`Box3.copy` 的既有行为也是「写入已有的 min / max」）。
 *
 * 两种形态的纯数据字面量都满足 `WritableBox3Like`，所以不需要拆成两套类型。
 *
 * ## 一处有意的语义放宽
 *
 * 原 `Box3.toPoints` 走 `points[i].set(...)`，因此要求 `points` 的元素是**有 `set` 方法**的
 * 向量（`Vector3` 实例）。`box3ToPoints` 改为**逐分量赋值**，于是普通字面量数组也能当 `out`：
 * 传入 `Vector3[]` 时行为与原实现完全一致；`out === points` 的就地写法也安全
 * （8 个角点的分量都先算进局部变量再写）。
 *
 * ## 本文件不做的部分（跨类型，等依赖的 ops 落地后改为委托）
 *
 * 已就绪的跨类型依赖直接用：`Matrix4x4` 的 `mat4TransformPoint3`（`box3ApplyMatrix`）。
 * 下面这些的 ops 还没落地，对应方法暂留在 class 内：
 *
 * | 方法 | 依赖 |
 * |---|---|
 * | `toTriangles` | `Triangle3.fromPoints`（`Triangle3` 的 ops 未落地） |
 * | `intersectsSphere` | `Sphere` 的 ops 未落地 |
 * | `intersectsPlane` | `Plane.distanceWithPoint`（`Plane` 的 ops 未落地） |
 * | `intersectsTriangle`（含私有的 `satForAxes`） | `Triangle3` 的 ops 未落地 |
 */

/**
 * 纯函数可接受的包围盒形状：class 实例与纯数据字面量都满足。
 *
 * 在 `WritableBox3Like` 的基础上一层层加 `readonly`：字段本身只读，
 * 而 `min` / `max` 仍是**只读**的向量形状（不是 `WritableVector3Like`），入参因此写不动。
 */
export interface Box3Like extends WritableBox3Like
{
    readonly min: Vector3Like;
    readonly max: Vector3Like;
}

/** 可写出的包围盒目标（`out` 参数用）：`min` / `max` 两个向量都必须已存在。 */
export interface WritableBox3Like
{
    min: WritableVector3Like;
    max: WritableVector3Like;
}

/**
 * 缺省输出目标：与 `new Box3()` 一致的空盒（`min` 为 `+Infinity`、`max` 为 `-Infinity`）。
 *
 * 每次调用都新建：共享同一个对象会让「缺省 out」的调用互相污染。
 */
function newOut(): WritableBox3Like
{
    return {
        min: { x: Number(Infinity), y: Number(Infinity), z: Number(Infinity) },
        max: { x: -Infinity, y: -Infinity, z: -Infinity },
    };
}

/**
 * `Box3.init` 的纯函数版：把 `min` / `max` 的**分量**写进 `out`。
 *
 * 注意原方法 `init(min, max)` 是**引用赋值**（`this.min = min`），而纯函数层一律取值语义
 * （复制分量，与 `seg3FromPoints` 的处理一致）——纯数据字面量之间不存在"共享引用"这回事。
 */
export function box3Init(min: Vector3Like, max: Vector3Like, out: WritableBox3Like = newOut()): WritableBox3Like
{
    vec3Copy(min, out.min);
    vec3Copy(max, out.max);

    return out;
}

/**
 * `Box3.formPositions`（静态与实例同义）的纯函数版：从坐标数据列表求包围盒。
 */
export function box3FormPositions(positions: number[], out: WritableBox3Like = newOut()): WritableBox3Like
{
    let minX = Number(Infinity);
    let minY = Number(Infinity);
    let minZ = Number(Infinity);

    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    for (let i = 0, l = positions.length; i < l; i += 3)
    {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];

        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (z < minZ) minZ = z;

        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        if (z > maxZ) maxZ = z;
    }

    out.min.x = minX;
    out.min.y = minY;
    out.min.z = minZ;

    out.max.x = maxX;
    out.max.y = maxY;
    out.max.z = maxZ;

    return out;
}

/**
 * `Box3.fromPoints`（静态与实例同义）的纯函数版：从一组点求包围盒。
 *
 * 与原实现一致：**先 `empty()` 再逐个 `expandByPoint`**，所以空点列表得到的是空盒。
 */
export function box3FromPoints(ps: Vector3Like[], out: WritableBox3Like = newOut()): WritableBox3Like
{
    box3Empty(out);

    for (let i = 0, l = ps.length; i < l; i++)
    {
        box3ExpandByPoint(out, ps[i], out);
    }

    return out;
}

/**
 * `Box3.empty` 的纯函数版：把 `out` **就地**重置为空盒
 * （`min` 为 `+Infinity`、`max` 为 `-Infinity`）。
 *
 * 写分量而不替换 `out.min` / `out.max` 的引用，与 class 的 `empty()` 一致。
 */
export function box3Empty(out: WritableBox3Like): WritableBox3Like
{
    out.min.x = out.min.y = out.min.z = Number(Infinity);
    out.max.x = out.max.y = out.max.z = -Infinity;

    return out;
}

/**
 * `Box3.isEmpty` 的纯函数版：只要有一个轴 `max < min` 即为空。
 */
export function box3IsEmpty(a: Box3Like): boolean
{
    return (a.max.x < a.min.x) || (a.max.y < a.min.y) || (a.max.z < a.min.z);
}

/**
 * `Box3.getCenter` 的纯函数版：`out = (min + max) * 0.5`。
 */
export function box3GetCenter(a: Box3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    return vec3ScaleNumber(vec3Add(a.min, a.max), 0.5, out);
}

/**
 * `Box3.getSize` 的纯函数版：`out = max - min`；**空盒**的尺寸按实现约定记为零向量
 * （不是 `Infinity`，也不是 `NaN`）。
 */
export function box3GetSize(a: Box3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    if (box3IsEmpty(a))
    {
        return vec3SetZero(out);
    }

    return vec3Sub(a.max, a.min, out);
}

/**
 * `Box3.toPoints` 的纯函数版：转换为包围盒八个角所在点列表，就地写入 `points` 并返回该数组。
 *
 * 与原实现的差别只有一处：逐分量赋值而不是 `points[i].set(...)`（见文件头的「语义放宽」）。
 */
export function box3ToPoints(a: Box3Like, points: WritableVector3Like[] = newPoints()): WritableVector3Like[]
{
    // 3x3x3 的角点顺序必须与原实现逐行一致：调用方（`applyMatrix`、`intersectsPlane`）依赖顺序
    const minX = a.min.x;
    const minY = a.min.y;
    const minZ = a.min.z;
    const maxX = a.max.x;
    const maxY = a.max.y;
    const maxZ = a.max.z;

    points[0].x = minX; points[0].y = minY; points[0].z = minZ;
    points[1].x = maxX; points[1].y = minY; points[1].z = minZ;
    points[2].x = minX; points[2].y = maxY; points[2].z = minZ;
    points[3].x = minX; points[3].y = minY; points[3].z = maxZ;
    points[4].x = minX; points[4].y = maxY; points[4].z = maxZ;
    points[5].x = maxX; points[5].y = minY; points[5].z = maxZ;
    points[6].x = maxX; points[6].y = maxY; points[6].z = minZ;
    points[7].x = maxX; points[7].y = maxY; points[7].z = maxZ;

    return points;
}

/** `toPoints` 的缺省输出：8 个零向量（`new Vector3()` 的纯数据等价物）。 */
function newPoints(): WritableVector3Like[]
{
    return [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
    ];
}

/**
 * `Box3.copy` 的纯函数版：把 `a` 的 `min` / `max` **分量**写进 `out` 已有的两个向量。
 */
export function box3Copy(a: Box3Like, out: WritableBox3Like = newOut()): WritableBox3Like
{
    vec3Copy(a.min, out.min);
    vec3Copy(a.max, out.max);

    return out;
}

/**
 * `Box3.clone` 的纯函数版：与 `box3Copy(a)` 同义（缺省 `out` 即新建）。
 */
export function box3Clone(a: Box3Like): WritableBox3Like
{
    return box3Copy(a);
}

/**
 * `Box3.equals` 的纯函数版：`min` 与 `max` 逐分量按 `precision` 都比较相等。
 *
 * class 的 `equals(aabb)` 没有 `precision` 参数，这里补上缺省值只是把 `vec3Equals`
 * 的既有约定显式化，缺省路径与原行为逐字相同。
 */
export function box3Equals(a: Box3Like, b: Box3Like, precision = mathUtil.PRECISION): boolean
{
    return vec3Equals(a.min, b.min, precision) && vec3Equals(a.max, b.max, precision);
}

/**
 * `Box3.containsPoint` 的纯函数版：含边界（`min <= p <= max`）。
 */
export function box3ContainsPoint(a: Box3Like, p: Vector3Like): boolean
{
    return vec3LessEqual(a.min, p) && vec3GreaterEqual(a.max, p);
}

/**
 * `Box3.contains` 的纯函数版：`a` 完全包住 `b`。
 */
export function box3Contains(a: Box3Like, b: Box3Like): boolean
{
    return vec3LessEqual(a.min, b.min) && vec3GreaterEqual(a.max, b.max);
}

/**
 * `Box3.expandByPoint` 的纯函数版：用点扩张包围盒（逐分量取 min / max），就地改 `out`。
 */
export function box3ExpandByPoint(a: Box3Like, point: Vector3Like, out: WritableBox3Like = newOut()): WritableBox3Like
{
    vec3Min(a.min, point, out.min);
    vec3Max(a.max, point, out.max);

    return out;
}

/**
 * `Box3.union` 的纯函数版：包围盒的并集（逐分量取 min / max）。
 *
 * 每个分量都先算进局部变量再写 `out`：`out` 与 `b` 是同一个盒时（{@link box3Union} 的 `out` 传 `b`），
 * 若先写 `out.min` 再读 `b.max`，第二半就会读到已被改写的结果。
 */
export function box3Union(a: Box3Like, b: Box3Like, out: WritableBox3Like = newOut()): WritableBox3Like
{
    const minX = Math.min(a.min.x, b.min.x);
    const minY = Math.min(a.min.y, b.min.y);
    const minZ = Math.min(a.min.z, b.min.z);
    const maxX = Math.max(a.max.x, b.max.x);
    const maxY = Math.max(a.max.y, b.max.y);
    const maxZ = Math.max(a.max.z, b.max.z);

    out.min.x = minX;
    out.min.y = minY;
    out.min.z = minZ;
    out.max.x = maxX;
    out.max.y = maxY;
    out.max.z = maxZ;

    return out;
}

/**
 * `Box3.scale` 的纯函数版：`min` / `max` 各自**按分量**乘上 `s`。
 */
export function box3Scale(a: Box3Like, s: Vector3Like, out: WritableBox3Like = newOut()): WritableBox3Like
{
    vec3Scale(a.min, s, out.min);
    vec3Scale(a.max, s, out.max);

    return out;
}

/**
 * `Box3.translate` / `Box3.offsetPosition` 的纯函数版：`min` / `max` 各自加上 `offset`。
 */
export function box3Translate(a: Box3Like, offset: Vector3Like, out: WritableBox3Like = newOut()): WritableBox3Like
{
    vec3Add(a.min, offset, out.min);
    vec3Add(a.max, offset, out.max);

    return out;
}

/**
 * `Box3.offset` 的纯函数版：等价于 `box3Translate(a, { x: dx, y: dy, z: dz }, out)`。
 */
export function box3Offset(a: Box3Like, dx: number, dy: number, dz: number, out: WritableBox3Like = newOut()): WritableBox3Like
{
    return box3Translate(a, { x: dx, y: dy, z: dz }, out);
}

/**
 * `Box3.inflate` 的纯函数版：按**直径**膨胀——每边各扩张一半。
 *
 * 注意原方法**没有返回值**（返回 `undefined`），纯函数按本方案约定返回 `out`；
 * class 的 `inflate` 仍然是 `void`，所以对外行为不变。
 */
export function box3Inflate(a: Box3Like, dx: number, dy: number, dz: number, out: WritableBox3Like = newOut()): WritableBox3Like
{
    out.min.x = a.min.x - (dx / 2);
    out.min.y = a.min.y - (dy / 2);
    out.min.z = a.min.z - (dz / 2);
    out.max.x = a.max.x + (dx / 2);
    out.max.y = a.max.y + (dy / 2);
    out.max.z = a.max.z + (dz / 2);

    return out;
}

/**
 * `Box3.inflatePoint` 的纯函数版：`delta` 先乘 `0.5`，再「`min` 减、`max` 加」。
 *
 * 原方法同样**没有返回值**，class 的 `inflatePoint` 保持 `void`。
 */
export function box3InflatePoint(a: Box3Like, delta: Vector3Like, out: WritableBox3Like = newOut()): WritableBox3Like
{
    return box3Inflate(a, delta.x, delta.y, delta.z, out);
}

/**
 * `Box3.intersection` 的纯函数版：求交集（**两个盒都是可读入参**）。
 *
 * - 相交时返回写入了交集的 `out`；
 * - 不相交时返回 `null`（与 class 的 `intersection()` 一致），且**不改动 `out`**。
 *
 * 判定沿用原实现：把两端点分别夹到对方的盒内，再看夹出来的 `min` 是否仍在本盒内。
 * 夹取结果先写进局部变量：`out` 与 `a` 是同一个盒时也不会先污染再判定。
 *
 * `out` 声明为泛型 `T`：`Box3.intersection` 必须原样返回**自己的 `Box3` 实例**
 * （返回值退化成 `WritableBox3Like` 会让 feng3d / editor 的消费方编译不过，
 * 且 `tsc -p packages/math` 查不出来——方案 §10.1 的 P10）。
 */
export function box3Intersection<T extends WritableBox3Like>(a: Box3Like, b: Box3Like, out: T = newOut() as T): T | null
{
    const min = vec3Clamp(a.min, b.min, b.max);

    if (!box3ContainsPoint(a, min))
    {
        return null;
    }

    const max = vec3Clamp(a.max, b.min, b.max);

    vec3Copy(min, out.min);
    vec3Copy(max, out.max);

    return out;
}

/**
 * `Box3.intersectionTo` 的纯函数版：`box3Copy(a, out)` 之后求交集。
 *
 * 同样用泛型 `T` 保留 `out` 的具体类型（见 `box3Intersection`）。
 */
export function box3IntersectionTo<T extends WritableBox3Like>(a: Box3Like, b: Box3Like, out: T = newOut() as T): T | null
{
    box3Copy(a, out);

    return box3Intersection(out, b, out);
}

/**
 * `Box3.intersects` 的纯函数版。
 *
 * 原始实现是「取交集 → 交集中心必须同时落在两个盒内」，与教科书里的 `overlaps`
 * 不是一回事（例如两盒只在一个角点相切时，交集退化为一个点盒，该点同时落在两盒内 → `true`）。
 * 这里逐字保留原逻辑，**不要**按直觉改成 `box3Overlaps`。
 */
export function box3Intersects(a: Box3Like, b: Box3Like): boolean
{
    const result = box3IntersectionTo(a, b);

    if (!result)
    {
        // intersection() 返回 null 表示两包围盒无交集，此时必然不相交
        return false;
    }

    const c = box3GetCenter(result);

    return box3ContainsPoint(a, c) && box3ContainsPoint(b, c);
}

/**
 * `Box3.overlaps` 的纯函数版：三个轴上的区间都相交。
 *
 * 注意它**不是** `box3Intersects`（后者基于交集中心，见该函数说明）。
 */
export function box3Overlaps(a: Box3Like, b: Box3Like): boolean
{
    const l1 = a.min;
    const u1 = a.max;
    const l2 = b.min;
    const u2 = b.max;

    //      l2        u2
    //      |---------|
    // |--------|
    // l1       u1

    const overlapsX = ((l2.x <= u1.x && u1.x <= u2.x) || (l1.x <= u2.x && u2.x <= u1.x));
    const overlapsY = ((l2.y <= u1.y && u1.y <= u2.y) || (l1.y <= u2.y && u2.y <= u1.y));
    const overlapsZ = ((l2.z <= u1.z && u1.z <= u2.z) || (l1.z <= u2.z && u2.z <= u1.z));

    return overlapsX && overlapsY && overlapsZ;
}

/**
 * `Box3.clampPoint` / `Box3.closestPointToPoint` 的纯函数版：把点夹到盒内。
 */
export function box3ClampPoint(a: Box3Like, point: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    return vec3Clamp(point, a.min, a.max, out);
}

/**
 * `Box3.rayIntersection` 的纯函数版：射线与盒求交，返回起点到入射面的距离。
 *
 * 返回值约定与原实现完全一致：空盒或未命中返回 `Number.MAX_VALUE`，
 * 起点在盒内（含边界）返回 `0`，命中时返回 `rayEntryDistance`。
 * 命中面的法线写进可选的 `outNormal`（不传就不写）。
 *
 * 法线先在局部变量里攒好、命中后才写 `outNormal`：`outNormal` 与 `a.min` / `a.max`
 * 是同一个向量时（把法线写进盒自己的端点），先写 out 再读盒就会算出错误结果。
 */
export function box3RayIntersection(a: Box3Like, position: Vector3Like, direction: Vector3Like, outNormal?: WritableVector3Like): number
{
    if (box3IsEmpty(a))
    { return Number.MAX_VALUE; }
    if (box3ContainsPoint(a, position))
    { return 0; }

    const halfExtentsX = (a.max.x - a.min.x) / 2;
    const halfExtentsY = (a.max.y - a.min.y) / 2;
    const halfExtentsZ = (a.max.z - a.min.z) / 2;

    const centerX = a.min.x + halfExtentsX;
    const centerY = a.min.y + halfExtentsY;
    const centerZ = a.min.z + halfExtentsZ;

    const px = position.x - centerX;
    const py = position.y - centerY;
    const pz = position.z - centerZ;

    const vx = direction.x;
    const vy = direction.y;
    const vz = direction.z;

    let normalX = 0;
    let normalY = 0;
    let normalZ = 0;

    let hit = false;
    let rayEntryDistance = Number.MAX_VALUE;

    // 射线与平面相交测试（六个面按原实现的顺序依次尝试，命中即停）
    if (!hit && vx < 0)
    {
        rayEntryDistance = (halfExtentsX - px) / vx;
        if (rayEntryDistance > 0)
        {
            const iy = py + rayEntryDistance * vy;
            const iz = pz + rayEntryDistance * vz;
            if (iy > -halfExtentsY && iy < halfExtentsY && iz > -halfExtentsZ && iz < halfExtentsZ)
            {
                normalX = 1;
                hit = true;
            }
        }
    }
    if (!hit && vx > 0)
    {
        rayEntryDistance = (-halfExtentsX - px) / vx;
        if (rayEntryDistance > 0)
        {
            const iy = py + rayEntryDistance * vy;
            const iz = pz + rayEntryDistance * vz;
            if (iy > -halfExtentsY && iy < halfExtentsY && iz > -halfExtentsZ && iz < halfExtentsZ)
            {
                normalX = -1;
                hit = true;
            }
        }
    }
    if (!hit && vy < 0)
    {
        rayEntryDistance = (halfExtentsY - py) / vy;
        if (rayEntryDistance > 0)
        {
            const ix = px + rayEntryDistance * vx;
            const iz = pz + rayEntryDistance * vz;
            if (ix > -halfExtentsX && ix < halfExtentsX && iz > -halfExtentsZ && iz < halfExtentsZ)
            {
                normalY = 1;
                hit = true;
            }
        }
    }
    if (!hit && vy > 0)
    {
        rayEntryDistance = (-halfExtentsY - py) / vy;
        if (rayEntryDistance > 0)
        {
            const ix = px + rayEntryDistance * vx;
            const iz = pz + rayEntryDistance * vz;
            if (ix > -halfExtentsX && ix < halfExtentsX && iz > -halfExtentsZ && iz < halfExtentsZ)
            {
                normalY = -1;
                hit = true;
            }
        }
    }
    if (!hit && vz < 0)
    {
        rayEntryDistance = (halfExtentsZ - pz) / vz;
        if (rayEntryDistance > 0)
        {
            const ix = px + rayEntryDistance * vx;
            const iy = py + rayEntryDistance * vy;
            if (iy > -halfExtentsY && iy < halfExtentsY && ix > -halfExtentsX && ix < halfExtentsX)
            {
                normalZ = 1;
                hit = true;
            }
        }
    }
    if (!hit && vz > 0)
    {
        rayEntryDistance = (-halfExtentsZ - pz) / vz;
        if (rayEntryDistance > 0)
        {
            const ix = px + rayEntryDistance * vx;
            const iy = py + rayEntryDistance * vy;
            if (iy > -halfExtentsY && iy < halfExtentsY && ix > -halfExtentsX && ix < halfExtentsX)
            {
                normalZ = -1;
                hit = true;
            }
        }
    }

    if (!hit)
    {
        return Number.MAX_VALUE;
    }

    if (outNormal)
    {
        outNormal.x = normalX;
        outNormal.y = normalY;
        outNormal.z = normalZ;
    }

    return rayEntryDistance;
}

/**
 * `Box3.applyMatrix` / `Box3.applyMatrixTo` 的纯函数版：把八个角点变换后重新求轴对齐包围盒。
 *
 * 逐字对应原实现（`toPoints().map(applyMatrix4x4).fromPoints()`），只有一处**内部差异**：
 * 中间过程不再构造 `Vector3` 实例，而是用普通字面量当临时数组——
 * 结果完全相同，但少 8 次构造 + 8 次 map 回调（方案 §5.4 的「热路径零分配」）。
 *
 * 空盒直接原样返回（原实现 `if (this.isEmpty()) return this;`），不做变换。
 */
export function box3ApplyMatrix(a: Box3Like, mat: Matrix4x4Like, out: WritableBox3Like = newOut()): WritableBox3Like
{
    if (box3IsEmpty(a))
    {
        return box3Copy(a, out);
    }

    // 角点与变换结果都放局部：`out` 与 `a` 是同一个盒时（class 的 `applyMatrix` 就是 `out = this`）
    // 也不会在算完之前被改写
    const corners = box3ToPoints(a);
    const transformed: Vector3Like[] = [];

    for (let i = 0; i < 8; i++)
    {
        transformed.push(mat4TransformPoint3(mat, corners[i]));
    }

    return box3FromPoints(transformed, out);
}

/**
 * `Box3.randomPoint` 的纯函数版：`out = lerp(min, max, alpha)`（**分量**插值，
 * 与 `Vector3.lerp` 一致，不是标量插值）。
 *
 * `alpha` 由调用方提供（class 用 `Vector3.random()`）：纯函数层不接受隐式随机源（方案 §3.5）。
 */
export function box3RandomPoint(a: Box3Like, alpha: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    return vec3Lerp(a.min, a.max, alpha, out);
}

/**
 * `Box3.toString` 的纯函数版：`[AABB] (min=<...>, max=<...>)`。
 */
export function box3ToString(a: Box3Like): string
{
    return `[AABB] (min=${vec3ToString(a.min)}, max=${vec3ToString(a.max)})`;
}

/**
 * 内部工具：点到包围盒的**最近距离平方**（点在盒内时为 0）。
 *
 * class 上没有对应方法（`Box3` 无此公开 API），本函数是 A3 跨类型运算
 * （`Sphere` / `Plane` 与盒的相交）需要的公共部分，先在这里确立实现。
 */
export function box3DistanceSquaredToPoint(a: Box3Like, point: Vector3Like): number
{
    return vec3DistanceSquared(box3ClampPoint(a, point), point);
}
