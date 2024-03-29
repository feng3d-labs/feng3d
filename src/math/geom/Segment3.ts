import { mathUtil } from '../../polyfill/MathUtil';
import { Line3 } from './Line3';
import { Vector3 } from './Vector3';

/**
 * 3D线段
 */
export class Segment3
{
    /**
     * 线段起点
     */
    p0: Vector3;
    /**
     * 线段终点
     */
    p1: Vector3;

    constructor(p0 = new Vector3(), p1 = new Vector3())
    {
        this.p0 = p0;
        this.p1 = p1;
    }

    /**
     * 初始化线段
     * @param p0
     * @param p1
     */
    fromPoints(p0: Vector3, p1: Vector3)
    {
        this.p0 = p0;
        this.p1 = p1;

        return this;
    }

    /**
     * 随机线段
     */
    random()
    {
        this.p0.random();
        this.p1.random();

        return this;
    }

    /**
     * 线段长度
     */
    getLength()
    {
        return Math.sqrt(this.getLengthSquared());
    }

    /**
     * 线段长度的平方
     */
    getLengthSquared()
    {
        return this.p0.distanceSquared(this.p1);
    }

    /**
     * 获取线段所在直线
     */
    getLine(line = new Line3())
    {
        return line.fromPoints(this.p0.clone(), this.p1.clone());
    }

    /**
     * 获取指定位置上的点，当position=0时返回p0，当position=1时返回p1
     * @param position 线段上的位置
     */
    getPoint(position: number, pout = new Vector3()): Vector3
    {
        const newPoint: Vector3 = pout.copy(this.p0).add(this.p1.subTo(this.p0).scaleNumber(position));

        return newPoint;
    }

    /**
     * 判定点是否在线段上
     * @param point
     */
    onWithPoint(point: Vector3, precision = mathUtil.PRECISION)
    {
        return mathUtil.equals(this.getPointDistance(point), 0, precision);
    }

    /**
     * 判定点是否投影在线段上
     * @param point
     */
    projectOnWithPoint(point: Vector3)
    {
        let position = this.getPositionByPoint(point);

        position = Number(position.toFixed(6));

        return position >= 0 && position <= 1;
    }

    /**
     * 获取点在线段上的位置，当点投影在线段上p0位置时返回0，当点投影在线段p1上时返回1
     * @param point 点
     */
    getPositionByPoint(point: Vector3)
    {
        const vec = this.p1.subTo(this.p0);
        const position = point.subTo(this.p0).dot(vec) / vec.lengthSquared;

        return position;
    }

    /**
     * 获取直线到点的法线（线段到点垂直方向）
     * @param point 点
     */
    getNormalWithPoint(point: Vector3)
    {
        const direction = this.p1.subTo(this.p0);
        const l1 = point.subTo(this.p0);
        const n = direction.crossTo(l1).crossTo(direction).normalize();

        return n;
    }

    /**
     * 指定点到该线段距离，如果投影点不在线段上时，该距离为指定点到最近的线段端点的距离
     * @param point 指定点
     */
    getPointDistanceSquare(point: Vector3)
    {
        const position = this.getPositionByPoint(point);

        let lengthSquared: number;

        if (position <= 0)
        {
            lengthSquared = point.subTo(this.p0).lengthSquared;
        }
        else if (position >= 1)
        {
            lengthSquared = point.subTo(this.p1).lengthSquared;
        }
        else
        {
            const s0 = point.subTo(this.p0).lengthSquared;
            const s1 = position * position * this.p1.subTo(this.p0).lengthSquared;

            lengthSquared = Math.abs(s0 - s1);
        }

        return lengthSquared;
    }

    /**
     * 指定点到该线段距离，如果投影点不在线段上时，该距离为指定点到最近的线段端点的距离
     * @param point 指定点
     */
    getPointDistance(point: Vector3)
    {
        let v = this.getPointDistanceSquare(point);

        v = Math.sqrt(v);

        return v;
    }

    /**
     * 与直线相交
     * @param line 直线
     */
    intersectionWithLine(line: Line3)
    {
        const l = this.getLine();
        const r = l.intersectWithLine3D(line);

        if (!r) return null;
        if (r instanceof Line3)
        {
            return this.clone();
        }
        if (this.onWithPoint(r))
        {
            return r;
        }

        return null;
    }

    /**
     * 与线段相交
     * @param segment 直线
     */
    intersectionWithSegment(segment: Segment3)
    {
        const r = this.intersectionWithLine(segment.getLine());

        if (!r) return null;
        if (r instanceof Segment3)
        {
            const ps = [this.p0, this.p1].map((p) =>
                segment.clampPoint(p));

            if (this.onWithPoint(ps[0]))
            {
                return new Segment3().fromPoints(ps[0], ps[1]);
            }

            return null;
        }
        if (this.onWithPoint(r))
        {
            return r;
        }

        return null;
    }

    /**
     * 与指定点最近的点
     * @param point 点
     * @param vout 输出点
     */
    closestPointWithPoint(point: Vector3, vout = new Vector3())
    {
        this.getLine().closestPointWithPoint(point, vout);
        if (this.onWithPoint(vout))
        {
            return vout;
        }
        if (point.distanceSquared(this.p0) < point.distanceSquared(this.p1))
        {
            return vout.copy(this.p0);
        }

        return vout.copy(this.p1);
    }

    /**
     * 把点压缩到线段内
     */
    clampPoint(point: Vector3, pout = new Vector3())
    {
        return this.getPoint(mathUtil.clamp(this.getPositionByPoint(point), 0, 1), pout);
    }

    /**
     * 判定线段是否相等
     */
    equals(segment: Segment3)
    {
        return (this.p0.equals(segment.p0) && this.p1.equals(segment.p1)) || (this.p0.equals(segment.p1) && this.p1.equals(segment.p0));
    }

    /**
     * 复制
     */
    copy(segment: Segment3)
    {
        this.p0.copy(segment.p0);
        this.p1.copy(segment.p1);

        return this;
    }

    /**
     * 克隆
     */
    clone()
    {
        return new Segment3().copy(this);
    }
}
