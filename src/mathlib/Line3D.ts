namespace feng3d
{
	/**
	 * 3d直线
	 * @author feng 2013-6-13
	 */
    export class Line3D
    {
        /** 直线上某一点 */
        position: Vector3D;

        /** 直线方向 */
        direction: Vector3D;

		/**
		 * 根据直线某点与方向创建直线
		 * @param position 直线上某点
		 * @param direction 直线的方向
		 */
        constructor(position?: Vector3D, direction?: Vector3D)
        {
            this.position = position ? position : new Vector3D();
            this.direction = direction ? direction : new Vector3D(0, 0, 1);
        }

		/**
		 * 根据直线上两点初始化直线
		 * @param p0 Vector3D
		 * @param p1 Vector3D
		 */
        fromPoints(p0: Vector3D, p1: Vector3D)
        {
            this.position = p0;
            this.direction = p1.subtract(p0);
            return this;
        }

		/**
		 * 根据直线某点与方向初始化直线
		 * @param position 直线上某点
		 * @param direction 直线的方向
		 */
        fromPosAndDir(position: Vector3D, direction: Vector3D)
        {
            this.position = position;
            this.direction = direction;
            return this;
        }

		/**
		 * 获取直线上的一个点
		 * @param length 与原点距离
		 */
        getPoint(length = 0): Vector3D
        {
            var lengthDir: Vector3D = this.direction.clone();
            lengthDir.scaleBy(length);
            var newPoint: Vector3D = this.position.add(lengthDir);
            return newPoint;
        }

        /**
         * 指定点到该直线距离
         * @param point 指定点
         */
        getPointDistance(point: Vector3D)
        {
            var cos = point.subtract(this.position).normalize().dotProduct(this.direction.normalize());
            var sin = Math.sqrt(1 - cos * cos);
            var distance = sin * point.subtract(this.position).length;
            distance = Number(distance.toPrecision(6));
            return distance;
        }
    }
}
