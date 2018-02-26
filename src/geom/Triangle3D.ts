namespace feng3d
{
    /**
     * 三角形
     */
    export class Triangle3D
    {
        /**
		 * 通过3顶点定义一个三角形
		 * @param p0		点0
		 * @param p1		点1
		 * @param p2		点2
		 */
        static fromPoints(p0: Vector3, p1: Vector3, p2: Vector3)
        {
            return new Triangle3D(p0, p1, p2);
        }

        /**
         * 随机三角形
         */
        static random()
        {
            return new Triangle3D(Vector3.random(), Vector3.random(), Vector3.random());
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
            return [Segment3D.fromPoints(this.p0, this.p1), Segment3D.fromPoints(this.p1, this.p2), Segment3D.fromPoints(this.p2, this.p0)];
        }

        /**
         * 三角形所在平面
         */
        getPlane3d(pout = new Plane3D())
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
            return pout.copy(this.p0).add(this.p1).add(this.p2).scale(1 / 3);
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
            return pout.copy(this.p0).scale(a0).add(this.p1.scaleTo(b0)).add(this.p2.scaleTo(c0));
        }

        /**
         * 外心，内切圆心,三角形内心为三角形三条内角平分线的交点。
         * @see https://baike.baidu.com/item/%E4%B8%89%E8%A7%92%E5%BD%A2%E4%BA%94%E5%BF%83/218867
         */
        getInnercenter(pout = new Vector3())
        {
            var a = this.p2.subTo(this.p1).length;
            var b = this.p0.subTo(this.p2).length;
            var c = this.p1.subTo(this.p0).length;
            return pout.copy(this.p0).scale(a).add(this.p1.scaleTo(b)).add(this.p2.scaleTo(c)).scale(1 / (a + b + c));
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
            return pout.copy(this.p0).scale(a0).add(this.p1.scaleTo(b0)).add(this.p2.scaleTo(c0)).scale(1 / (a0 + b0 + c0));
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
         * 获取三角形内的点
         * @param p 三点的权重
         * @param pout 输出点
         */
        getPoint(p: Vector3, pout = new Vector3())
        {
            return pout.copy(this.p0).scale(p.x).add(this.p1.scaleTo(p.y)).add(this.p2.scaleTo(p.z));
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
        intersectionWithLine(line: Line3D)
        {
            var plane3d = this.getPlane3d();
            var normal = plane3d.getNormal();
            var cross = plane3d.intersectWithLine3D(line);
            if (!cross)
                return null;
            if (cross instanceof Vector3)
            {
                if (this.onWithPoint(cross))
                    return cross;
                return null;
            }

            // 直线分别于三边相交
            var crossSegment: Segment3D = <any>null;
            var ps = this.getSegments().reduce((v: Vector3[], segment) =>
            {
                var r = segment.intersectionWithLine(line);
                if (!r)
                    return v;
                if (r instanceof Segment3D)
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
            return Segment3D.fromPoints(ps[0], ps[1]);
        }

        /**
         * 获取与线段相交
         */
        intersectionWithSegment(segment: Segment3D)
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
            return Segment3D.fromPoints(p0, p1);
        }

        /**
         * 判定点是否在三角形上
         * @param p 
         */
        onWithPoint(p: Vector3)
        {
            var plane3d = this.getPlane3d();
            if (plane3d.classifyPoint(p) != PlaneClassification.INTERSECT)
                return false;

            if (Segment3D.fromPoints(this.p0, this.p1).onWithPoint(p))
                return true;
            if (Segment3D.fromPoints(this.p1, this.p2).onWithPoint(p))
                return true;
            if (Segment3D.fromPoints(this.p2, this.p0).onWithPoint(p))
                return true;

            var n = this.getNormal();
            if (new Triangle3D(this.p0, this.p1, p).getNormal().dot(n) < 0)
                return false;
            if (new Triangle3D(this.p1, this.p2, p).getNormal().dot(n) < 0)
                return false;
            if (new Triangle3D(this.p2, this.p0, p).getNormal().dot(n) < 0)
                return false;

            return true;
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
        intersectsBox(box: Box)
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
         * 用点分解（切割）三角形
         */
        decomposeWithPoint(p: Vector3)
        {
            if (!this.onWithPoint(p))
                return [this];
            if (this.p0.equals(p) || this.p1.equals(p) || this.p2.equals(p))
                return [this];
            if (Segment3D.fromPoints(this.p0, this.p1).onWithPoint(p))
                return [Triangle3D.fromPoints(this.p0, p, this.p2), Triangle3D.fromPoints(p, this.p1, this.p2)];
            if (Segment3D.fromPoints(this.p1, this.p2).onWithPoint(p))
                return [Triangle3D.fromPoints(this.p1, p, this.p0), Triangle3D.fromPoints(p, this.p2, this.p0)];
            if (Segment3D.fromPoints(this.p2, this.p0).onWithPoint(p))
                return [Triangle3D.fromPoints(this.p2, p, this.p1), Triangle3D.fromPoints(p, this.p0, this.p1)];
            return [Triangle3D.fromPoints(p, this.p0, this.p1), Triangle3D.fromPoints(p, this.p1, this.p2), Triangle3D.fromPoints(p, this.p2, this.p0)];
        }

        /**
         * 用点分解（切割）三角形
         */
        decomposeWithPoints(ps: Vector3[])
        {
            // 遍历顶点分割三角形
            var ts = ps.reduce((v: Triangle3D[], p) =>
            {
                // 使用点分割所有三角形
                v = v.reduce((v0: Triangle3D[], t) =>
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
        decomposeWithSegment(segment: Segment3D)
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
        decomposeWithLine(line: Line3D)
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
         * 复制
         * @param triangle 三角形
         */
        copy(triangle: Triangle3D)
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
            return new Triangle3D().copy(this);
        }
    }
}