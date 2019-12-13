namespace feng3d
{
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
         * @return 射线起点到交点的距离
         */
        rayIntersection(position: Vector3, direction: Vector3, targetNormal: Vector3): number
        {
            if (this.containsPoint(position))
                return 0;

            var px: number = position.x - this.center.x, py: number = position.y - this.center.y, pz: number = position.z - this.center.z;
            var vx: number = direction.x, vy: number = direction.y, vz: number = direction.z;
            var rayEntryDistance: number;

            var a: number = vx * vx + vy * vy + vz * vz;
            var b: number = 2 * (px * vx + py * vy + pz * vz);
            var c: number = px * px + py * py + pz * pz - this.radius * this.radius;
            var det: number = b * b - 4 * a * c;

            if (det >= 0)
            { // ray goes through sphere
                var sqrtDet: number = Math.sqrt(det);
                rayEntryDistance = (-b - sqrtDet) / (2 * a);
                if (rayEntryDistance >= 0)
                {
                    targetNormal.x = px + rayEntryDistance * vx;
                    targetNormal.y = py + rayEntryDistance * vy;
                    targetNormal.z = pz + rayEntryDistance * vz;
                    targetNormal.normalize();

                    return rayEntryDistance;
                }
            }

            // ray misses sphere
            return -1;
        }

        /**
         * 是否包含指定点
         * @param position 点
         */
        containsPoint(position: Vector3): boolean
        {
            return position.subTo(this.center).lengthSquared <= this.radius * this.radius;
        }

        /**
         * 从一组点初始化球
         * @param points 点列表
         */
        fromPoints(points: Vector3[])
        {
            var box = new Box3();
            var center = this.center;
            box.fromPoints(points).getCenter(center);
            var maxRadiusSq = 0;
            for (var i = 0, n = points.length; i < n; i++)
            {
                maxRadiusSq = Math.max(maxRadiusSq, center.distanceSquared(points[i]));
            }
            this.radius = Math.sqrt(maxRadiusSq);
            return this;
        }

        /**
         * 从一组顶点初始化球
         * @param positions 坐标数据列表
         */
        fromPositions(positions: number[])
        {
            var box = new Box3();
            var v = new Vector3();
            var center = this.center;
            box.formPositions(positions).getCenter(center);
            var maxRadiusSq = 0;
            for (var i = 0, n = positions.length; i < n; i += 3)
            {
                maxRadiusSq = Math.max(maxRadiusSq, center.distanceSquared(v.set(positions[i], positions[i + 1], positions[i + 2])));
            }
            this.radius = Math.sqrt(maxRadiusSq);
            return this;
        }

        /**
         * 拷贝
         */
        copy(sphere: Sphere)
        {
            this.center.copy(sphere.center);
            this.radius = sphere.radius;
            return this;
        }

        /**
         * 克隆
         */
        clone()
        {
            return new Sphere().copy(this);
        }

        /**
         * 是否为空
         */
        isEmpty()
        {
            return this.radius <= 0;
        }

        /**
         * 点到球的距离
         * @param point 点
         */
        distanceToPoint(point: Vector3)
        {
            return point.distance(this.center) - this.radius;
        }

        /**
         * 与指定球是否相交
         */
        intersectsSphere(sphere: Sphere)
        {
            var radiusSum = this.radius + sphere.radius;
            return sphere.center.distanceSquared(this.center) <= radiusSum * radiusSum;
        }

        /**
         * 是否与盒子相交
         * @param box 盒子
         */
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
            return Math.abs(plane.distanceWithPoint(this.center)) <= this.radius;
        }

        /**
         * 
         * @param point 点
         * @param pout 输出点
         */
        clampPoint(point: Vector3, pout = new Vector3())
        {
            var deltaLengthSq = this.center.distanceSquared(point);
            pout.copy(point);
            if (deltaLengthSq > (this.radius * this.radius))
            {
                pout.sub(this.center).normalize();
                pout.scaleNumber(this.radius).add(this.center);
            }
            return pout;
        }

        /**
         * 获取包围盒
         */
        getBoundingBox(box = new Box3())
        {
            box.init(this.center.subNumberTo(this.radius), this.center.addNumberTo(this.radius));
            return box;
        }

        /**
         * 应用矩阵
         * @param matrix 矩阵
         */
        applyMatrix4(matrix: Matrix4x4)
        {
            this.center.applyMatrix4x4(matrix);
            this.radius = this.radius * matrix.getMaxScaleOnAxis();
            return this;
        }

        /**
         * 平移
         * @param offset 偏移量
         */
        translate(offset: Vector3)
        {
            this.center.add(offset);
            return this;
        }

        /**
         * 是否相等
         * @param sphere 球
         */
        equals(sphere: Sphere)
        {
            return sphere.center.equals(this.center) && (sphere.radius === this.radius);
        }

        toString(): string
        {
            return "Sphere [center:" + this.center.toString() + ", radius:" + this.radius + "]";
        }
    }
}