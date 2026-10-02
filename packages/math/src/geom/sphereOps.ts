import type { WritableBox3Like } from './box3Ops';
import { box3FormPositions, box3FromPoints, box3GetCenter, box3Init } from './box3Ops';
import type { Matrix4x4Like } from './matrix4x4Ops';
import { mat4GetMaxScaleOnAxis, mat4TransformPoint3 } from './matrix4x4Ops';
import type { PlaneLike } from './planeOps';
import { planeDistanceWithPoint } from './planeOps';
import type { Vector3Like, WritableVector3Like } from './vector3Ops';
import { vec3Copy, vec3DistanceSquared, vec3NormalizeThickness } from './vector3Ops';

/**
 * `Sphere` 运算的**纯函数**形式（issue #134，方案见 `docs/MATH_PURE_FUNCTIONS_MIGRATION.md`）。
 *
 * 与其它几何类型一样是**嵌套结构**（`{ center, radius }`），实现复用已就绪的
 * `vec3*` / `box3*` / `plane*` / `mat4*` 纯函数。
 *
 * ## 本文件不做的部分
 *
 * `intersectsBox` 依赖 `Box3.intersectsSphere`（Box3 那边同样要等 Sphere 的 ops），
 * 两边互相引用会成环，所以**留在 class 内**用原实现。
 */

/** 纯函数可接受的球形状。 */
export interface SphereLike
{
    readonly center: Vector3Like;
    readonly radius: number;
}

/** 可写出的球目标（`out` 参数用）。 */
export interface WritableSphereLike
{
    center: WritableVector3Like;
    radius: number;
}

/** 缺省输出目标：球心为零向量、半径为 0（与 `new Sphere()` 一致）。 */
function defaultOut(): WritableSphereLike
{
    return { center: { x: 0, y: 0, z: 0 }, radius: 0 };
}

/**
 * `Sphere.copy` / `Sphere.clone` 的纯函数版。
 */
export function sphereCopy(a: SphereLike, out: WritableSphereLike = defaultOut()): WritableSphereLike
{
    vec3Copy(a.center, out.center);
    out.radius = a.radius;

    return out;
}

/**
 * `Sphere.fromPoints` 的纯函数版：由点集的最小包围盒中心与最远点距离确定球。
 */
export function sphereFromPoints(points: readonly Vector3Like[], out: WritableSphereLike = defaultOut()): WritableSphereLike
{
    const box: WritableBox3Like = { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } };

    box3FromPoints(points as Vector3Like[], box);
    box3GetCenter(box, out.center);

    let maxRadiusSq = 0;

    for (let i = 0, n = points.length; i < n; i++)
    {
        maxRadiusSq = Math.max(maxRadiusSq, vec3DistanceSquared(out.center, points[i]));
    }
    out.radius = Math.sqrt(maxRadiusSq);

    return out;
}

/**
 * `Sphere.fromPositions` 的纯函数版：由坐标数据（每 3 个数一个点）同上确定球。
 */
export function sphereFromPositions(positions: readonly number[], out: WritableSphereLike = defaultOut()): WritableSphereLike
{
    const box: WritableBox3Like = { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } };

    box3FormPositions(positions as number[], box);
    box3GetCenter(box, out.center);

    let maxRadiusSq = 0;

    for (let i = 0, n = positions.length; i < n; i += 3)
    {
        const dx = positions[i] - out.center.x;
        const dy = positions[i + 1] - out.center.y;
        const dz = positions[i + 2] - out.center.z;

        maxRadiusSq = Math.max(maxRadiusSq, (dx * dx) + (dy * dy) + (dz * dz));
    }
    out.radius = Math.sqrt(maxRadiusSq);

    return out;
}

/**
 * `Sphere.isEmpty` 的纯函数版。
 */
export function sphereIsEmpty(a: SphereLike): boolean
{
    return a.radius <= 0;
}

/**
 * `Sphere.containsPoint` 的纯函数版。
 */
export function sphereContainsPoint(a: SphereLike, position: Vector3Like): boolean
{
    const dx = position.x - a.center.x;
    const dy = position.y - a.center.y;
    const dz = position.z - a.center.z;

    return ((dx * dx) + (dy * dy) + (dz * dz)) <= (a.radius * a.radius);
}

/**
 * `Sphere.distanceToPoint` 的纯函数版：点到球面的距离（球内为负）。
 */
export function sphereDistanceToPoint(a: SphereLike, point: Vector3Like): number
{
    const dx = point.x - a.center.x;
    const dy = point.y - a.center.y;
    const dz = point.z - a.center.z;

    return Math.sqrt((dx * dx) + (dy * dy) + (dz * dz)) - a.radius;
}

/**
 * `Sphere.intersectsSphere` 的纯函数版。
 */
export function sphereIntersectsSphere(a: SphereLike, b: SphereLike): boolean
{
    const radiusSum = a.radius + b.radius;

    return vec3DistanceSquared(b.center, a.center) <= (radiusSum * radiusSum);
}

/**
 * `Sphere.intersectsPlane` 的纯函数版。
 */
export function sphereIntersectsPlane(a: SphereLike, plane: PlaneLike): boolean
{
    return Math.abs(planeDistanceWithPoint(plane, a.center)) <= a.radius;
}

/**
 * `Sphere.clampPoint` 的纯函数版：把点压到球内（球外则投影到球面）。
 */
export function sphereClampPoint(a: SphereLike, point: Vector3Like, out: WritableVector3Like = { x: 0, y: 0, z: 0 }): WritableVector3Like
{
    const deltaLengthSq = vec3DistanceSquared(a.center, point);

    vec3Copy(point, out);
    if (deltaLengthSq > (a.radius * a.radius))
    {
        // 原实现是 pout.sub(center).normalize().scaleNumber(radius).add(center)：
        // 注意这里用的是 normalize()（长度平方判定），不是 Normalize()（kEpsilon）
        const dx = out.x - a.center.x;
        const dy = out.y - a.center.y;
        const dz = out.z - a.center.z;

        vec3NormalizeThickness({ x: dx, y: dy, z: dz }, 1, out);
        out.x = (out.x * a.radius) + a.center.x;
        out.y = (out.y * a.radius) + a.center.y;
        out.z = (out.z * a.radius) + a.center.z;
    }

    return out;
}

/**
 * `Sphere.getBoundingBox` 的纯函数版。
 */
export function sphereGetBoundingBox(a: SphereLike, out: WritableBox3Like = { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } }): WritableBox3Like
{
    return box3Init(
        { x: a.center.x - a.radius, y: a.center.y - a.radius, z: a.center.z - a.radius },
        { x: a.center.x + a.radius, y: a.center.y + a.radius, z: a.center.z + a.radius },
        out,
    );
}

/**
 * `Sphere.applyMatrix4` 的纯函数版：球心按矩阵变换、半径按最大轴向缩放放大。
 */
export function sphereApplyMatrix4(a: SphereLike, matrix: Matrix4x4Like, out: WritableSphereLike = defaultOut()): WritableSphereLike
{
    mat4TransformPoint3(matrix, a.center, out.center);
    out.radius = a.radius * mat4GetMaxScaleOnAxis(matrix);

    return out;
}

/**
 * `Sphere.translate` 的纯函数版。
 */
export function sphereTranslate(a: SphereLike, offset: Vector3Like, out: WritableSphereLike = defaultOut()): WritableSphereLike
{
    out.center.x = a.center.x + offset.x;
    out.center.y = a.center.y + offset.y;
    out.center.z = a.center.z + offset.z;
    out.radius = a.radius;

    return out;
}

/**
 * `Sphere.equals` 的纯函数版。
 */
export function sphereEquals(a: SphereLike, b: SphereLike): boolean
{
    return b.center.x === a.center.x && b.center.y === a.center.y && b.center.z === a.center.z
        && (b.radius === a.radius);
}

/**
 * `Sphere.toString` 的纯函数版。
 */
export function sphereToString(a: SphereLike): string
{
    return `Sphere [center:(${a.center.x}, ${a.center.y}, ${a.center.z}), radius:${a.radius}]`;
}

/**
 * `Sphere.rayIntersection` 的纯函数版：返回射线起点到交点的距离（未命中为 -1），
 * 命中时把交点方向写入 `targetNormal`（原实现会就地 `normalize()`）。
 */
export function sphereRayIntersection(a: SphereLike, position: Vector3Like, direction: Vector3Like, targetNormal: WritableVector3Like): number
{
    if (sphereContainsPoint(a, position))
    { return 0; }

    const px = position.x - a.center.x;
    const py = position.y - a.center.y;
    const pz = position.z - a.center.z;
    const vx = direction.x;
    const vy = direction.y;
    const vz = direction.z;

    const aa = (vx * vx) + (vy * vy) + (vz * vz);
    const bb = 2 * ((px * vx) + (py * vy) + (pz * vz));
    const cc = (px * px) + (py * py) + (pz * pz) - (a.radius * a.radius);
    const det = (bb * bb) - (4 * aa * cc);

    if (det >= 0)
    {
        const sqrtDet = Math.sqrt(det);
        const rayEntryDistance = (-bb - sqrtDet) / (2 * aa);

        if (rayEntryDistance >= 0)
        {
            vec3NormalizeThickness(
                {
                    x: px + (rayEntryDistance * vx),
                    y: py + (rayEntryDistance * vy),
                    z: pz + (rayEntryDistance * vz),
                },
                1,
                targetNormal,
            );

            return rayEntryDistance;
        }
    }

    // ray misses sphere
    return -1;
}
