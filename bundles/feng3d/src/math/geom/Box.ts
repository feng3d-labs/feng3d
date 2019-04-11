namespace feng3d
{
    /**
     * 长方体，盒子
     */
    export class Box
    {
        /**
         * 从一组顶点初始化盒子
         * @param positions 坐标数据列表
         */
        static formPositions(positions: number[])
        {
            return new Box().formPositions(positions);
        }

        /**
         * 从一组点初始化盒子
         * @param ps 点列表
         */
        static fromPoints(ps: Vector3[])
        {
            return new Box().fromPoints(ps);
        }

        /**
         * 随机盒子
         */
        static random()
        {
            var min = Vector3.random();
            var max = Vector3.random().add(min);
            return new Box(min, max);
        }

        /**
         * 最小点
         */
        min: Vector3;
        /**
         * 最大点
         */
        max: Vector3;

        /**
         * 获取中心点
         * @param vout 输出向量
         */
        getCenter(vout = new Vector3())
        {
            return vout.copy(this.min).add(this.max).scaleNumber(0.5);
        }

        /**
         * 尺寸
         */
        getSize(vout = new Vector3())
        {
            return vout.copy(this.max).sub(this.min);
        }

        /**
         * 创建盒子
         * @param min 最小点
         * @param max 最大点
         */
        constructor(min = new Vector3(+Infinity, + Infinity, + Infinity), max = new Vector3(- Infinity, - Infinity, - Infinity))
        {
            this.min = min.clone();
            this.max = max.clone();
        }

        /**
         * 初始化盒子
         * @param min 最小值
         * @param max 最大值
         */
        init(min: Vector3, max: Vector3)
        {
            this.min = min.clone();
            this.max = max.clone();
            return this;
        }

        /**
         * 转换为盒子八个角所在点列表
         */
        toPoints()
        {
            var min = this.min;
            var max = this.max;
            return [
                new Vector3(min.x, min.y, min.z),
                new Vector3(max.x, min.y, min.z),
                new Vector3(min.x, max.y, min.z),
                new Vector3(min.x, min.y, max.z),
                new Vector3(min.x, max.y, max.z),
                new Vector3(max.x, min.y, max.z),
                new Vector3(max.x, max.y, min.z),
                new Vector3(max.x, max.y, max.z),
            ];
        }

        /**
         * 从一组顶点初始化盒子
         * @param positions 坐标数据列表
         */
        formPositions(positions: number[])
        {
            var minX = + Infinity;
            var minY = + Infinity;
            var minZ = + Infinity;

            var maxX = - Infinity;
            var maxY = - Infinity;
            var maxZ = - Infinity;

            for (var i = 0, l = positions.length; i < l; i += 3)
            {
                var x = positions[i];
                var y = positions[i + 1];
                var z = positions[i + 2];

                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (z < minZ) minZ = z;

                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
                if (z > maxZ) maxZ = z;
            }

            this.min.init(minX, minY, minZ);
            this.max.init(maxX, maxY, maxZ);
            return this;
        }

        /**
         * 从一组点初始化盒子
         * @param ps 点列表
         */
        fromPoints(ps: Vector3[])
        {
            this.empty();
            ps.forEach(element =>
            {
                this.expandByPoint(element);
            });
            return this;
        }

        /**
         * 盒子内随机点
         */
        randomPoint(pout = new Vector3())
        {
            return pout.copy(this.min).lerp(this.max, Vector3.random());
        }

        /**
         * 使用点扩张盒子
         * @param point 点
         */
        expandByPoint(point: Vector3)
        {
            this.min.min(point);
            this.max.max(point);
            return this;
        }

        /**
         * 应用矩阵
         * @param mat 矩阵
         */
        applyMatrix3D(mat: Matrix4x4)
        {
            this.fromPoints(this.toPoints().map((v) =>
            {
                return v.applyMatrix4x4(mat);
            }));
            return this;
        }

        /**
         * 应用矩阵
         * @param mat 矩阵
         */
        applyMatrix3DTo(mat: Matrix4x4, out = new Box())
        {
            return out.copy(this).applyMatrix3D(mat);
        }

        /**
         * 
         */
        clone(): Box
        {
            return new Box(this.min.clone(), this.max.clone());
        }

        /**
         * 是否包含指定点
         * @param p 点
         */
        containsPoint(p: Vector3)
        {
            return this.min.lessequal(p) && this.max.greaterequal(p);
        }

        /**
         * 是否包含盒子
         * @param box 盒子
         */
        containsBox(box: Box): boolean
        {
            return this.min.lessequal(box.min) && this.max.greaterequal(box.max);
        }

        /**
         * 拷贝
         * @param box 盒子
         */
        copy(box: Box)
        {
            this.min.copy(box.min);
            this.max.copy(box.max);
            return this;
        }

        /**
         * 比较盒子是否相等
         * @param box 盒子
         */
        equals(box: Box)
        {
            return this.min.equals(box.min) && this.max.equals(box.max);
        }

        /**
         * 膨胀盒子
         * @param dx x方向膨胀量 
         * @param dy y方向膨胀量
         * @param dz z方向膨胀量
         */
        inflate(dx, dy, dz)
        {
            this.min.x -= dx / 2;
            this.min.y -= dy / 2;
            this.min.z -= dz / 2;
            this.max.x += dx / 2;
            this.max.y += dy / 2;
            this.max.z += dz / 2;
        }

        /**
         * 膨胀盒子
         * @param delta 膨胀量
         */
        inflatePoint(delta: Vector3)
        {
            delta = delta.scaleNumberTo(0.5);
            this.min.sub(delta);
            this.max.add(delta);
        }

        /**
         * 与盒子相交
         * @param box 盒子
         */
        intersection(box: Box)
        {
            this.min.clamp(box.min, box.max);
            this.max.clamp(box.min, box.max);
            return this;
        }

        /**
         * 与盒子相交
         * @param box 盒子
         */
        intersectionTo(box: Box, vbox = new Box())
        {
            return vbox.copy(this).intersection(box);
        }

        /**
         * 盒子是否相交
         * @param box 盒子
         */
        intersects(box: Box)
        {
            var b = this.intersectionTo(box);
            var c = b.getCenter();
            return this.containsPoint(c) && box.containsPoint(c);
        }

        /**
         * 与射线相交
         * @param position 射线起点
         * @param direction 射线方向
         * @param targetNormal 相交处法线
         * @return 起点到box距离
         */
        rayIntersection(position: Vector3, direction: Vector3, targetNormal: Vector3)
        {
            if (this.containsPoint(position))
                return 0;

            var halfExtentsX = (this.max.x - this.min.x) / 2;
            var halfExtentsY = (this.max.y - this.min.y) / 2;
            var halfExtentsZ = (this.max.z - this.min.z) / 2;

            var centerX = this.min.x + halfExtentsX;
            var centerY = this.min.y + halfExtentsY;
            var centerZ = this.min.z + halfExtentsZ;

            var px = position.x - centerX;
            var py = position.y - centerY;
            var pz = position.z - centerZ;

            var vx = direction.x;
            var vy = direction.y;
            var vz = direction.z;

            var ix;
            var iy;
            var iz;
            var rayEntryDistance = -1;

            // ray-plane tests
            var intersects = false;
            if (vx < 0)
            {
                rayEntryDistance = (halfExtentsX - px) / vx;
                if (rayEntryDistance > 0)
                {
                    iy = py + rayEntryDistance * vy;
                    iz = pz + rayEntryDistance * vz;
                    if (iy > -halfExtentsY && iy < halfExtentsY && iz > -halfExtentsZ && iz < halfExtentsZ)
                    {
                        targetNormal.x = 1;
                        targetNormal.y = 0;
                        targetNormal.z = 0;

                        intersects = true;
                    }
                }
            }
            if (!intersects && vx > 0)
            {
                rayEntryDistance = (-halfExtentsX - px) / vx;
                if (rayEntryDistance > 0)
                {
                    iy = py + rayEntryDistance * vy;
                    iz = pz + rayEntryDistance * vz;
                    if (iy > -halfExtentsY && iy < halfExtentsY && iz > -halfExtentsZ && iz < halfExtentsZ)
                    {
                        targetNormal.x = -1;
                        targetNormal.y = 0;
                        targetNormal.z = 0;
                        intersects = true;
                    }
                }
            }
            if (!intersects && vy < 0)
            {
                rayEntryDistance = (halfExtentsY - py) / vy;
                if (rayEntryDistance > 0)
                {
                    ix = px + rayEntryDistance * vx;
                    iz = pz + rayEntryDistance * vz;
                    if (ix > -halfExtentsX && ix < halfExtentsX && iz > -halfExtentsZ && iz < halfExtentsZ)
                    {
                        targetNormal.x = 0;
                        targetNormal.y = 1;
                        targetNormal.z = 0;
                        intersects = true;
                    }
                }
            }
            if (!intersects && vy > 0)
            {
                rayEntryDistance = (-halfExtentsY - py) / vy;
                if (rayEntryDistance > 0)
                {
                    ix = px + rayEntryDistance * vx;
                    iz = pz + rayEntryDistance * vz;
                    if (ix > -halfExtentsX && ix < halfExtentsX && iz > -halfExtentsZ && iz < halfExtentsZ)
                    {
                        targetNormal.x = 0;
                        targetNormal.y = -1;
                        targetNormal.z = 0;
                        intersects = true;
                    }
                }
            }
            if (!intersects && vz < 0)
            {
                rayEntryDistance = (halfExtentsZ - pz) / vz;
                if (rayEntryDistance > 0)
                {
                    ix = px + rayEntryDistance * vx;
                    iy = py + rayEntryDistance * vy;
                    if (iy > -halfExtentsY && iy < halfExtentsY && ix > -halfExtentsX && ix < halfExtentsX)
                    {
                        targetNormal.x = 0;
                        targetNormal.y = 0;
                        targetNormal.z = 1;
                        intersects = true;
                    }
                }
            }
            if (!intersects && vz > 0)
            {
                rayEntryDistance = (-halfExtentsZ - pz) / vz;
                if (rayEntryDistance > 0)
                {
                    ix = px + rayEntryDistance * vx;
                    iy = py + rayEntryDistance * vy;
                    if (iy > -halfExtentsY && iy < halfExtentsY && ix > -halfExtentsX && ix < halfExtentsX)
                    {
                        targetNormal.x = 0;
                        targetNormal.y = 0;
                        targetNormal.z = -1;
                        intersects = true;
                    }
                }
            }

            return intersects ? rayEntryDistance : -1;
        }

        /**
         * Finds the closest point on the Box to another given point. This can be used for maximum error calculations for content within a given Box.
         *
         * @param point The point for which to find the closest point on the Box
         * @param target An optional Vector3 to store the result to prevent creating a new object.
         * @return
         */
        closestPointToPoint(point: Vector3, target?: Vector3): Vector3
        {
            var p;

            if (target == null)
                target = new Vector3();

            p = point.x;
            if (p < this.min.x)
                p = this.min.x;
            if (p > this.max.x)
                p = this.max.x;
            target.x = p;

            p = point.y;
            if (p < this.max.y)
                p = this.max.y;
            if (p > this.min.y)
                p = this.min.y;
            target.y = p;

            p = point.z;
            if (p < this.min.z)
                p = this.min.z;
            if (p > this.max.z)
                p = this.max.z;
            target.z = p;

            return target;
        }

        /**
         * 清空盒子
         */
        empty()
        {
            this.min.x = this.min.y = this.min.z = + Infinity;
            this.max.x = this.max.y = this.max.z = - Infinity;
            return this;
        }

        /**
         * 是否为空
         * 当体积为0时为空
         */
        isEmpty()
        {
            return (this.max.x <= this.min.x) || (this.max.y <= this.min.y) || (this.max.z <= this.min.z);
        }

        /**
         * 偏移
         * @param dx x轴偏移
         * @param dy y轴偏移
         * @param dz z轴偏移
         */
        offset(dx: number, dy: number, dz: number)
        {
            return this.offsetPosition(new Vector3(dx, dy, dz));
        }

        /**
         * 偏移
         * @param position 偏移量
         */
        offsetPosition(position: Vector3)
        {
            this.min.add(position);
            this.max.add(position);
            return this;
        }

        toString(): string
        {
            return "[Box] (min=" + this.min.toString() + ", max=" + this.max.toString() + ")";
        }

        /**
         * 联合盒子
         * @param box 盒子
         */
        union(box: Box): Box
        {
            this.min.min(box.min);
            this.max.max(box.max);
            return this;
        }

        /**
         * 是否与球相交
         * @param sphere 球
         */
        intersectsSphere(sphere: Sphere)
        {
            var closestPoint = new Vector3();
            // Find the point on the AABB closest to the sphere center.
            this.clampPoint(sphere.center, closestPoint);

            // If that point is inside the sphere, the AABB and sphere intersect.
            return closestPoint.distanceSquared(sphere.center) <= (sphere.radius * sphere.radius);
        }

        /**
         * 
         * @param point 点
         * @param pout 输出点
         */
        clampPoint(point: Vector3, pout = new Vector3())
        {
            return pout.copy(point).clamp(this.min, this.max);
        }

        /**
         * 是否与平面相交
         * @param plane 平面
         */
        intersectsPlane(plane: Plane3D)
        {
            var min = Infinity;
            var max = -Infinity;
            this.toPoints().forEach(p =>
            {
                var d = plane.distanceWithPoint(p);
                min = d < min ? d : min;
                max = d > min ? d : min;
            });
            return min < 0 && max > 0;
        }

        /**
         * 是否与三角形相交
         * @param triangle 三角形 
         */
        intersectsTriangle(triangle: Triangle3D)
        {
            if (this.isEmpty())
            {
                return false;
            }
            // compute box center and extents
            var center = this.getCenter();
            var extents = this.max.subTo(center);

            // translate triangle to aabb origin
            var v0 = triangle.p0.subTo(center);
            var v1 = triangle.p1.subTo(center);
            var v2 = triangle.p2.subTo(center);

            // compute edge vectors for triangle
            var f0 = v1.subTo(v0);
            var f1 = v2.subTo(v1);
            var f2 = v0.subTo(v2);

            // test against axes that are given by cross product combinations of the edges of the triangle and the edges of the aabb
            // make an axis testing of each of the 3 sides of the aabb against each of the 3 sides of the triangle = 9 axis of separation
            // axis_ij = u_i x f_j (u0, u1, u2 = face normals of aabb = x,y,z axes vectors since aabb is axis aligned)
            var axes = [
                0, - f0.z, f0.y, 0, - f1.z, f1.y, 0, - f2.z, f2.y,
                f0.z, 0, - f0.x, f1.z, 0, - f1.x, f2.z, 0, - f2.x,
                - f0.y, f0.x, 0, - f1.y, f1.x, 0, - f2.y, f2.x, 0
            ];
            if (!satForAxes(axes))
            {
                return false;
            }

            // test 3 face normals from the aabb
            axes = [1, 0, 0, 0, 1, 0, 0, 0, 1];
            if (!satForAxes(axes))
            {
                return false;
            }
            // finally testing the face normal of the triangle
            // use already existing triangle edge vectors here
            var triangleNormal = f0.crossTo(f1);
            axes = [triangleNormal.x, triangleNormal.y, triangleNormal.z];
            return satForAxes(axes);

            function satForAxes(axes: number[])
            {
                var i, j;
                for (i = 0, j = axes.length - 3; i <= j; i += 3)
                {
                    var testAxis = Vector3.fromArray(axes, i);
                    // project the aabb onto the seperating axis
                    var r = extents.x * Math.abs(testAxis.x) + extents.y * Math.abs(testAxis.y) + extents.z * Math.abs(testAxis.z);
                    // project all 3 vertices of the triangle onto the seperating axis
                    var p0 = v0.dot(testAxis);
                    var p1 = v1.dot(testAxis);
                    var p2 = v2.dot(testAxis);
                    // actual test, basically see if either of the most extreme of the triangle points intersects r
                    if (Math.max(- Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r)
                    {

                        // points of the projected triangle are outside the projected half-length of the aabb
                        // the axis is seperating and we can exit
                        return false;
                    }
                }
                return true;
            }
        }

        /**
         * 转换为三角形列表
         */
        toTriangles(triangles: Triangle3D[] = [])
        {
            var min = this.min;
            var max = this.max;
            triangles.push(
                // 前
                Triangle3D.fromPoints(new Vector3(min.x, min.y, min.z), new Vector3(min.x, max.y, min.z), new Vector3(max.x, max.y, min.z)),
                Triangle3D.fromPoints(new Vector3(min.x, min.y, min.z), new Vector3(max.x, max.y, min.z), new Vector3(max.x, min.y, min.z)),
                // 后
                Triangle3D.fromPoints(new Vector3(min.x, min.y, max.z), new Vector3(max.x, min.y, max.z), new Vector3(min.x, max.y, max.z)),
                Triangle3D.fromPoints(new Vector3(max.x, min.y, max.z), new Vector3(max.x, max.y, max.z), new Vector3(min.x, max.y, max.z)),
                // 右
                Triangle3D.fromPoints(new Vector3(max.x, min.y, min.z), new Vector3(max.x, max.y, min.z), new Vector3(max.x, max.y, max.z)),
                Triangle3D.fromPoints(new Vector3(max.x, min.y, min.z), new Vector3(max.x, max.y, max.z), new Vector3(max.x, min.y, max.z)),
                // 左
                Triangle3D.fromPoints(new Vector3(min.x, min.y, max.z), new Vector3(min.x, max.y, min.z), new Vector3(min.x, min.y, min.z)),
                Triangle3D.fromPoints(new Vector3(min.x, min.y, max.z), new Vector3(min.x, max.y, max.z), new Vector3(min.x, max.y, min.z)),
                // 上
                Triangle3D.fromPoints(new Vector3(min.x, max.y, min.z), new Vector3(max.x, max.y, max.z), new Vector3(max.x, max.y, min.z)),
                Triangle3D.fromPoints(new Vector3(min.x, max.y, min.z), new Vector3(min.x, max.y, max.z), new Vector3(max.x, max.y, max.z)),
                // 下
                Triangle3D.fromPoints(new Vector3(min.x, min.y, min.z), new Vector3(max.x, min.y, min.z), new Vector3(min.x, min.y, max.z)),
                Triangle3D.fromPoints(new Vector3(max.x, min.y, min.z), new Vector3(max.x, min.y, max.z), new Vector3(min.x, min.y, max.z)),
            );
            return triangles;
        }
    }
}