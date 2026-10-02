import { mathUtil } from '@feng3d/polyfill';
import type { Box3Like } from './box3Ops';
import type { Matrix4x4Like } from './matrix4x4Ops';
import type { PlaneLike, WritablePlaneLike } from './planeOps';
import { planeCopy, planeDistanceWithPoint, planeGetNormal, planeNormalize, planeSet } from './planeOps';
import type { SphereLike } from './sphereOps';
import type { Vector3Like } from './vector3Ops';

/**
 * `Frustum` 运算的**纯函数**形式（issue #134，方案见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md`）。
 *
 * 它持有 6 个 `PlaneLike`（数组），实现复用已就绪的 `plane*` 纯函数。
 *
 * 注意 `Frustum.set` / `copy` 是**就地复制**（`planes[i].copy(...)`）而不是替换数组元素，
 * 所以 `out.planes` 里必须已经有 6 个可写的平面对象——缺省 `out` 会按 `new Plane()`
 * 的默认值（`a=0, b=1, c=0, d=0`）新建 6 个。
 */

/** 纯函数可接受的截头锥体形状。 */
export interface FrustumLike
{
    readonly planes: readonly PlaneLike[];
}

/** 可写出的截头锥体目标（`out` 参数用）。 */
export interface WritableFrustumLike
{
    planes: WritablePlaneLike[];
}

/** 缺省输出目标：6 个与 `new Plane()` 默认值一致的平面。 */
function defaultOut(): WritableFrustumLike
{
    const planes: WritablePlaneLike[] = [];

    for (let i = 0; i < 6; i++)
    {
        planes.push({ a: 0, b: 1, c: 0, d: 0 });
    }

    return { planes };
}

/**
 * `Frustum.set` 的纯函数版：把 6 个平面就地复制进 `out`（不替换数组元素）。
 */
export function frustumSet(
    p0: PlaneLike, p1: PlaneLike, p2: PlaneLike, p3: PlaneLike, p4: PlaneLike, p5: PlaneLike,
    out: WritableFrustumLike = defaultOut(),
): WritableFrustumLike
{
    const sources = [p0, p1, p2, p3, p4, p5];

    for (let i = 0; i < 6; i++)
    {
        planeCopy(sources[i], out.planes[i]);
    }

    return out;
}

/**
 * `Frustum.copy` / `Frustum.clone` 的纯函数版。
 */
export function frustumCopy(a: FrustumLike, out: WritableFrustumLike = defaultOut()): WritableFrustumLike
{
    for (let i = 0; i < 6; i++)
    {
        planeCopy(a.planes[i], out.planes[i]);
    }

    return out;
}

/**
 * `Frustum.fromMatrix` 的纯函数版：从投影矩阵提取 6 个平面。
 *
 * 其中第 6 个是 **near** 平面，用的是 **WebGPU 坐标系**（z→[0,1]）的公式，
 * 与 OpenGL（z→[-1,1]）不同 —— 逐字照抄原实现。
 */
export function frustumFromMatrix(matrix: Matrix4x4Like, out: WritableFrustumLike = defaultOut()): WritableFrustumLike
{
    const me = matrix.elements;
    const me0 = me[0]; const me1 = me[1]; const me2 = me[2]; const me3 = me[3];
    const me4 = me[4]; const me5 = me[5]; const me6 = me[6]; const me7 = me[7];
    const me8 = me[8]; const me9 = me[9]; const me10 = me[10]; const me11 = me[11];
    const me12 = me[12]; const me13 = me[13]; const me14 = me[14]; const me15 = me[15];

    planeSet(me3 - me0, me7 - me4, me11 - me8, me15 - me12, out.planes[0]);
    planeNormalize(out.planes[0]);
    planeSet(me3 + me0, me7 + me4, me11 + me8, me15 + me12, out.planes[1]);
    planeNormalize(out.planes[1]);
    planeSet(me3 + me1, me7 + me5, me11 + me9, me15 + me13, out.planes[2]);
    planeNormalize(out.planes[2]);
    planeSet(me3 - me1, me7 - me5, me11 - me9, me15 - me13, out.planes[3]);
    planeNormalize(out.planes[3]);
    // far 平面
    planeSet(me3 - me2, me7 - me6, me11 - me10, me15 - me14, out.planes[4]);
    planeNormalize(out.planes[4]);
    // near 平面：WebGPU 坐标系（z→[0,1]）与 OpenGL（z→[-1,1]）提取公式不同，
    // 参考 three.js Frustum.setFromProjectionMatrix(WebGPUCoordinateSystem)。
    planeSet(me2, me6, me10, me14, out.planes[5]);
    planeNormalize(out.planes[5]);

    return out;
}

/**
 * `Frustum.intersectsSphere` 的纯函数版：球心到 6 个平面的距离都不小于 -半径。
 */
export function frustumIntersectsSphere(a: FrustumLike, sphere: SphereLike): boolean
{
    const center = sphere.center;
    const negRadius = -sphere.radius;

    for (let i = 0; i < 6; i++)
    {
        if (planeDistanceWithPoint(a.planes[i], center) < negRadius)
        {
            return false;
        }
    }

    return true;
}

/**
 * `Frustum.intersectsBox` 的纯函数版：对每个平面取盒子的"最远角"判定。
 */
export function frustumIntersectsBox(a: FrustumLike, box: Box3Like): boolean
{
    const temp = { x: 0, y: 0, z: 0 };

    for (let i = 0; i < 6; i++)
    {
        const normal = planeGetNormal(a.planes[i]);

        // corner at max distance
        temp.x = normal.x > 0 ? box.max.x : box.min.x;
        temp.y = normal.y > 0 ? box.max.y : box.min.y;
        temp.z = normal.z > 0 ? box.max.z : box.min.z;

        if (planeDistanceWithPoint(a.planes[i], temp) < 0)
        {
            return false;
        }
    }

    return true;
}

/**
 * `Frustum.containsPoint` 的纯函数版：点到 6 个平面的距离都不小于 -precision。
 */
export function frustumContainsPoint(a: FrustumLike, point: Vector3Like, precision = mathUtil.PRECISION): boolean
{
    for (let i = 0; i < 6; i++)
    {
        if (planeDistanceWithPoint(a.planes[i], point) < -precision)
        {
            return false;
        }
    }

    return true;
}
