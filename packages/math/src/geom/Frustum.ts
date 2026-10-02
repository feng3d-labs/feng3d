import { mathUtil } from '@feng3d/polyfill';
import { Box3 } from './Box3';
import { Matrix4x4 } from './Matrix4x4';
import { Plane } from './Plane';
import { Sphere } from './Sphere';
import { Vector3 } from './Vector3';
import {
    frustumContainsPoint,
    frustumCopy,
    frustumFromMatrix,
    frustumIntersectsBox,
    frustumIntersectsSphere,
    frustumSet,
} from './frustumOps';

/**
 * 截头锥体
 *
 * Frustums are used to determine what is inside the camera's field of view. They help speed up the rendering process.
 *
 * Frustums用于确定摄像机的视场范围。它们有助于加速渲染过程。
 *
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author bhouston / http://clara.io
 */
export class Frustum
{
    planes: Plane[];

    /**
     * 初始化截头锥体
     *
     * @param p0
     * @param p1
     * @param p2
     * @param p3
     * @param p4
     * @param p5
     */
    constructor(p0 = new Plane(), p1 = new Plane(), p2 = new Plane(), p3 = new Plane(), p4 = new Plane(), p5 = new Plane())
    {
        this.planes = [
            p0, p1, p2, p3, p4, p5
        ];
    }

    set(p0: Plane, p1: Plane, p2: Plane, p3: Plane, p4: Plane, p5: Plane)
    {
        frustumSet(p0, p1, p2, p3, p4, p5, this);

        return this;
    }

    clone()
    {
        const result = new Frustum();

        frustumCopy(this, result);

        return result;
    }

    copy(frustum: Frustum)
    {
        frustumCopy(frustum, this);

        return this;
    }

    /**
     * 从矩阵初始化
     *
     * @param matrix4x4 矩阵
     */
    fromMatrix(matrix4x4: Matrix4x4)
    {
        frustumFromMatrix(matrix4x4, this);

        return this;
    }

    /**
     * 是否与球体相交
     *
     * @param sphere 球体
     */
    intersectsSphere(sphere: Sphere)
    {
        return frustumIntersectsSphere(this, sphere);
    }

    /**
     * 是否与长方体相交
     *
     * @param box 长方体
     */
    intersectsBox(box: Box3)
    {
        return frustumIntersectsBox(this, box);
    }

    /**
     * 与点是否相交
     *
     * @param point
     */
    containsPoint(point: Vector3, precision = mathUtil.PRECISION)
    {
        return frustumContainsPoint(this, point, precision);
    }
}
