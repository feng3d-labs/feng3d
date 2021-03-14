namespace feng3d
{
    /**
     * 三角形
     */
    export class Triangle3
    {
        /**
         * 通过3顶点定义一个三角形
         * @param p0		点0
         * @param p1		点1
         * @param p2		点2
         */
        static fromPoints(p0: Vector3, p1: Vector3, p2: Vector3)
        {
            return new Triangle3().fromPoints(p0, p1, p2);
        }

        /**
         * 从顶点数据初始化三角形
         * @param positions 顶点数据
         */
        static fromPositions(positions: number[])
        {
            return new Triangle3().fromPositions(positions);
        }

        /**
         * 随机三角形
         * @param size 尺寸
         */
        static random(size = 1)
        {
            return new Triangle3(Vector3.random(size), Vector3.random(size), Vector3.random(size));
        }

        /**
         * 三角形0号点
         */
        p0: Vector3;
        /**
         * 三角形1号点
         */
        p1: Vector3;
        /**
         * 三角形2号点
         */
        p2: Vector3;

        /**
         * 构造三角形
         * 
         * @param p0 三角形0号点
         * @param p1 三角形1号点
         * @param p2 三角形2号点
         */
        constructor(p0 = new Vector3(), p1 = new Vector3(), p2 = new Vector3())
        {
            this.p0 = p0;
            this.p1 = p1;
            this.p2 = p2;
        }

        /**
         * 三角形三个点
         */
        getPoints()
        {
            return [this.p0, this.p1, this.p2];
        }

        /**
         * 三边
         */
        getSegments()
        {
            return [Segment3.fromPoints(this.p0, this.p1), Segment3.fromPoints(this.p1, this.p2), Segment3.fromPoints(this.p2, this.p0)];
        }

        /**
         * 三角形所在平面
         */
        getPlane3d(pout = new Plane())
        {
            return pout.fromPoints(this.p0, this.p1, this.p2);
        }

        /**
         * 获取法线
         */
        getNormal(vout = new Vector3())
        {
            return vout.copy(this.p1).sub(this.p0).cross(this.p2.subTo(this.p1)).normalize();
        }

        /**
         * 重心,三条中线相交的点叫做重心。
         */
        getBarycenter(pout = new Vector3())
        {
            return pout.copy(this.p0).add(this.p1).add(this.p2).scaleNumber(1 / 3);
        }

        /**
         * 外心，外切圆心,三角形三边的垂直平分线的交点，称为三角形外心。
         * @see https://baike.baidu.com/item/%E4%B8%89%E8%A7%92%E5%BD%A2%E4%BA%94%E5%BF%83/218867
         */
        getCircumcenter(pout = new Vector3())
        {
            var a = this.p2.subTo(this.p1);
            var b = this.p0.subTo(this.p2);
            var c = this.p1.subTo(this.p0);
            var d = 2 * c.crossTo(a).lengthSquared;
            var a0 = -a.dot(a) * c.dot(b) / d;
            var b0 = -b.dot(b) * c.dot(a) / d;
            var c0 = -c.dot(c) * b.dot(a) / d;
            return pout.copy(this.p0).scaleNumber(a0).add(this.p1.scaleNumberTo(b0)).add(this.p2.scaleNumberTo(c0));
        }

        /**
         * 内心，内切圆心,三角形内心为三角形三条内角平分线的交点。
         * @see https://baike.baidu.com/item/%E4%B8%89%E8%A7%92%E5%BD%A2%E4%BA%94%E5%BF%83/218867
         */
        getInnercenter(pout = new Vector3())
        {
            var a = this.p2.subTo(this.p1).length;
            var b = this.p0.subTo(this.p2).length;
            var c = this.p1.subTo(this.p0).length;
            return pout.copy(this.p0).scaleNumber(a).add(this.p1.scaleNumberTo(b)).add(this.p2.scaleNumberTo(c)).scaleNumber(1 / (a + b + c));
        }

        /**
         * 垂心，三角形三边上的三条高或其延长线交于一点，称为三角形垂心。
         * @see https://baike.baidu.com/item/%E4%B8%89%E8%A7%92%E5%BD%A2%E4%BA%94%E5%BF%83/218867
         */
        getOrthocenter(pout = new Vector3())
        {
            var a = this.p2.subTo(this.p1);
            var b = this.p0.subTo(this.p2);
            var c = this.p1.subTo(this.p0);
            var a0 = a.dot(b) * a.dot(c);
            var b0 = b.dot(c) * b.dot(a);
            var c0 = c.dot(a) * c.dot(b);
            return pout.copy(this.p0).scaleNumber(a0).add(this.p1.scaleNumberTo(b0)).add(this.p2.scaleNumberTo(c0)).scaleNumber(1 / (a0 + b0 + c0));
        }

        /**
         * 通过3顶点定义一个三角形
         * @param p0		点0
         * @param p1		点1
         * @param p2		点2
         */
        fromPoints(p0: Vector3, p1: Vector3, p2: Vector3)
        {
            this.p0 = p0;
            this.p1 = p1;
            this.p2 = p2;
            return this;
        }

        /**
         * 从顶点数据初始化三角形
         * @param positions 顶点数据
         */
        fromPositions(positions: number[])
        {
            this.p0.set(positions[0], positions[1], positions[2]);
            this.p1.set(positions[3], positions[4], positions[5]);
            this.p2.set(positions[6], positions[7], positions[8]);
            return this;
        }

        /**
         * 获取三角形内的点
         * @param p 三点的权重（重心坐标系坐标）
         * @param pout 输出点
         */
        getPoint(p: Vector3, pout = new Vector3())
        {
            return pout.copy(this.p0).scaleNumber(p.x).add(this.p1.scaleNumberTo(p.y)).add(this.p2.scaleNumberTo(p.z));
        }

        /**
         * 获取三角形内随机点
         * @param pout 输出点
         */
        randomPoint(pout = new Vector3())
        {
            var a = Math.random();
            var b = Math.random() * (1 - a);
            var c = 1 - a - b;
            return this.getPoint(new Vector3(a, b, c), pout);
        }

        /**
         * 获取与直线相交，当直线与三角形不相交时返回null
         */
        intersectionWithLine(line: Line3)
        {
            var plane3d = this.getPlane3d();
            var cross = plane3d.intersectWithLine3(line);
            if (!cross)
                return null;
            if (cross instanceof Vector3)
            {
                if (this.onWithPoint(cross))
                    return cross;
                return null;
            }

            // 直线分别于三边相交
            var crossSegment: Segment3 = <any>null;
            var ps = this.getSegments().reduce((v: Vector3[], segment) =>
            {
                var r = segment.intersectionWithLine(line);
                if (!r)
                    return v;
                if (r instanceof Segment3)
                {
                    crossSegment = r;
                    return v;
                }
                v.push(r);
                return v;
            }, []);
            if (crossSegment)
                return crossSegment;
            if (ps.length == 0)
                return null;
            if (ps.length == 1)
                return ps[0];
            if (ps[0].equals(ps[1]))
            {
                return ps[0];
            }
            return Segment3.fromPoints(ps[0], ps[1]);
        }

        /**
         * 获取与线段相交
         */
        intersectionWithSegment(segment: Segment3)
        {
            var r = this.intersectionWithLine(segment.getLine());
            if (!r) return null;
            if (r instanceof Vector3)
            {
                if (segment.onWithPoint(r))
                    return r;
                return null;
            }
            var p0 = segment.clampPoint(r.p0);
            var p1 = segment.clampPoint(r.p1);
            if (!r.onWithPoint(p0))
                return null;
            if (p0.equals(p1))
                return p0;
            return Segment3.fromPoints(p0, p1);
        }

        /**
         * 判定点是否在三角形上
         * @param p 点
         * @param precision 精度，如果距离小于精度则判定为在三角形上
         */
        onWithPoint(p: Vector3, precision = Math.PRECISION)
        {
            var p0 = this.p0;
            var p1 = this.p1;
            var p2 = this.p2;

            // 判断点是否在平面上
            var dot = p0.subTo(p1).cross(p1.subTo(p2)).dot(p.subTo(p0));
            if (!Math.equals(dot, 0, precision))
                return false;

            // 求点的重心坐标系坐标
            var bp = this.getBarycentricCoordinates(p);

            // 当重心坐标系坐标任意分量小于0表示点在三角形外
            precision = -precision;
            if (bp.x < precision || bp.y < precision || bp.z < precision)
                return false;
            return true;
        }

        /**
         * 求给出点的重心坐标系坐标
         * 
         * @param p 点
         * @param bp 用于接收重心坐标系坐标
         * 
         * @returns 重心坐标系坐标
         * 
         * @see 3D数学基础：图形与游戏开发 P252 P249
         */
        getBarycentricCoordinates(p: Vector3, bp = new Vector3())
        {
            var p0x = this.p0.x;
            var p0y = this.p0.y;
            var p0z = this.p0.z;
            var p1x = this.p1.x;
            var p1y = this.p1.y;
            var p1z = this.p1.z;
            var p2x = this.p2.x;
            var p2y = this.p2.y;
            var p2z = this.p2.z;

            var d1x = p1x - p0x;
            var d1y = p1y - p0y;
            var d1z = p1z - p0z;
            var d2x = p2x - p1x;
            var d2y = p2y - p1y;
            var d2z = p2z - p1z;

            var nx = d1y * d2z - d1z * d2y;
            var ny = d1z * d2x - d1x * d2z;
            var nz = d1x * d2y - d1y * d2x


            var u1: number, u2: number, u3: number, u4: number;
            var v1: number, v2: number, v3: number, v4: number;
            if ((Math.abs(nx) >= Math.abs(ny)) && (Math.abs(nx) >= Math.abs(nz)))
            {
                u1 = p0y - p2y;
                u2 = p1y - p2y;
                u3 = p.y - p0y;
                u4 = p.y - p2y;
                v1 = p0z - p2z;
                v2 = p1z - p2z;
                v3 = p.z - p0z;
                v4 = p.z - p2z;
            } else if (Math.abs(ny) >= Math.abs(nz))
            {
                u1 = p0z - p2z;
                u2 = p1z - p2z;
                u3 = p.z - p0z;
                u4 = p.z - p2z;
                v1 = p0x - p2x;
                v2 = p1x - p2x;
                v3 = p.x - p0x;
                v4 = p.x - p2x;
            } else
            {
                u1 = p0x - p2x;
                u2 = p1x - p2x;
                u3 = p.x - p0x;
                u4 = p.x - p2x;
                v1 = p0y - p2y;
                v2 = p1y - p2y;
                v3 = p.y - p0y;
                v4 = p.y - p2y;
            }
            var denom = v1 * u2 - v2 * u1;
            // if (Math.equals(denom, 0))
            // {
            //     return null;
            // }
            var oneOverDenom = 1 / denom;
            bp.x = (v4 * u2 - v2 * u4) * oneOverDenom;
            bp.y = (v1 * u3 - v3 * u1) * oneOverDenom;
            bp.z = 1 - bp.x - bp.y;
            return bp;
        }

        /**
         * 获取指定点分别占三个点的混合值
         */
        blendWithPoint(p: Vector3)
        {
            var n = this.p1.subTo(this.p0).crossTo(this.p2.subTo(this.p1));
            var area = n.length;
            n.normalize();
            //
            var n0 = this.p1.subTo(p).crossTo(this.p2.subTo(this.p1));
            var area0 = n0.length;
            n0.normalize();
            var b0 = area0 / area * n.dot(n0);
            //
            var n1 = this.p2.subTo(p).crossTo(this.p0.subTo(this.p2));
            var area1 = n1.length;
            n1.normalize();
            var b1 = area1 / area * n.dot(n1);
            //
            var n2 = this.p0.subTo(p).crossTo(this.p1.subTo(this.p0));
            var area2 = n2.length;
            n2.normalize();
            var b2 = area2 / area * n.dot(n2);
            return new Vector3(b0, b1, b2);
        }

        /**
         * 是否与盒子相交
         */
        intersectsBox(box: Box3)
        {
            return box.intersectsTriangle(this);
        }

        /**
         * 与指定点最近的点
         * @param point 点
         * @param vout 输出点
         */
        closestPointWithPoint(point: Vector3, vout = new Vector3())
        {
            this.getPlane3d().closestPointWithPoint(point, vout);
            if (this.onWithPoint(vout))
                return vout;
            var p = this.getSegments().map((s) => { var p = s.closestPointWithPoint(point); return { point: p, d: point.distanceSquared(p) } }).sort((a, b) => { return a.d - b.d; })[0].point;
            return vout.copy(p);
        }

        /**
         * 与点最近距离
         * @param point 点
         */
        distanceWithPoint(point: Vector3)
        {
            return this.closestPointWithPoint(point).distance(point);
        }

        /**
         * 与点最近距离平方
         * @param point 点
         */
        distanceSquaredWithPoint(point: Vector3)
        {
            return this.closestPointWithPoint(point).distanceSquared(point);
        }

        /**
         * 用点分解（切割）三角形
         */
        decomposeWithPoint(p: Vector3)
        {
            if (!this.onWithPoint(p))
                return [this];
            if (this.p0.equals(p) || this.p1.equals(p) || this.p2.equals(p))
                return [this];
            if (Segment3.fromPoints(this.p0, this.p1).onWithPoint(p))
                return [Triangle3.fromPoints(this.p0, p, this.p2), Triangle3.fromPoints(p, this.p1, this.p2)];
            if (Segment3.fromPoints(this.p1, this.p2).onWithPoint(p))
                return [Triangle3.fromPoints(this.p1, p, this.p0), Triangle3.fromPoints(p, this.p2, this.p0)];
            if (Segment3.fromPoints(this.p2, this.p0).onWithPoint(p))
                return [Triangle3.fromPoints(this.p2, p, this.p1), Triangle3.fromPoints(p, this.p0, this.p1)];
            return [Triangle3.fromPoints(p, this.p0, this.p1), Triangle3.fromPoints(p, this.p1, this.p2), Triangle3.fromPoints(p, this.p2, this.p0)];
        }

        /**
         * 用点分解（切割）三角形
         */
        decomposeWithPoints(ps: Vector3[])
        {
            // 遍历顶点分割三角形
            var ts = ps.reduce((v: Triangle3[], p) =>
            {
                // 使用点分割所有三角形
                v = v.reduce((v0: Triangle3[], t) =>
                {
                    return v0.concat(t.decomposeWithPoint(p));
                }, []);
                return v;
            }, [this]);
            return ts;
        }

        /**
         * 用线段分解（切割）三角形
         * @param segment 线段
         */
        decomposeWithSegment(segment: Segment3)
        {
            var r = this.intersectionWithSegment(segment);
            if (!r) return [this];
            if (r instanceof Vector3)
            {
                return this.decomposeWithPoint(r);
            }
            var ts = this.decomposeWithPoints([r.p0, r.p1]);
            return ts;
        }

        /**
         * 用直线分解（切割）三角形
         * @param line 直线
         */
        decomposeWithLine(line: Line3)
        {
            var r = this.intersectionWithLine(line);
            if (!r) return [this];
            if (r instanceof Vector3)
            {
                return this.decomposeWithPoint(r);
            }
            var ts = this.decomposeWithPoints([r.p0, r.p1]);
            return ts;
        }

        /**
         * 面积
         */
        area()
        {
            return this.p1.subTo(this.p0).crossTo(this.p2.subTo(this.p1)).length * 0.5;
        }

        /**
         * 栅格化，点阵化为XYZ轴间距为1的点阵
         */
        rasterize()
        {
            var aabb = Box3.fromPoints([this.p0, this.p1, this.p2]);
            aabb.min.round();
            aabb.max.round();
            var point = new Vector3();
            var result: number[] = [];
            for (let x = aabb.min.x; x <= aabb.max.x; x++)
            {
                for (let y = aabb.min.y; y <= aabb.max.y; y++)
                {
                    for (let z = aabb.min.z; z <= aabb.max.z; z++)
                    {
                        // 判定是否在三角形上
                        var onTri = this.onWithPoint(point.set(x, y, z), 0.5);
                        if (onTri)
                        {
                            result.push(x, y, z);
                        }
                    }
                }
            }
            return result;
        }

        /**
         * 平移
         * @param v 向量
         */
        translateVector3(v: Vector3)
        {
            this.p0.add(v);
            this.p1.add(v);
            this.p2.add(v);
            return this;
        }

        /**
         * 缩放
         * @param v 缩放量
         */
        scaleVector3(v: Vector3)
        {
            this.p0.scale(v);
            this.p1.scale(v);
            this.p2.scale(v);
            return this;
        }

        /**
         * 自定义栅格化为点阵
         * @param voxelSize 体素尺寸，点阵XYZ轴间距
         * @param origin 原点，点阵中的某点正处于原点上，因此可以用作体素范围内的偏移
         */
        rasterizeCustom(voxelSize = new Vector3(1, 1, 1), origin = new Vector3())
        {
            var tri = this.clone().translateVector3(origin.negateTo()).scaleVector3(voxelSize.inverseTo());
            var ps = tri.rasterize();
            var vec = new Vector3();
            var result: { xi: number, yi: number, zi: number, xv: number, yv: number, zv: number }[] = [];
            ps.forEach((v, i) =>
            {
                if (i % 3 == 0)
                {
                    vec.set(ps[i], ps[i + 1], ps[i + 2]).scale(voxelSize).add(origin);
                    result.push({ xi: ps[i], yi: ps[i + 1], zi: ps[i + 2], xv: vec.x, yv: vec.y, zv: vec.z });
                }
            });
            return result;
        }

        /**
         * 复制
         * @param triangle 三角形
         */
        copy(triangle: Triangle3)
        {
            this.p0.copy(triangle.p0);
            this.p1.copy(triangle.p1);
            this.p2.copy(triangle.p2);
            return this;
        }

        /**
         * 克隆
         */
        clone()
        {
            return new Triangle3().copy(this);
        }

        /**
         * 判断指定点是否在三角形内
         * 
         * @param p0 三角形0号点
         * @param p1 三角形1号点
         * @param p2 三角形2号点
         * @param p 指定点
         */
        static containsPoint(p0: Vector3, p1: Vector3, p2: Vector3, p: Vector3)
        {
            return new Triangle3(p0, p1, p2).onWithPoint(p);
        }
    }
}