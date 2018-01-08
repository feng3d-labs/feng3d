namespace feng3d
{
    /**
     * 3D选段
     */
    export class Segment3D
    {
        p0: Vector3D;
        p1: Vector3D;

        constructor(p0: Vector3D, p1: Vector3D)
        {
            this.p0 = p0;
            this.p1 = p1;
        }

        on(point: Vector3D)
        {
            if (point.equals(this.p0) || point.equals(this.p1))
                return true;
            if (!this.projectOn(point))
                return false;
            var cos = point.subtract(this.p0).normalize().dotProduct(this.p1.subtract(this.p0).normalize());
            if (Number(Math.abs(cos).toPrecision(6)) == 1)
            {
                return true;
            }
            return false;
        }

        projectOn(point: Vector3D)
        {
            var position = this.getPositionByPoint(point);
            return 0 <= position && position <= 1;
        }

		/**
         * 获取指定位置上的点，当position=0时返回p0，当position=1时返回p1
		 * @param position 线段上的位置
		 */
        getPointByPosition(position = 0): Vector3D
        {
            var newPoint: Vector3D = this.p0.add(this.p1.subtract(this.p0).scaleBy(position));
            return newPoint;
        }

        /**
         * 获取点在线段上的位置，当点投影在线段上p0位置时返回0，当点投影在线段p1上时返回1
         * @param point 点
         */
        getPositionByPoint(point: Vector3D)
        {
            var vec = this.p1.subtract(this.p0);
            var position = point.subtract(this.p0).dotProduct(vec) / vec.lengthSquared;
            return position;
        }

        /**
         * 指定点到该线段距离，如果投影点不在线段上时，该距离为指定点到最近的线段端点的距离
         * @param point 指定点
         */
        getPointDistance(point: Vector3D)
        {
            var position = this.getPositionByPoint(point);
            if (position <= 0)
            {
                distance = point.subtract(this.p0).length;
            }
            else if (position >= 1)
            {
                distance = point.subtract(this.p1).length;
            }
            else
            {
                var s0 = point.subtract(this.p0).length;
                var s1 = position * this.p1.subtract(this.p0).length;
                var distance = Math.sqrt(s0 * s0 - s1 * s1);
                distance = Number(distance.toPrecision(6));
            }
            return distance;
        }
    }
}