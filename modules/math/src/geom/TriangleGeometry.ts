namespace feng3d
{
    /**
     * 由三角形构成的几何体
     * ### 限定：
     *  * 只包含三角形，不存在四边形等其他多边形
     *  * 
     */
    export class TriangleGeometry
    {
        /**
         * 从盒子初始化
         * @param box 盒子
         */
        static fromBox(box: Box3)
        {
            return new TriangleGeometry().fromBox(box);
        }

        triangles: Triangle3[];

        constructor(triangles: Triangle3[] = [])
        {
            this.triangles = triangles;
        }

        /**
         * 从盒子初始化
         * @param box 盒子
         */
        fromBox(box: Box3)
        {
            this.triangles.length = 0;
            box.toTriangles(this.triangles);
            return this;
        }

        /**
         * 获取所有顶点，去除重复顶点
         */
        getPoints()
        {
            var ps = this.triangles.reduce((v: Vector3[], t) => { return v.concat(t.getPoints()); }, []);
            Array.unique(ps, (a, b) => a.equals(b));
            return ps;
        }

        /**
         * 是否闭合
         * 方案：获取所有三角形的线段，当每条线段（a,b）都存在且仅有一条与之相对于的线段（b，a）时几何体闭合
         */
        isClosed()
        {
            // 获取所有线段
            var ss = this.triangles.reduce((ss: Segment3[], t) => { return ss.concat(t.getSegments()); }, []);
            // 当每条线段（a,b）都存在与之相对于的线段（b，a）时几何体闭合
            var r = ss.every((s) => { return ss.filter((s0) => { return s.p0.equals(s0.p1) && s.p1.equals(s0.p0); }).length == 1; });
            return r;
        }

        /**
         * 包围盒
         */
        getBox(box = new Box3())
        {
            return box.fromPoints(this.getPoints());
        }

        /**
         * 与指定点最近的点
         * @param point 点
         * @param vout 输出点
         */
        closestPointWithPoint(point: Vector3, vout = new Vector3())
        {
            // 计算指定点到所有平面的距离，并按距离排序
            var r = this.triangles.map((t) => { var p = t.closestPointWithPoint(point); return { p: p, d: point.distanceSquared(p) }; }).sort((a, b) => { return a.d - b.d; });
            return vout.copy(r[0].p);
        }

        /**
         * 给指定点分类
         * @param p 点
         * @return 点相对于几何体位置；0:在几何体表面上，1：在几何体外，-1：在几何体内
         * 方案：当指定点不在几何体上时，在几何体上找到距离指定点最近点，最近点到给定点形成的向量与最近点所在面（当最近点在多个面上时取点乘摸最大的面）法线点乘大于0时给定点在几何体内，否则在几何体外。
         */
        classifyPoint(p: Vector3)
        {
            if (!this.isClosed())
                return 1;

            // 是否在表面
            var onface = this.triangles.reduce((v, t) =>
            {
                return v || t.onWithPoint(p);
            }, false);
            if (onface) return 0;

            // 最近点
            var cp = this.closestPointWithPoint(p);
            // 到最近点的向量
            var cpv = cp.subTo(p);
            // 最近点所在平面
            var cts = this.triangles.filter((t) => { return t.onWithPoint(cp); })
            // 最近点向量与所在平面方向相同则点在几何体内
            var v = cts.map((t) => { return t.getNormal().dot(cpv); }).sort((a, b) => { return Math.abs(b) - Math.abs(a); })[0];
            if (v > 0)
                return -1;
            return 1;
        }

        /**
         * 是否包含指定点
         * @param p 点
         */
        containsPoint(p: Vector3)
        {
            return this.classifyPoint(p) <= 0;
        }

        /**
         * 给指定线段分类
         * @param segment 线段
         * @return 线段相对于几何体位置；0:在几何体表面上，1：在几何体外，-1：在几何体内，2：横跨几何体
         */
        classifySegment(segment: Segment3)
        {
            // 线段与几何体不相交时
            var r = this.intersectionWithSegment(segment);
            if (!r)
            {
                if (this.classifyPoint(segment.p0) > 0)
                    return 1;
                return -1;
            }
            // 相交多条线段时 横跨
            if (r.segments.length > 1)
                return 2;
            if (r.segments.length == 1)
            {
                // 相交线段相对 几何体的位置
                var pc = [r.segments[0].p0, r.segments[0].p1].map((p) => this.classifyPoint(p));
                if (pc[0] * pc[1] < 0) return 2;
                if (pc[0] + pc[1] == 0) return 0;
                if (pc[0] + pc[1] < 0) return -1;
                return 1;
            }
            // 相交于点
            if (r.points.length)
            {

            }
        }

        /**
         * 给指定三角形分类
         * @param triangle 三角形
         * @return 三角形相对于几何体位置；0:在几何体表面上，1：在几何体外，-1：在几何体内
         */
        classifyTriangle(triangle: Triangle3)
        {

        }

        /**
         * 与直线碰撞
         * @param line3d 直线
         */
        intersectionWithLine(line3d: Line3)
        {
            // 线段与三角形碰撞
            var ss: Segment3[] = [];
            var ps: Vector3[] = [];
            this.triangles.forEach(t =>
            {
                var r = t.intersectionWithLine(line3d);
                if (!r) return;
                if (r instanceof Segment3) { ss.push(r); return; }
                ps.push(r);
            });

            // 清除相同的线段
            Array.unique(ss, (a, b) => a.equals(b));
            // 删除在相交线段上的交点
            ps = ps.filter((p) => { return ss.every((s) => { return !s.onWithPoint(p); }); });
            // 清除相同点
            Array.unique(ps, (a, b) => a.equals(b));
            if (ss.length + ps.length == 0)
                return null;
            return { segments: ss, points: ps };
        }

        /**
         * 与线段相交
         * @param segment 线段
         * @return 不相交时返回null，相交时返回 碰撞线段列表与碰撞点列表
         */
        intersectionWithSegment(segment: Segment3)
        {
            var line = segment.getLine();
            var r = this.intersectionWithLine(line);
            if (!r) return null;
            var ps = r.points = r.points.filter((p) => { return segment.onWithPoint(p) });
            r.segments = r.segments.reduce((v: Segment3[], s) =>
            {
                var p0 = segment.clampPoint(s.p0);
                var p1 = segment.clampPoint(s.p1);
                if (!s.onWithPoint(p0))
                    return v;
                if (p0.equals(p1))
                {
                    ps.push(p0);
                    return v;
                }
                v.push(Segment3.fromPoints(p0, p1));
                return v;
            }, []);

            if (r.segments.length + r.points.length == 0)
                return null;
            return r;
        }

        /**
         * 分解三角形
         * @param triangle 三角形
         */
        decomposeTriangle(triangle: Triangle3)
        {

        }

        /**
         * 拷贝
         */
        copy(triangleGeometry: TriangleGeometry)
        {
            this.triangles = triangleGeometry.triangles.map((t) => { return t.clone(); })
            return this;
        }

        /**
         * 克隆
         */
        clone()
        {
            return new TriangleGeometry().copy(this);
        }
    }
}