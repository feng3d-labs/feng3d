import { mathUtil } from '@feng3d/polyfill';
import { mat4FromAxisRotate, mat4TransformPoint3 } from '../../geom/matrix4x4Ops';
import type { WritableMatrix4x4Like } from '../../geom/matrix4x4Ops';
import { Vector } from '../../geom/Vector';
import { Vector3 } from '../../geom/Vector3';

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
function getPointNonNull<T extends Vector>(curve: Curve<T>, t: number, optionalTarget?: T): T
{
    return curve.getPoint(t, optionalTarget)!;
}

/**
 * An extensible curve object which contains methods for interpolation
 */
export class Curve<T extends Vector>
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
            sum += current.distance(last);
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

        tangent.copy(pt2).sub(pt1).normalize();

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

        const normal = new Vector3();

        const tangents: Vector3[] = [];
        const normals: Vector3[] = [];
        const binormals: Vector3[] = [];

        const vec = new Vector3();
        // 阶段 C-e：`Matrix4x4` 的 class 已删除，改为纯数据 out 字面量 + 纯函数（就地语义不变）
        const mat: WritableMatrix4x4Like = { elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] };

        // compute the tangent vectors for each segment on the curve
        // 本方法仅在 Vector3 曲线上有意义，将 this 视为 Curve<Vector3>
        const curve3 = this as unknown as Curve<Vector3>;

        for (let i = 0; i <= segments; i++)
        {
            const u = i / segments;

            tangents[i] = curve3.getTangentAt(u, new Vector3());
            tangents[i].normalize();
        }

        // select an initial normal vector perpendicular to the first tangent vector,
        // and in the direction of the minimum tangent xyz component
        normals[0] = new Vector3();
        binormals[0] = new Vector3();
        let min = Number.MAX_VALUE;
        const tx = Math.abs(tangents[0].x);
        const ty = Math.abs(tangents[0].y);
        const tz = Math.abs(tangents[0].z);

        if (tx <= min)
        {
            min = tx;
            normal.set(1, 0, 0);
        }

        if (ty <= min)
        {
            min = ty;
            normal.set(0, 1, 0);
        }

        if (tz <= min)
        {
            normal.set(0, 0, 1);
        }

        tangents[0].crossTo(normal, vec).normalize();
        tangents[0].crossTo(vec, normals[0]);
        tangents[0].crossTo(normals[0], binormals[0]);

        // compute the slowly-varying normal and binormal vectors for each segment on the curve
        for (let i = 1; i <= segments; i++)
        {
            normals[i] = normals[i - 1].clone();
            binormals[i] = binormals[i - 1].clone();
            tangents[i - 1].crossTo(tangents[i], vec);

            if (vec.length > Number.EPSILON)
            {
                vec.normalize();

                const theta = Math.acos(mathUtil.clamp(tangents[i - 1].dot(tangents[i]), -1, 1)); // clamp for floating pt errors

                mat4FromAxisRotate(vec, theta, mat);
                mat4TransformPoint3(mat, normals[i], normals[i]);
            }

            tangents[i].crossTo(normals[i], binormals[i]);
        }

        // if the curve is closed, postprocess the vectors so the first and last normal vectors are the same

        if (closed === true)
        {
            let theta = Math.acos(mathUtil.clamp(normals[0].dot(normals[segments]), -1, 1));

            theta /= segments;

            if (tangents[0].dot(normals[0].crossTo(normals[segments], vec)) > 0)
            {
                theta = -theta;
            }

            for (let i = 1; i <= segments; i++)
            {
                // twist a little...
                mat4FromAxisRotate(tangents[i], theta * i, mat);
                mat4TransformPoint3(mat, normals[i], normals[i]);
                tangents[i].crossTo(normals[i], binormals[i]);
            }
        }

        return {
            tangents,
            normals,
            binormals
        };
    }
}
