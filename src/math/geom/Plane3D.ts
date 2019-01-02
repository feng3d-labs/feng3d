namespace feng3d
{
	/**
	 * 3d面
     * ax+by+cz+d=0
	 */
    export class Plane3D
    {
        /**
		 * 通过3顶点定义一个平面
		 * @param p0		点0
		 * @param p1		点1
		 * @param p2		点2
		 */
        static fromPoints(p0: Vector3, p1: Vector3, p2: Vector3)
        {
            return new Plane3D().fromPoints(p0, p1, p2);
        }

		/**
		 * 根据法线与点定义平面
		 * @param normal		平面法线
		 * @param point			平面上任意一点
		 */
        static fromNormalAndPoint(normal: Vector3, point: Vector3)
        {
            return new Plane3D().fromNormalAndPoint(normal, point);
        }

        /**
         * 随机平面
         */
        static random()
        {
            var normal = Vector3.random().normalize();
            return new Plane3D(normal.x, normal.y, normal.z, Math.random());
        }

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
		 * @param a		A系数
		 * @param b		B系数
		 * @param c		C系数
		 * @param d		D系数
		 */
        constructor(a = 0, b = 1, c = 0, d = 0)
        {
            this.a = a;
            this.b = b;
            this.c = c;
            this.d = d;
        }

        /**
         * 原点在平面上的投影
         * @param vout 输出点
         */
        getOrigin(vout = new Vector3())
        {
            return this.projectPoint(new Vector3(), vout);
        }

        /**
         * 平面上随机点
         * @param vout 输出点
         */
        randomPoint(vout = new Vector3())
        {
            return this.getOrigin(vout).add(this.getNormal().cross(Vector3.random()));
        }

        /**
         * 法线
         */
        getNormal(vout = new Vector3())
        {
            return vout.init(this.a, this.b, this.c);
        }

		/**
		 * 通过3顶点定义一个平面
		 * @param p0		点0
		 * @param p1		点1
		 * @param p2		点2
		 */
        fromPoints(p0: Vector3, p1: Vector3, p2: Vector3)
        {
            // p1.subTo(p0, v0);
            // p2.subTo(p1, v1);
            // var normal = v0.crossTo(v1).normalize();
            var normal = p1.subTo(p0).crossTo(p2.subTo(p1)).normalize();
            this.a = normal.x;
            this.b = normal.y;
            this.c = normal.z;
            this.d = -normal.dot(p0);
            return this;
        }

		/**
		 * 根据法线与点定义平面
		 * @param normal		平面法线
		 * @param point			平面上任意一点
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
		 * @param p		点
		 * @returns		距离
		 */
        distanceWithPoint(p: Vector3)
        {
            return this.a * p.x + this.b * p.y + this.c * p.z + this.d;
        }

        /**
         * 点是否在平面上
         * @param p 点
         */
        onWithPoint(p: Vector3)
        {
            return FMath.equals(this.distanceWithPoint(p), 0);
        }

		/**
		 * 顶点分类
		 * <p>把顶点分为后面、前面、相交三类</p>
		 * @param p			顶点
		 * @return			顶点类型 PlaneClassification.BACK,PlaneClassification.FRONT,PlaneClassification.INTERSECT
		 */
        classifyPoint(p: Vector3, precision = FMath.PRECISION)
        {
            var len = this.distanceWithPoint(p);
            if (FMath.equals(len, 0, precision))
                return PlaneClassification.INTERSECT;
            if (len < 0)
                return PlaneClassification.BACK;
            return PlaneClassification.FRONT;
        }

        /**
         * 判定与直线是否平行
         * @param line3D 
         */
        parallelWithLine3D(line3D: Line3D, precision = FMath.PRECISION)
        {
            if (FMath.equals(line3D.direction.dot(this.getNormal()), 0, precision))
                return true;
            return false;
        }

        /**
         * 判定与平面是否平行
         * @param plane3D
         */
        parallelWithPlane3D(plane3D: Plane3D, precision = FMath.PRECISION)
        {
            if (plane3D.getNormal().isParallel(this.getNormal(), precision))
                return true;
            return false;
        }

        /**
         * 获取与直线交点
         */
        intersectWithLine3D(line3D: Line3D)
        {
            //处理平行
            if (this.parallelWithLine3D(line3D))
            {
                // 处理直线在平面内
                if (this.onWithPoint(line3D.position))
                    return line3D.clone();
                return null;
            }

            var lineDir = line3D.direction.clone();
            lineDir.normalize();
            var cosAngle = lineDir.dot(this.getNormal());
            var distance = this.distanceWithPoint(line3D.position);
            var addVec = lineDir.clone();
            addVec.scaleNumber(-distance / cosAngle);
            var crossPos = line3D.position.addTo(addVec);
            return crossPos;
        }

        /**
         * 获取与平面相交直线
         * @param plane3D 
         */
        intersectWithPlane3D(plane3D: Plane3D)
        {
            if (this.parallelWithPlane3D(plane3D))
                return null;
            var direction = this.getNormal().crossTo(plane3D.getNormal());
            var a0 = this.a, b0 = this.b, c0 = this.c, d0 = this.d,
                a1 = plane3D.a, b1 = plane3D.b, c1 = plane3D.c, d1 = plane3D.d;

            var x: number, y: number, z: number;
            // 解 方程组 a0*x+b0*y+c0*z+d0=0;a1*x+b1*y+c1*z+d1=0;
            if (b1 * c0 - b0 * c1 != 0)
            {
                x = 0;
                y = (-c0 * d1 + c1 * d0 + (a0 * c1 - a1 * c0) * x) / (b1 * c0 - b0 * c1);
                z = (-b1 * d0 + b0 * d1 + (a1 * b0 - a0 * b1) * x) / (b1 * c0 - b0 * c1);
            } else if (a0 * c1 - a1 * c0 != 0)
            {
                y = 0;
                x = (-c1 * d0 + c0 * d1 + (b1 * c0 - b0 * c1) * y) / (a0 * c1 - a1 * c0);
                z = (-a0 * d1 + a1 * d0 + (a1 * b0 - a0 * b1) * y) / (a0 * c1 - a1 * c0);
            } else if (a1 * b0 - a0 * b1 != 0)
            {
                z = 0;
                x = (-b0 * d1 + b1 * d0 + (b1 * c0 - b0 * c1) * z) / (a1 * b0 - a0 * b1);
                y = (-a1 * d0 + a0 * d1 + (a0 * c1 - a1 * c0) * z) / (a1 * b0 - a0 * b1);
            } else
            {
                throw "无法计算平面相交结果";
            }
            return new Line3D(new Vector3(x, y, z), direction);
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
        projectPoint(point: Vector3, vout = new Vector3())
        {
            return this.getNormal(vout).scaleNumber(- this.distanceWithPoint(point)).add(point);
        }

        /**
         * 与指定点最近的点
         * @param point 点
         * @param vout 输出点
         */
        closestPointWithPoint(point: Vector3, vout = new Vector3())
        {
            return this.projectPoint(point, vout);
        }

        /**
         * 复制
         */
        copy(plane: Plane3D)
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
            return new Plane3D().copy(this);
        }

		/**
		 * 输出字符串
		 */
        toString(): string
        {
            return "Plane3D [this.a:" + this.a + ", this.b:" + this.b + ", this.c:" + this.c + ", this.d:" + this.d + "]";
        }
    }
    // var v0 = new Vector3();
    // var v1 = new Vector3();
    // var v2 = new Vector3();
}
