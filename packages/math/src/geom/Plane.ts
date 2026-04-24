import { mathUtil } from '@feng3d/polyfill';
import { PlaneClassification } from '../enums/PlaneClassification';
import { Line3 } from './Line3';
import { Vector3 } from './Vector3';

declare module './Line3'
{
    interface Line3
    {
        /**
         * 获取经过该直线的平面
         */
        getPlane(plane?: Plane): Plane;
    }
}

/**
 * 平面
 *
 * ax+by+cz+d=0
 */
export class Plane
{
    /**
     * 平面A系数
     * <p>同样也是面法线x尺寸</p>
     */
    a: number;

    /**
     * 平面B系数
     * <p>同样也是面法线y尺寸</p>
     */
    b: number;

    /**
     * 平面C系数
     * <p>同样也是面法线z尺寸</p>
     */
    c: number;

    /**
     * 平面D系数
     * <p>同样也是原点到平面的距离</p>
     */
    d: number;

    /**
     * 创建一个平面
     * @param a A系数
     * @param b B系数
     * @param c C系数
     * @param d D系数
     */
    constructor(a = 0, b = 1, c = 0, d = 0)
    {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }

    /**
     * 设置
     *
     * @param a A系数
     * @param b B系数
     * @param c C系数
     * @param d D系数
     */
    set(a: number, b: number, c: number, d: number)
    {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;

        return this;
    }

    /**
     * 原点在平面上的投影
     * @param vOut 输出点
     */
    getOrigin(vOut = new Vector3())
    {
        return this.projectPoint(new Vector3(), vOut);
    }

    /**
     * 平面上随机点
     * @param vOut 输出点
     */
    randomPoint(vOut = new Vector3())
    {
        return this.getOrigin(vOut).add(this.getNormal().cross(new Vector3().random()));
    }

    /**
     * 法线
     */
    getNormal(vOut = new Vector3())
    {
        return vOut.set(this.a, this.b, this.c);
    }

    /**
     * 通过3顶点定义一个平面
     * @param p0 点0
     * @param p1 点1
     * @param p2 点2
     */
    fromPoints(p0: Vector3, p1: Vector3, p2: Vector3)
    {
        const normal = p1.subTo(p0).cross(p2.subTo(p1)).normalize();

        this.a = normal.x;
        this.b = normal.y;
        this.c = normal.z;
        this.d = -normal.dot(p0);

        return this;
    }

    /**
     * 随机平面
     */
    random()
    {
        const normal = new Vector3().random().normalize();
        this.a = normal.x;
        this.b = normal.y;
        this.c = normal.z;
        this.d = Math.random();

        return this;
    }

    /**
     * 根据法线与点定义平面
     * @param normal 平面法线
     * @param point 平面上任意一点
     */
    fromNormalAndPoint(normal: Vector3, point: Vector3)
    {
        normal = normal.clone().normalize();
        this.a = normal.x;
        this.b = normal.y;
        this.c = normal.z;
        this.d = -normal.dot(point);

        return this;
    }

    /**
     * 计算点与平面的距离
     * @param p 点
     * @returns        距离
     */
    distanceWithPoint(p: Vector3)
    {
        return (this.a * p.x) + (this.b * p.y) + (this.c * p.z) + this.d;
    }

    /**
     * 点是否在平面上
     * @param p 点
     */
    onWithPoint(p: Vector3, precision = mathUtil.PRECISION)
    {
        return mathUtil.equals(this.distanceWithPoint(p), 0, precision);
    }

    /**
     * 顶点分类
     * <p>把顶点分为后面、前面、相交三类</p>
     * @param p 顶点
     * @returns         顶点类型 PlaneClassification.BACK,PlaneClassification.FRONT,PlaneClassification.INTERSECT
     */
    classifyPoint(p: Vector3, precision = mathUtil.PRECISION)
    {
        const len = this.distanceWithPoint(p);

        if (mathUtil.equals(len, 0, precision))
        {
            return PlaneClassification.INTERSECT;
        }
        if (len < 0)
        {
            return PlaneClassification.BACK;
        }

        return PlaneClassification.FRONT;
    }

    /**
     * 判定与直线是否平行
     * @param line3D
     */
    parallelWithLine3D(line3D: Line3, precision = mathUtil.PRECISION)
    {
        if (mathUtil.equals(line3D.direction.dot(this.getNormal()), 0, precision))
        { return true; }

        return false;
    }

    /**
     * 判定与平面是否平行
     * @param plane3D
     */
    parallelWithPlane3D(plane3D: Plane, precision = mathUtil.PRECISION)
    {
        if (plane3D.getNormal().isParallel(this.getNormal(), precision))
        { return true; }

        return false;
    }

    /**
     * 获取与直线交点
     *
     * @see 3D数学基础：图形与游戏开发 P269
     */
    intersectWithLine3(line: Line3)
    {
        const n = this.getNormal();
        const d = line.direction;
        const dn = d.dot(n);

        if (mathUtil.equals(dn, 0))
        {
            // 处理直线在平面内
            if (this.onWithPoint(line.origin))
            { return line.clone(); }

            return null;
        }
        const t = (-this.d - line.origin.dot(n)) / dn;
        const cp = line.getPoint(t);

        return cp;
    }

    /**
     * 获取与平面相交直线
     * @param plane3D
     */
    intersectWithPlane3D(plane3D: Plane)
    {
        if (this.parallelWithPlane3D(plane3D))
        { return null; }
        const direction = this.getNormal().crossTo(plane3D.getNormal());
        const a0 = this.a;
        const b0 = this.b;
        const c0 = this.c;
        const d0 = this.d;
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

        return new Line3(new Vector3(x, y, z), direction);
    }

    /**
     * 标准化
     */
    normalize()
    {
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;

        const s = (a * a) + (b * b) + (c * c);

        if (s > 0)
        {
            const invLen = 1 / Math.sqrt(s);

            this.a = a * invLen;
            this.b = b * invLen;
            this.c = c * invLen;
            this.d = d * invLen;
        }
        else
        {
            console.warn(`无效平面 ${this}`);
        }

        return this;
    }

    /**
     * 翻转平面
     */
    negate()
    {
        this.a = -this.a;
        this.b = -this.b;
        this.c = -this.c;
        this.d = -this.d;

        return this;
    }

    /**
     * 点到平面的投影
     * @param point
     */
    projectPoint(point: Vector3, vOut = new Vector3())
    {
        return this.getNormal(vOut).scaleNumber(-this.distanceWithPoint(point)).add(point);
    }

    /**
     * 与指定点最近的点
     * @param point 点
     * @param vOut 输出点
     */
    closestPointWithPoint(point: Vector3, vOut = new Vector3())
    {
        return this.projectPoint(point, vOut);
    }

    /**
     * 与其他两平面相交于一点
     *
     * @param plane0
     * @param plane1
     *
     * @see 3D数学基础：图形与游戏开发 P271
     */
    intersectWithTwoPlane3D(plane0: Plane, plane1: Plane)
    {
        const n1 = plane0.getNormal();
        const n2 = plane1.getNormal();
        const n3 = this.getNormal();

        const d1 = -plane0.d;
        const d2 = -plane1.d;
        const d3 = -this.d;

        const n1xn2 = n1.crossTo(n2);
        const n2xn3 = n2.crossTo(n3);
        const n3xn1 = n3.crossTo(n1);

        let m = n1xn2.dot(n3);

        if (mathUtil.equals(m, 0))
        {
            // 不存在交点或者不存在唯一的交点
            return null;
        }
        m = 1 / m;
        const p = n2xn3.scaleNumberTo(d1).add(n3xn1.scaleNumber(d2)).add(n1xn2.scaleNumber(d3)).scaleNumber(m);

        return p;
    }

    /**
     * 与指定平面是否相等
     *
     * @param plane
     * @param precision
     */
    equals(plane: Plane, precision = mathUtil.PRECISION)
    {
        if (!mathUtil.equals(this.a - plane.a, 0, precision))
        {
            return false;
        }
        if (!mathUtil.equals(this.b - plane.b, 0, precision))
        {
            return false;
        }
        if (!mathUtil.equals(this.c - plane.c, 0, precision))
        {
            return false;
        }
        if (!mathUtil.equals(this.d - plane.d, 0, precision))
        {
            return false;
        }

        return true;
    }

    /**
     * 复制
     */
    copy(plane: Plane)
    {
        this.a = plane.a;
        this.b = plane.b;
        this.c = plane.c;
        this.d = plane.d;

        return this;
    }

    /**
     * 克隆
     */
    clone()
    {
        return new Plane().copy(this);
    }

    /**
     * 输出字符串
     */
    toString(): string
    {
        return `Plane3D [this.a:${this.a}, this.b:${this.b}, this.c:${this.c}, this.d:${this.d}]`;
    }
}
// var v0 = new Vector3();
// var v1 = new Vector3();
// var v2 = new Vector3();

Line3.prototype.getPlane = function getPlane(plane = new Plane())
{
    return plane.fromNormalAndPoint(new Vector3().random().cross(this.direction), this.origin);
};
