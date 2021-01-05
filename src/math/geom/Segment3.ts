namespace feng3d
{
    /**
     * 3D线段
     */
    export class Segment3
    {
        /**
         * 初始化线段
         * @param p0 
         * @param p1 
         */
        static fromPoints(p0: Vector3, p1: Vector3)
        {
            return new Segment3(p0, p1);
        }

        /**
         * 随机线段
         */
        static random()
        {
            return new Segment3(Vector3.random(), Vector3.random());
        }

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
            var newPoint: Vector3 = pout.copy(this.p0).add(this.p1.subTo(this.p0).scaleNumber(position));
            return newPoint;
        }

        /**
         * 判定点是否在线段上
         * @param point 
         */
        onWithPoint(point: Vector3, precision = Math.PRECISION)
        {
            return Math.equals(this.getPointDistance(point), 0, precision);
        }

        /**
         * 判定点是否投影在线段上
         * @param point 
         */
        projectOnWithPoint(point: Vector3)
        {
            var position = this.getPositionByPoint(point);
            position = Number(position.toFixed(6));
            return 0 <= position && position <= 1;
        }

        /**
         * 获取点在线段上的位置，当点投影在线段上p0位置时返回0，当点投影在线段p1上时返回1
         * @param point 点
         */
        getPositionByPoint(point: Vector3)
        {
            var vec = this.p1.subTo(this.p0);
            var position = point.subTo(this.p0).dot(vec) / vec.lengthSquared;
            return position;
        }

        /**
         * 获取直线到点的法线（线段到点垂直方向）
         * @param point 点
         */
        getNormalWithPoint(point: Vector3)
        {
            var direction = this.p1.subTo(this.p0);
            var l1 = point.subTo(this.p0);
            var n = direction.crossTo(l1).crossTo(direction).normalize();
            return n;
        }

        /**
         * 指定点到该线段距离，如果投影点不在线段上时，该距离为指定点到最近的线段端点的距离
         * @param point 指定点
         */
        getPointDistanceSquare(point: Vector3)
        {
            var position = this.getPositionByPoint(point);
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
                var s0 = point.subTo(this.p0).lengthSquared;
                var s1 = position * position * this.p1.subTo(this.p0).lengthSquared;
                var lengthSquared = Math.abs(s0 - s1);
            }
            return lengthSquared;
        }

        /**
         * 指定点到该线段距离，如果投影点不在线段上时，该距离为指定点到最近的线段端点的距离
         * @param point 指定点
         */
        getPointDistance(point: Vector3)
        {
            var v = this.getPointDistanceSquare(point);
            v = Math.sqrt(v);
            return v;
        }

        /**
         * 与直线相交
         * @param line 直线
         */
        intersectionWithLine(line: Line3)
        {
            var l = this.getLine();
            var r = l.intersectWithLine3D(line);
            if (!r) return null;
            if (r instanceof Line3)
                return this.clone();
            if (this.onWithPoint(r))
                return r;
            return null;
        }

        /**
         * 与线段相交
         * @param segment 直线
         */
        intersectionWithSegment(segment: Segment3)
        {
            var r = this.intersectionWithLine(segment.getLine());
            if (!r) return null;
            if (r instanceof Segment3)
            {
                var ps = [this.p0, this.p1].map((p) =>
                {
                    return segment.clampPoint(p);
                });
                if (this.onWithPoint(ps[0]))
                    return Segment3.fromPoints(ps[0], ps[1]);
                return null;
            }
            if (this.onWithPoint(r))
                return r;
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
                return vout;
            if (point.distanceSquared(this.p0) < point.distanceSquared(this.p1))
                return vout.copy(this.p0);
            return vout.copy(this.p1);
        }

        /**
         * 把点压缩到线段内
         */
        clampPoint(point: Vector3, pout = new Vector3())
        {
            return this.getPoint(Math.clamp(this.getPositionByPoint(point), 0, 1), pout);
        }

        /**
         * 判定线段是否相等
         */
        equals(segment: Segment3)
        {
            return (this.p0.equals(segment.p0) && this.p1.equals(segment.p1)) || (this.p0.equals(segment.p1) && this.p1.equals(segment.p0))
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
}