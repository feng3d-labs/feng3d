import { Box3 } from './Box3';
import { Matrix4x4 } from './Matrix4x4';
import { Plane } from './Plane';
import { Vector3 } from './Vector3';
import {
    sphereApplyMatrix4,
    sphereClampPoint,
    sphereContainsPoint,
    sphereCopy,
    sphereDistanceToPoint,
    sphereEquals,
    sphereFromPoints,
    sphereFromPositions,
    sphereGetBoundingBox,
    sphereIntersectsPlane,
    sphereIntersectsSphere,
    sphereIsEmpty,
    sphereRayIntersection,
    sphereToString,
    sphereTranslate,
} from './sphereOps';

/**
 * 球
 */
export class Sphere
{
    /**
     * 从一组点初始化球
     * @param points 点列表
     */
    static fromPoints(points: Vector3[])
    {
        return new Sphere().fromPoints(points);
    }

    /**
     * 从一组顶点初始化球
     * @param positions 坐标数据列表
     */
    static fromPositions(positions: number[])
    {
        return new Sphere().fromPositions(positions);
    }

    /**
     * 球心
     */
    center: Vector3;

    /**
     * 半径
     */
    radius: number;

    /**
     * Create a Sphere with ABCD coefficients
     */
    constructor(center = new Vector3(), radius = 0)
    {
        this.center = center;
        this.radius = radius;
    }

    /**
     * 与射线相交
     * @param position 射线起点
     * @param direction 射线方向
     * @param targetNormal 目标法线
     * @returns 射线起点到交点的距离
     */
    rayIntersection(position: Vector3, direction: Vector3, targetNormal: Vector3): number
    {
        return sphereRayIntersection(this, position, direction, targetNormal);
    }

    /**
     * 是否包含指定点
     * @param position 点
     */
    containsPoint(position: Vector3): boolean
    {
        return sphereContainsPoint(this, position);
    }

    /**
     * 从一组点初始化球
     * @param points 点列表
     */
    fromPoints(points: Vector3[])
    {
        sphereFromPoints(points, this);

        return this;
    }

    /**
     * 从一组顶点初始化球
     * @param positions 坐标数据列表
     */
    fromPositions(positions: number[])
    {
        sphereFromPositions(positions, this);

        return this;
    }

    /**
     * 拷贝
     */
    copy(sphere: Sphere)
    {
        sphereCopy(sphere, this);

        return this;
    }

    /**
     * 克隆
     */
    clone()
    {
        const result = new Sphere();

        sphereCopy(this, result);

        return result;
    }

    /**
     * 是否为空
     */
    isEmpty()
    {
        return sphereIsEmpty(this);
    }

    /**
     * 点到球的距离
     * @param point 点
     */
    distanceToPoint(point: Vector3)
    {
        return sphereDistanceToPoint(this, point);
    }

    /**
     * 与指定球是否相交
     */
    intersectsSphere(sphere: Sphere)
    {
        return sphereIntersectsSphere(this, sphere);
    }

    /**
     * 是否与盒子相交
     * @param box 盒子
     */
    // 与 Box3.intersectsSphere 互相引用（Box3 那边同样在等本批的 ops），会成环，故暂留原实现
    intersectsBox(box: Box3)
    {
        return box.intersectsSphere(this);
    }

    /**
     * 是否与平面相交
     * @param plane 平面
     */
    intersectsPlane(plane: Plane)
    {
        return sphereIntersectsPlane(this, plane);
    }

    /**
     *
     * @param point 点
     * @param pout 输出点
     */
    clampPoint(point: Vector3, pout = new Vector3())
    {
        return sphereClampPoint(this, point, pout);
    }

    /**
     * 获取包围盒
     */
    getBoundingBox(box = new Box3())
    {
        return sphereGetBoundingBox(this, box);
    }

    /**
     * 应用矩阵
     * @param matrix 矩阵
     */
    applyMatrix4(matrix: Matrix4x4)
    {
        sphereApplyMatrix4(this, matrix, this);

        return this;
    }

    /**
     * 平移
     * @param offset 偏移量
     */
    translate(offset: Vector3)
    {
        sphereTranslate(this, offset, this);

        return this;
    }

    /**
     * 是否相等
     * @param sphere 球
     */
    equals(sphere: Sphere)
    {
        return sphereEquals(this, sphere);
    }

    toString(): string
    {
        return sphereToString(this);
    }
}
