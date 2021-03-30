namespace feng3d
{
    /**
     * 轴向对称包围盒
     */
    export class Box3
    {
        /**
         * 从一组顶点初始化包围盒
         * @param positions 坐标数据列表
         */
        static formPositions(positions: number[])
        {
            return new Box3().formPositions(positions);
        }

        /**
         * 从一组点初始化包围盒
         * @param ps 点列表
         */
        static fromPoints(ps: Vector3[])
        {
            return new Box3().fromPoints(ps);
        }

        /**
         * 随机包围盒
         */
        static random()
        {
            var min = Vector3.random();
            var max = Vector3.random().add(min);
            return new Box3(min, max);
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
            if (this.isEmpty)
            {
                return null;
            }
            return vout.copy(this.min).add(this.max).scaleNumber(0.5);
        }

        /**
         * 尺寸
         */
        getSize(vout = new Vector3())
        {
            return this.isEmpty() ? vout.set(0, 0, 0) : this.max.subTo(this.min, vout);
        }

        /**
         * 创建包围盒
         * @param min 最小点
         * @param max 最大点
         */
        constructor(min = new Vector3(+ Infinity, + Infinity, + Infinity), max = new Vector3(- Infinity, - Infinity, - Infinity))
        {
            this.min = min;
            this.max = max;
        }

        /**
         * 初始化包围盒
         * @param min 最小值
         * @param max 最大值
         */
        init(min: Vector3, max: Vector3)
        {
            this.min = min;
            this.max = max;
            return this;
        }

        /**
         * 缩放包围盒
         * 
         * @param s 缩放系数
         */
        scale(s: Vector3)
        {
            this.min.scale(s);
            this.max.scale(s);
            return this;
        }

        /**
         * 转换为包围盒八个角所在点列表
         */
        toPoints(points?: Vector3[])
        {
            if (!points)
            {
                points = [
                    new Vector3(),
                    new Vector3(),
                    new Vector3(),
                    new Vector3(),
                    new Vector3(),
                    new Vector3(),
                    new Vector3(),
                    new Vector3(),
                ];
            }

            var min = this.min;
            var max = this.max;
            points[0].set(min.x, min.y, min.z);
            points[1].set(max.x, min.y, min.z);
            points[2].set(min.x, max.y, min.z);
            points[3].set(min.x, min.y, max.z);
            points[4].set(min.x, max.y, max.z);
            points[5].set(max.x, min.y, max.z);
            points[6].set(max.x, max.y, min.z);
            points[7].set(max.x, max.y, max.z);

            return points;
        }

        /**
         * 从一组顶点初始化包围盒
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

            this.min.set(minX, minY, minZ);
            this.max.set(maxX, maxY, maxZ);
            return this;
        }

        /**
         * 从一组点初始化包围盒
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
         * 包围盒内随机点
         */
        randomPoint(pout = new Vector3())
        {
            return pout.copy(this.min).lerp(this.max, Vector3.random());
        }

        /**
         * 使用点扩张包围盒
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
         * 
         * @todo 优化
         * @see 3D数学基础：图形与游戏开发 P288 AABB::setToTransformedBox
         */
        applyMatrix(mat: Matrix4x4)
        {
            if (this.isEmpty()) return this;

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
        applyMatrixTo(mat: Matrix4x4, out = new Box3())
        {
            return out.copy(this).applyMatrix(mat);
        }

        /**
         * 
         */
        clone(): Box3
        {
            return new Box3(this.min.clone(), this.max.clone());
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
         * 是否包含包围盒
         * @param aabb 包围盒
         */
        contains(aabb: Box3)
        {
            return this.min.lessequal(aabb.min) && this.max.greaterequal(aabb.max);
        }

        /**
         * 拷贝
         * @param aabb 包围盒
         */
        copy(aabb: Box3)
        {
            this.min.copy(aabb.min);
            this.max.copy(aabb.max);
            return this;
        }

        /**
         * 比较包围盒是否相等
         * @param aabb 包围盒
         */
        equals(aabb: Box3)
        {
            return this.min.equals(aabb.min) && this.max.equals(aabb.max);
        }

        /**
         * 平移
         * 
         * @param offset 偏移量
         */
        translate(offset: Vector3)
        {
            this.min.add(offset);
            this.max.add(offset);
            return this;
        }

        /**
         * 膨胀包围盒
         * @param dx x方向膨胀量 
         * @param dy y方向膨胀量
         * @param dz z方向膨胀量
         */
        inflate(dx: number, dy: number, dz: number)
        {
            this.min.x -= dx / 2;
            this.min.y -= dy / 2;
            this.min.z -= dz / 2;
            this.max.x += dx / 2;
            this.max.y += dy / 2;
            this.max.z += dz / 2;
        }

        /**
         * 膨胀包围盒
         * @param delta 膨胀量
         */
        inflatePoint(delta: Vector3)
        {
            delta = delta.scaleNumberTo(0.5);
            this.min.sub(delta);
            this.max.add(delta);
        }

        /**
         * 与包围盒相交
         * @param aabb 包围盒
         */
        intersection(aabb: Box3)
        {
            var min = this.min.clampTo(aabb.min, aabb.max);
            var max = this.max.clampTo(aabb.min, aabb.max);
            if (this.containsPoint(min))
            {
                this.min.copy(min);
                this.max.copy(max);
                return this;
            }
            return null;
        }

        /**
         * 与包围盒相交
         * @param aabb 包围盒
         */
        intersectionTo(aabb: Box3, out = new Box3())
        {
            return out.copy(this).intersection(aabb);
        }

        /**
         * 包围盒是否相交
         * @param aabb 包围盒
         */
        intersects(aabb: Box3)
        {
            var b = this.intersectionTo(aabb);
            var c = b.getCenter();
            return this.containsPoint(c) && aabb.containsPoint(c);
        }

        /**
         * 与射线相交
         * @param position 射线起点
         * @param direction 射线方向
         * @param outTargetNormal 相交处法线
         * @return 起点到包围盒距离
         * 
         * @todo 可用以下方法优化？
         * @see 3D数学基础：图形与游戏开发 P290
         */
        rayIntersection(position: Vector3, direction: Vector3, outTargetNormal?: Vector3)
        {
            if (this.isEmpty())
                return Number.MAX_VALUE;
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

            var ix: number;
            var iy: number;
            var iz: number;
            var rayEntryDistance = Number.MAX_VALUE;

            // 射线与平面相交测试
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
                        if (outTargetNormal)
                        {
                            outTargetNormal.x = 1;
                            outTargetNormal.y = 0;
                            outTargetNormal.z = 0;
                        }

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
                        if (outTargetNormal)
                        {
                            outTargetNormal.x = -1;
                            outTargetNormal.y = 0;
                            outTargetNormal.z = 0;
                        }
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
                        if (outTargetNormal)
                        {
                            outTargetNormal.x = 0;
                            outTargetNormal.y = 1;
                            outTargetNormal.z = 0;
                        }
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
                        if (outTargetNormal)
                        {
                            outTargetNormal.x = 0;
                            outTargetNormal.y = -1;
                            outTargetNormal.z = 0;
                        }
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
                        if (outTargetNormal)
                        {
                            outTargetNormal.x = 0;
                            outTargetNormal.y = 0;
                            outTargetNormal.z = 1;
                        }
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
                        if (outTargetNormal)
                        {
                            outTargetNormal.x = 0;
                            outTargetNormal.y = 0;
                            outTargetNormal.z = -1;
                        }
                        intersects = true;
                    }
                }
            }

            return intersects ? rayEntryDistance : Number.MAX_VALUE;
        }

        /**
         * 获取包围盒上距离指定点最近的点
         *
         * @param point 指定点
         * @param target 存储最近的点
         */
        closestPointToPoint(point: Vector3, target = new Vector3())
        {
            return this.clampPoint(point, target);
        }

        /**
         * 清空包围盒
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
            return (this.max.x < this.min.x) || (this.max.y < this.min.y) || (this.max.z < this.min.z);
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
            return "[AABB] (min=" + this.min.toString() + ", max=" + this.max.toString() + ")";
        }

        /**
         * 联合包围盒
         * @param aabb 包围盒
         */
        union(aabb: Box3)
        {
            this.min.min(aabb.min);
            this.max.max(aabb.max);
            return this;
        }

        /**
         * 是否与球相交
         * @param sphere 球
         */
        intersectsSphere(sphere: Sphere)
        {
            var closestPoint = new Vector3();
            this.clampPoint(sphere.center, closestPoint);
            return closestPoint.distanceSquared(sphere.center) <= (sphere.radius * sphere.radius);
        }

        /**
         * 夹紧？
         * 
         * @param point 点
         * @param out 输出点
         */
        clampPoint(point: Vector3, out = new Vector3())
        {
            return out.copy(point).clamp(this.min, this.max);
        }

        /**
         * 是否与平面相交
         * @param plane 平面
         */
        intersectsPlane(plane: Plane)
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
        intersectsTriangle(triangle: Triangle3)
        {
            if (this.isEmpty())
            {
                return false;
            }
            // 计算包围盒中心和区段
            var center = this.getCenter();
            var extents = this.max.subTo(center);

            // 把三角形顶点转换包围盒空间
            var v0 = triangle.p0.subTo(center);
            var v1 = triangle.p1.subTo(center);
            var v2 = triangle.p2.subTo(center);

            // 计算三边向量
            var f0 = v1.subTo(v0);
            var f1 = v2.subTo(v1);
            var f2 = v0.subTo(v2);

            // 测试三边向量分别所在三个轴面上的法线
            var axes = [
                0, - f0.z, f0.y, 0, - f1.z, f1.y, 0, - f2.z, f2.y,
                f0.z, 0, - f0.x, f1.z, 0, - f1.x, f2.z, 0, - f2.x,
                - f0.y, f0.x, 0, - f1.y, f1.x, 0, - f2.y, f2.x, 0
            ];
            if (!satForAxes(axes, v0, v1, v2, extents))
            {
                return false;
            }

            // 测试三个面法线
            axes = [1, 0, 0, 0, 1, 0, 0, 0, 1];
            if (!satForAxes(axes, v0, v1, v2, extents))
            {
                return false;
            }
            // 检测三角形面法线
            var triangleNormal = f0.crossTo(f1);
            axes = [triangleNormal.x, triangleNormal.y, triangleNormal.z];
            return satForAxes(axes, v0, v1, v2, extents);
        }

        /**
        * 是否与指定长方体相交
        * 
        * @param box3 长方体
        */
        overlaps(box3: Box3)
        {
            var l1 = this.min,
                u1 = this.max,
                l2 = box3.min,
                u2 = box3.max;

            //      l2        u2
            //      |---------|
            // |--------|
            // l1       u1

            var overlapsX = ((l2.x <= u1.x && u1.x <= u2.x) || (l1.x <= u2.x && u2.x <= u1.x));
            var overlapsY = ((l2.y <= u1.y && u1.y <= u2.y) || (l1.y <= u2.y && u2.y <= u1.y));
            var overlapsZ = ((l2.z <= u1.z && u1.z <= u2.z) || (l1.z <= u2.z && u2.z <= u1.z));

            return overlapsX && overlapsY && overlapsZ;
        }

        /**
         * 转换为三角形列表
         */
        toTriangles(triangles: Triangle3[] = [])
        {
            var min = this.min;
            var max = this.max;
            triangles.push(
                // 前
                Triangle3.fromPoints(new Vector3(min.x, min.y, min.z), new Vector3(min.x, max.y, min.z), new Vector3(max.x, max.y, min.z)),
                Triangle3.fromPoints(new Vector3(min.x, min.y, min.z), new Vector3(max.x, max.y, min.z), new Vector3(max.x, min.y, min.z)),
                // 后
                Triangle3.fromPoints(new Vector3(min.x, min.y, max.z), new Vector3(max.x, min.y, max.z), new Vector3(min.x, max.y, max.z)),
                Triangle3.fromPoints(new Vector3(max.x, min.y, max.z), new Vector3(max.x, max.y, max.z), new Vector3(min.x, max.y, max.z)),
                // 右
                Triangle3.fromPoints(new Vector3(max.x, min.y, min.z), new Vector3(max.x, max.y, min.z), new Vector3(max.x, max.y, max.z)),
                Triangle3.fromPoints(new Vector3(max.x, min.y, min.z), new Vector3(max.x, max.y, max.z), new Vector3(max.x, min.y, max.z)),
                // 左
                Triangle3.fromPoints(new Vector3(min.x, min.y, max.z), new Vector3(min.x, max.y, min.z), new Vector3(min.x, min.y, min.z)),
                Triangle3.fromPoints(new Vector3(min.x, min.y, max.z), new Vector3(min.x, max.y, max.z), new Vector3(min.x, max.y, min.z)),
                // 上
                Triangle3.fromPoints(new Vector3(min.x, max.y, min.z), new Vector3(max.x, max.y, max.z), new Vector3(max.x, max.y, min.z)),
                Triangle3.fromPoints(new Vector3(min.x, max.y, min.z), new Vector3(min.x, max.y, max.z), new Vector3(max.x, max.y, max.z)),
                // 下
                Triangle3.fromPoints(new Vector3(min.x, min.y, min.z), new Vector3(max.x, min.y, min.z), new Vector3(min.x, min.y, max.z)),
                Triangle3.fromPoints(new Vector3(max.x, min.y, min.z), new Vector3(max.x, min.y, max.z), new Vector3(min.x, min.y, max.z)),
            );
            return triangles;
        }
    }

    /**
     * 判断三角形三个点是否可能与包围盒在指定轴（列表）上投影相交
     * 
     * @param axes 
     * @param v0 
     * @param v1 
     * @param v2 
     * @param extents 
     */
    function satForAxes(axes: number[], v0: Vector3, v1: Vector3, v2: Vector3, extents: Vector3)
    {
        for (var i = 0, j = axes.length - 3; i <= j; i += 3)
        {
            var testAxis = Vector3.fromArray(axes, i);
            // 投影包围盒到指定轴的长度
            var r = extents.x * Math.abs(testAxis.x) + extents.y * Math.abs(testAxis.y) + extents.z * Math.abs(testAxis.z);
            // 投影三角形的三个点到指定轴
            var p0 = v0.dot(testAxis);
            var p1 = v1.dot(testAxis);
            var p2 = v2.dot(testAxis);
            // 三个点在包围盒投影外同侧
            if (Math.min(p0, p1, p2) > r || Math.max(p0, p1, p2) < -r)
            {
                return false;
            }
        }
        return true;
    }

}
