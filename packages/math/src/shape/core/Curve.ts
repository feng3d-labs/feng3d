import { MATHUTIL_PRECISION, mathUtilClamp, mathUtilEquals } from '../../mathutil';
import { mat4FromAxisRotate, mat4TransformPoint3 } from '../../geom/matrix4x4';
import type { WritableMatrix4x4Like } from '../../geom/matrix4x4';
import type { VectorLike } from '../../geom/Vector';
import type { WritableVector2Like } from '../../geom/vector2';
import { vec2Copy, vec2Normalize, vec2Sub } from '../../geom/vector2';
import type { Vector3Like, WritableVector3Like } from '../../geom/vector3';
import { vec3Copy, vec3Cross, vec3Dot, vec3From, vec3Length, vec3NormalizeThickness, vec3Sub } from '../../geom/vector3';

/**
 * 是否为三维点（`z` 是数字）。
 *
 * 阶段 C-f：原 `Vector2` / `Vector3` 的实例方法（`distance` / `equals` / `normalize` …）
 * 随 class 一起退场，曲线算法改为「按形状分派到 `vec2Xxx` / `vec3Xxx` 纯函数」。
 * 形状判别只看 `z` 是否存在——`Vector2Like` 没有 z，`Vector3Like` 一定有。
 */
function isPoint3D(p: VectorLike): p is Vector3Like
{
    return typeof p.z === 'number';
}

/** 两点距离：二维走 `vec2Distance`、三维走 `vec3Distance`（与原 `a.distance(b)` 逐位一致）。 */
function pointDistance(a: VectorLike, b: VectorLike): number
{
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    if (isPoint3D(a) && isPoint3D(b))
    {
        const dz = a.z - b.z;

        return Math.sqrt((dx * dx) + (dy * dy) + (dz * dz));
    }

    return Math.sqrt((dx * dx) + (dy * dy));
}

/** 两点是否相等：二维走 `vec2Equals`、三维走 `vec3Equals`（精度取 `MATHUTIL_PRECISION`）。 */
export function pointEquals(a: VectorLike, b: VectorLike): boolean
{
    if (!mathUtilEquals(a.x - b.x, 0, MATHUTIL_PRECISION))
    {
        return false;
    }
    if (!mathUtilEquals(a.y - b.y, 0, MATHUTIL_PRECISION))
    {
        return false;
    }
    if (isPoint3D(a) && isPoint3D(b) && !mathUtilEquals(a.z - b.z, 0, MATHUTIL_PRECISION))
    {
        return false;
    }

    return true;
}

/**
 * `out = normalize(pt2 - pt1)`——原 `tangent.copy(pt2).sub(pt1).normalize()` 的纯函数等价物。
 *
 * 照原顺序「先 copy 再 sub」：`out` 与 `pt1` 别名时结果与原实现逐位一致
 * （原实现也会先把 `pt2` 拷进入参 `pt1`，再自减成零向量）。
 */
function pointCopySubNormalize(out: VectorLike, pt2: VectorLike, pt1: VectorLike): void
{
    if (isPoint3D(pt2))
    {
        const o = out as WritableVector3Like;

        vec3Copy(pt2, o);
        vec3Sub(o, pt1 as Vector3Like, o);
        vec3NormalizeThickness(o, 1, o);

        return;
    }

    const o = out as WritableVector2Like;

    vec2Copy(pt2, o);
    vec2Sub(o, pt1, o);
    vec2Normalize(o, o);
}

/**
 * 取曲线上参数 t 处的点，并保证返回非空点。
 *
 * **为什么是模块级函数而不是 Curve 的方法**：`protected` 成员会让 `Curve` 的**映射类型**
 * （如 `reactive()` 使用的 `UnwrapNestedRefs`）丢掉该成员——映射类型只映射 public 属性——
 * 于是「类实例」与「它的响应式代理」不再互相兼容，上层会在毫不相干的位置报出类型不兼容
 * （实测 `addons/ExtrudeGeometry` 的 `reactive(...).shapes` 赋值失败）。做成模块级函数既能
 * 把断言集中在一处，又不动类结构。
 *
 * 基类 `getPoint` 的占位实现只打印告警并返回 `null`（表示"未实现"），凡是参与几何计算的
 * 曲线子类都必须覆写 `getPoint` 并返回实际点；原实现在 `getPoints` / `getLengths` / `getTangent`
 * 等内部算法中直接使用 `getPoint` 的返回值，取到 `null` 时会在后续运算中失败。
 * 因此这里集中做一次非空断言，其余内部调用点不再重复断言，运行时行为与原实现完全一致。
 *
 * @param curve 曲线
 * @param t 曲线参数 [0 .. 1]
 * @param optionalTarget 可选的目标向量
 * @returns 曲线上的点
 */
function getPointNonNull<T extends VectorLike>(curve: Curve<T>, t: number, optionalTarget?: T): T
{
    return curve.getPoint(t, optionalTarget)!;
}

/**
 * An extensible curve object which contains methods for interpolation
 */
export class Curve<T extends VectorLike>
{
    /**
     * This value determines the amount of divisions when calculating the cumulative segment lengths of a curve via .getLengths.
     * To ensure precision when using methods like .getSpacedPoints, it is recommended to increase .arcLengthDivisions if the curve is very large.
     */
    arcLengthDivisions = 200;

    needsUpdate = false;

    cacheArcLengths: number[];

    getResolution(divisions: number): number
    {
        return divisions;
    }

    /**
     * Virtual base class method to overwrite and implement in subclasses
     *
     * - t [0 .. 1]
     * Returns a vector for point t of the curve where t is between 0 and 1
     *
     * 基类的占位实现没有取点能力，返回 null；子类必须覆写本方法并返回实际点。
     */
    getPoint(_t?: number, _optionalTarget?: T): T | null
    {
        console.warn('Curve: .getPoint() not implemented.');

        return null;
    }

    /**
     * Get point at relative position in curve according to arc length
     * Returns a vector for point at relative position in curve according to arc length
     *
     * @param u [0 .. 1]
     * @param optionalTarget
     */
    getPointAt(u: number, optionalTarget?: T)
    {
        const t = this.getUtoTmapping(u);

        return getPointNonNull(this, t, optionalTarget);
    }

    /**
     * Get sequence of points using getPoint( t )
     */
    getPoints(divisions = 5)
    {
        const points: T[] = [];

        for (let d = 0; d <= divisions; d++)
        {
            points.push(getPointNonNull(this, d / divisions));
        }

        return points;
    }

    /**
     * Get sequence of equi-spaced points using getPointAt( u )
     */
    getSpacedPoints(divisions: number)
    {
        if (divisions === undefined) divisions = 5;
        const points: T[] = [];

        for (let d = 0; d <= divisions; d++)
        {
            points.push(this.getPointAt(d / divisions));
        }

        return points;
    }

    /**
     * Get total curve arc length
     */
    getLength()
    {
        const lengths = this.getLengths();

        return lengths[lengths.length - 1];
    }

    /**
     * Get list of cumulative segment lengths
     */
    getLengths(divisions?: number)
    {
        if (divisions === undefined) divisions = this.arcLengthDivisions;

        if (this.cacheArcLengths && (this.cacheArcLengths.length === divisions + 1) && !this.needsUpdate)
        {
            return this.cacheArcLengths;
        }

        this.needsUpdate = false;

        const cache: number[] = [];
        let current: T; let
            last = getPointNonNull(this, 0);
        let sum = 0;

        cache.push(0);

        for (let p = 1; p <= divisions; p++)
        {
            current = getPointNonNull(this, p / divisions);
            sum += pointDistance(current, last);
            cache.push(sum);
            last = current;
        }

        this.cacheArcLengths = cache;

        return cache;
    }

    /**
     * Update the cumlative segment distance cache
     */
    updateArcLengths()
    {
        this.needsUpdate = true;
        this.getLengths();
    }

    /**
     * Given u ( 0 .. 1 ), get a t to find p. This gives you points which are equi distance
     */
    getUtoTmapping(u: number, distance?: number)
    {
        const arcLengths = this.getLengths();

        let i = 0;
        const il = arcLengths.length;

        let targetArcLength: number; // The targeted u distance value to get

        if (distance)
        {
            targetArcLength = distance;
        }
        else
        {
            targetArcLength = u * arcLengths[il - 1];
        }

        // binary search for the index with largest value smaller than target u distance
        let low = 0;
        let high = il - 1;
        let comparison: number;

        while (low <= high)
        {
            i = Math.floor(low + ((high - low) / 2)); // less likely to overflow, though probably not issue here, JS doesn't really have integers, all numbers are floats
            comparison = arcLengths[i] - targetArcLength;
            if (comparison < 0)
            {
                low = i + 1;
            }
            else if (comparison > 0)
            {
                high = i - 1;
            }
            else
            {
                high = i;
                break;
            }
        }

        i = high;

        if (arcLengths[i] === targetArcLength)
        {
            return i / (il - 1);
        }

        // we could get finer grain at lengths, or use simple interpolation between two points
        const lengthBefore = arcLengths[i];
        const lengthAfter = arcLengths[i + 1];

        const segmentLength = lengthAfter - lengthBefore;

        // determine where we are between the 'before' and 'after' points
        const segmentFraction = (targetArcLength - lengthBefore) / segmentLength;

        // add that fractional amount to t
        const t = (i + segmentFraction) / (il - 1);

        return t;
    }

    /**
     * Returns a unit vector tangent at t. If the subclassed curve do not implement its tangent derivation, 2 points a small delta apart will be used to find its gradient which seems to give a reasonable approximation
     * getTangent(t: number, optionalTarget?: T): T;
     */
    getTangent(t: number, optionalTarget: T): T
    {
        const delta = 0.0001;
        let t1 = t - delta;
        let t2 = t + delta;

        // Capping in case of danger

        if (t1 < 0) t1 = 0;
        if (t2 > 1) t2 = 1;

        const pt1 = getPointNonNull(this, t1);
        const pt2 = getPointNonNull(this, t2);

        const tangent = optionalTarget;

        pointCopySubNormalize(tangent, pt2, pt1);

        return tangent;
    }

    /**
     * Returns tangent at equidistance point u on the curve
     * getTangentAt(u: number, optionalTarget?: T): T;
     */
    getTangentAt(u: number, optionalTarget: T)
    {
        const t = this.getUtoTmapping(u);

        return this.getTangent(t, optionalTarget);
    }

    computeFrenetFrames(segments: number, closed: boolean)
    {
        // see http://www.cs.indiana.edu/pub/techreports/TR425.pdf

        const normal: WritableVector3Like = { x: 0, y: 0, z: 0 };

        const tangents: WritableVector3Like[] = [];
        const normals: WritableVector3Like[] = [];
        const binormals: WritableVector3Like[] = [];

        const vec: WritableVector3Like = { x: 0, y: 0, z: 0 };
        // 阶段 C-e：`Matrix4x4` 的 class 已删除，改为纯数据 out 字面量 + 纯函数（就地语义不变）
        const mat: WritableMatrix4x4Like = { elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] };

        // compute the tangent vectors for each segment on the curve
        // 本方法仅在 Vector3 曲线上有意义，将 this 视为 Curve<Vector3Like>
        const curve3 = this as unknown as Curve<Vector3Like>;

        for (let i = 0; i <= segments; i++)
        {
            const u = i / segments;

            tangents[i] = curve3.getTangentAt(u, { x: 0, y: 0, z: 0 }) as WritableVector3Like;
            vec3NormalizeThickness(tangents[i], 1, tangents[i]);
        }

        // select an initial normal vector perpendicular to the first tangent vector,
        // and in the direction of the minimum tangent xyz component
        normals[0] = { x: 0, y: 0, z: 0 };
        binormals[0] = { x: 0, y: 0, z: 0 };
        let min = Number.MAX_VALUE;
        const tx = Math.abs(tangents[0].x);
        const ty = Math.abs(tangents[0].y);
        const tz = Math.abs(tangents[0].z);

        if (tx <= min)
        {
            min = tx;
            vec3From(1, 0, 0, normal);
        }

        if (ty <= min)
        {
            min = ty;
            vec3From(0, 1, 0, normal);
        }

        if (tz <= min)
        {
            vec3From(0, 0, 1, normal);
        }

        vec3Cross(tangents[0], normal, vec);
        vec3NormalizeThickness(vec, 1, vec);
        vec3Cross(tangents[0], vec, normals[0]);
        vec3Cross(tangents[0], normals[0], binormals[0]);

        // compute the slowly-varying normal and binormal vectors for each segment on the curve
        for (let i = 1; i <= segments; i++)
        {
            normals[i] = vec3Copy(normals[i - 1]);
            binormals[i] = vec3Copy(binormals[i - 1]);
            vec3Cross(tangents[i - 1], tangents[i], vec);

            if (vec3Length(vec) > Number.EPSILON)
            {
                vec3NormalizeThickness(vec, 1, vec);

                const theta = Math.acos(mathUtilClamp(vec3Dot(tangents[i - 1], tangents[i]), -1, 1)); // clamp for floating pt errors

                mat4FromAxisRotate(vec, theta, mat);
                mat4TransformPoint3(mat, normals[i], normals[i]);
            }

            vec3Cross(tangents[i], normals[i], binormals[i]);
        }

        // if the curve is closed, postprocess the vectors so the first and last normal vectors are the same

        if (closed === true)
        {
            let theta = Math.acos(mathUtilClamp(vec3Dot(normals[0], normals[segments]), -1, 1));

            theta /= segments;

            vec3Cross(normals[0], normals[segments], vec);
            if (vec3Dot(tangents[0], vec) > 0)
            {
                theta = -theta;
            }

            for (let i = 1; i <= segments; i++)
            {
                // twist a little...
                mat4FromAxisRotate(tangents[i], theta * i, mat);
                mat4TransformPoint3(mat, normals[i], normals[i]);
                vec3Cross(tangents[i], normals[i], binormals[i]);
            }
        }

        return {
            tangents,
            normals,
            binormals
        };
    }
}
