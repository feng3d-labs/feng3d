namespace feng3d
{
	/**
	 * 3d直线
	 * @author feng 2013-6-13
	 */
    export class Line3D
    {
        /**
		 * 根据直线上两点初始化直线
		 * @param p0 Vector3
		 * @param p1 Vector3
		 */
        static fromPoints(p0: Vector3, p1: Vector3)
        {
            return new Line3D().fromPoints(p0, p1);
        }

		/**
		 * 根据直线某点与方向初始化直线
		 * @param position 直线上某点
		 * @param direction 直线的方向
		 */
        static fromPosAndDir(position: Vector3, direction: Vector3)
        {
            return new Line3D().fromPosAndDir(position, direction);
        }

        /**
         * 随机直线，比如用于单元测试
         */
        static random()
        {
            return new Line3D(Vector3.random(), Vector3.random());
        }

        /**
         * 直线上某一点
         */
        position: Vector3;

        /**
         * 直线方向(已标准化)
         */
        direction: Vector3;

		/**
		 * 根据直线某点与方向创建直线
		 * @param position 直线上某点
		 * @param direction 直线的方向
		 */
        constructor(position?: Vector3, direction?: Vector3)
        {
            this.position = position ? position : new Vector3();
            this.direction = (direction ? direction : new Vector3(0, 0, 1)).normalize();
        }

		/**
		 * 根据直线上两点初始化直线
		 * @param p0 Vector3
		 * @param p1 Vector3
		 */
        fromPoints(p0: Vector3, p1: Vector3)
        {
            this.position = p0;
            this.direction = p1.subTo(p0).normalize();
            return this;
        }

		/**
		 * 根据直线某点与方向初始化直线
		 * @param position 直线上某点
		 * @param direction 直线的方向
		 */
        fromPosAndDir(position: Vector3, direction: Vector3)
        {
            this.position = position;
            this.direction = direction.normalize();
            return this;
        }

        /**
         * 获取经过该直线的平面
         */
        getPlane(plane = new Plane3D())
        {
            return plane.fromNormalAndPoint(Vector3.random().cross(this.direction), this.position);
        }

		/**
		 * 获取直线上的一个点
		 * @param length 与原点距离
		 */
        getPoint(length = 0, vout = new Vector3())
        {
            return vout.copy(this.direction).scale(length).add(this.position);
        }

        /**
         * 指定点到该直线距离
         * @param point 指定点
         */
        distanceWithPoint(point: Vector3)
        {
            return this.closestPointWithPoint(point).sub(point).length;
        }

        /**
         * 与指定点最近点的系数
         * @param point 点
         */
        closestPointParameterWithPoint(point: Vector3)
        {
            return point.subTo(this.position).dot(this.direction);
        }

        /**
         * 与指定点最近的点
         * @param point 点
         * @param vout 输出点
         */
        closestPointWithPoint(point: Vector3, vout = new Vector3())
        {
            var t = this.closestPointParameterWithPoint(point);
            return this.getPoint(t, vout);
        }

        /**
         * 判定点是否在直线上
         * @param point 点
         * @param precision 精度
         */
        onWithPoint(point: Vector3, precision = FMath.PRECISION)
        {
            if (FMath.equals(this.distanceWithPoint(point), 0, precision))
                return true;
            return false;
        }

        /**
         * 与直线相交
         * @param line3D 直线
         */
        intersectWithLine3D(line3D: Line3D)
        {
            // 处理相等
            if (this.equals(line3D))
                return this.clone();
            // 处理平行
            if (this.direction.isParallel(line3D.direction))
                return null;

            var plane = this.getPlane();
            var point = <Vector3>plane.intersectWithLine3D(line3D);
            if (this.onWithPoint(point))
                return point;
            return null;
        }

        /**
         * 应用矩阵
         * @param mat 矩阵
         */
        applyMatri4x4(mat: Matrix4x4)
        {
            mat.transformVector(this.position, this.position);
            mat.deltaTransformVector(this.direction, this.direction);
            return this;
        }

        /**
         * 与指定向量比较是否相等
         * @param v 比较的向量
         * @param precision 允许误差
         * @return 相等返回true，否则false
         */
        equals(line: Line3D, precision = FMath.PRECISION)
        {
            if (!this.onWithPoint(line.position))
                return false;
            if (!this.onWithPoint(line.position.addTo(line.direction)))
                return false;
            return true;
        }

        /**
         * 拷贝
         * @param line 直线
         */
        copy(line: Line3D)
        {
            this.position.copy(line.position);
            this.direction.copy(line.direction);
            return this;
        }

        /**
         * 克隆
         */
        clone()
        {
            return new Line3D().copy(this);
        }
    }
}
