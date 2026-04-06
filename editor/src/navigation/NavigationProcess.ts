import { Vector3, mathUtil, MapUtils, Segment3, Segment, Color4, Triangle3, SegmentGeometry, GameObject, PointGeometry, serialization, Renderable, Material, RenderMode } from 'feng3d';

export class NavigationProcess
{
    private data: NavigationData;

    constructor(geometry: { positions: number[], indices: number[] })
    {
        this.data = new NavigationData();
        this.data.init(geometry);
    }

    checkMaxSlope(maxSlope: number)
    {
        const up = new Vector3(0, 1, 0);
        const mincos = Math.cos(maxSlope * mathUtil.DEG2RAD);

        const keys = MapUtils.getKeys(this.data.trianglemap);
        keys.forEach((element) =>
        {
            const normal = this.data.trianglemap.get(element).getNormal();
            const dot = normal.dot(up);
            if (dot < mincos)
            {
                this.data.trianglemap.delete(element);
            }
        });
    }

    checkAgentRadius(agentRadius: number)
    {
        const trianglemap = this.data.trianglemap;
        const linemap = this.data.linemap;
        const pointmap = this.data.pointmap;
        const line0map = new Map<number, Line0>();

        // 获取所有独立边
        const lines = this.getAllSingleLine();
        // 调试独立边
        this.debugShowLines(lines);

        // 计算创建边缘边
        const line0s = lines.map(createLine0);
        // 调试边缘边内部方向
        this.debugShowLines1(line0s, agentRadius);
        // 方案1：遍历每个点，使得该点对所有边缘边保持大于agentRadius的距离
        // pointmap.getValues().forEach(handlePoint);
        // 方案2：遍历所有边缘边，把所有在边缘边左边角内的点移到左边角平分线上，所有在边缘边右边角内的移到右边角平分线上，
        line0s.forEach(handleLine0);
        trianglemap.forEach((triangle) =>
        {
            if (triangle.getNormal().dot(new Vector3(0, 1, 0)) < 0)
            { trianglemap.delete(triangle.index); }
        }); // 删除面向-y方向的三角形

        // 方案3：在原有模型上减去 以独立边为轴以agentRadius为半径的圆柱（此处需要基于模型之间的剔除等运算）

        /**
         * 把所有在边缘边左边角内的点移到左边角平分线上，所有在边缘边右边角内的移到右边角平分线上
         * @param line0
         */
        function handleLine0(line0: Line0)
        {
            // 三条线段
            const ls = line0map.get(line0.leftline).segment;
            const cs = line0.segment;
            const rs = line0map.get(line0.rightline).segment;
            //
            const ld = line0map.get(line0.leftline).direction;
            const cd = line0.direction;
            const rd = line0map.get(line0.rightline).direction;
            // 顶点坐标
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const p0 = [ls.p0, ls.p1].filter((p) => !cs.p0.equals(p) && !cs.p1.equals(p))[0];
            const p1 = [ls.p0, ls.p1].filter((p) => cs.p0.equals(p) || cs.p1.equals(p))[0];
            const p2 = [rs.p0, rs.p1].filter((p) => cs.p0.equals(p) || cs.p1.equals(p))[0];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const p3 = [rs.p0, rs.p1].filter((p) => !cs.p0.equals(p) && !cs.p1.equals(p))[0];
            // 角平分线上点坐标
            const lp = getHalfAnglePoint(p1, ld, cd, agentRadius);
            const rp = getHalfAnglePoint(p2, cd, rd, agentRadius);
            // debug
            pointGeometry.points.push({ position: lp });
            pointGeometry.points.push({ position: rp });
            pointGeometry.invalidateGeometry();
            //
            const hpmap: { [point: number]: true } = {};
            const points = linemap.get(line0.index).points.concat();
            handlePoints();

            function handlePoints()
            {
                if (points.length === 0)
                {
                    return;
                }

                const point = pointmap.get(points.shift());
                //
                const ld = ls.getPointDistance(point.getPoint());
                const cd = cs.getPointDistance(point.getPoint());
                const rd = rs.getPointDistance(point.getPoint());
                //
                if (cd < agentRadius)
                {
                    if (ld < agentRadius) // 处理左夹角内点点
                    {
                        point.setPoint(lp);
                    }
                    else if (rd < agentRadius) // 处理右夹角内点点
                    {
                        point.setPoint(rp);
                    }
                    else
                    {
                        point.setPoint(point.getPoint().addTo(line0.direction.clone().scaleNumber(agentRadius - cd)));
                    }
                    // 标记该点以被处理
                    hpmap[point.index] = true;
                    // 搜索临近点
                    point.getNearbyPoints().forEach((p) =>
                    {
                        if (hpmap[p])
                        { return; }
                        if (points.indexOf(p) !== -1)
                        { return; }
                        points.push(p);
                    });
                }
                handlePoints();
            }

            /**
             * 获取对角线上距离角的两边距离为 distance 的点
             * @param pa 角的第一个点
             * @param d1 角点
             * @param d2 角的第二个点
             * @param distance 距离
             */
            function getHalfAnglePoint(p0: Vector3, d1: Vector3, d2: Vector3, distance: number)
            {
                // 对角线方向
                const djx = d1.addTo(d2).normalize();
                const cos = djx.dot(d1);
                const targetPoint = p0.addTo(djx.clone().normalize(distance / cos));

                return targetPoint;
            }
        }

        /**
         * 使得该点对所有边缘边保持大于agentRadius的距离
         * @param point
         */
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        function handlePoint(point: Point)
        {
            const p = point.getPoint();
            const crossline0s: [Line0, number][] = line0s.reduce((result, line0) =>
            {
                const distance = line0.segment.getPointDistance(p);
                if (distance < agentRadius)
                {
                    result.push([line0, distance]);
                }

                return result;
            }, []);
            if (crossline0s.length === 0)
            { return; }
            if (crossline0s.length === 1)
            {
                point.setPoint(point.getPoint().addTo(crossline0s[0][0].direction.clone().scaleNumber(agentRadius - crossline0s[0][1])));
            }
            else
            {
                // 如果多于两条线段，取距离最近两条
                if (crossline0s.length > 2)
                {
                    crossline0s.sort((a, b) => a[1] - b[1]);
                }
                // 对角线方向
                const djx = crossline0s[0][0].direction.addTo(crossline0s[1][0].direction).normalize();
                // 查找两条线段的共同点
                const points0 = linemap.get(crossline0s[0][0].index).points;
                const points1 = linemap.get(crossline0s[1][0].index).points;
                const ps = points0.filter((v) => points1.indexOf(v) !== -1);
                if (ps.length === 1)
                {
                    const cross = pointmap.get(ps[0]).getPoint();
                    const cos = djx.dot(crossline0s[0][0].segment.p1.subTo(crossline0s[0][0].segment.p0).normalize());
                    const sin = Math.sqrt(1 - cos * cos);
                    const length = agentRadius / sin;
                    const targetPoint = cross.addTo(djx.clone().scaleNumber(length));
                    point.setPoint(targetPoint);
                }
                else
                {
                    ps.length;
                }
            }
        }

        /**
         * 创建边缘边
         * @param line
         */
        function createLine0(line: Line)
        {
            const line0 = new Line0();
            line0.index = line.index;
            const points = line.points.map((v) =>
            {
                const point = pointmap.get(v);

                return new Vector3(point.value[0], point.value[1], point.value[2]);
            });
            line0.segment = new Segment3(points[0], points[1]);
            //
            const triangle = trianglemap.get(line.triangles[0]);
            if (!triangle)
            {
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const linepoints = line.points.map((v) => pointmap.get(v));
            const otherPoint = pointmap.get(triangle.points.filter((v) =>
                line.points.indexOf(v) === -1)[0]).getPoint();
            line0.direction = line0.segment.getNormalWithPoint(otherPoint);
            line0.leftline = pointmap.get(line.points[0]).lines.filter((line) =>
            {
                if (line === line0.index)
                { return false; }
                const prelines = lines.filter((l) =>
                    l.index === line);

                return prelines.length === 1;
            })[0];
            line0.rightline = pointmap.get(line.points[1]).lines.filter((line) =>
            {
                if (line === line0.index)
                { return false; }
                const prelines = lines.filter((l) =>
                    l.index === line);

                return prelines.length === 1;
            })[0];
            line0map.set(line0.index, line0);

            return line0;
        }
    }

    checkAgentHeight(_agentHeight: number)
    {
        this.data.resetData();
        //
        const pointmap = this.data.pointmap;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const linemap = this.data.linemap;
        const trianglemap = this.data.trianglemap;
        //
        const triangle0s = MapUtils.getValues(trianglemap).map(createTriangle);
        MapUtils.getValues(pointmap).forEach(handlePoint);

        //
        function createTriangle(triangle: Triangle)
        {
            const triangle3D = triangle.getTriangle3D();

            return { triangle3D, index: triangle.index };
        }
        //
        function handlePoint(point: Point)
        {
            // 测试点是否通过所有三角形测试
            const result = triangle0s.every((_triangle0) =>
                true);
            // 测试失败时删除该点关联的三角形
            if (!result)
            {
                point.triangles.forEach((triangleindex) =>
                {
                    trianglemap.delete(triangleindex);
                });
            }
        }
    }

    getGeometry()
    {
        return this.data.getGeometry();
    }

    private debugShowLines1(line0s: Line0[], length: number)
    {
        const segments: Segment[] = [];
        line0s.forEach((element) =>
        {
            const p0 = element.segment.p0.addTo(element.segment.p1).scaleNumber(0.5);
            const p1 = p0.addTo(element.direction.clone().normalize(length));
            segments.push({ start: p0, end: p1, startColor: new Color4(1), endColor: new Color4(0, 1) });
        });
        segmentGeometry.segments = segments;
    }

    private debugShowLines(lines: Line[])
    {
        createSegment();
        segmentGeometry.segments.length = 0;
        lines.forEach((element) =>
        {
            const points = element.points.map((pointindex) =>
            {
                const value = this.data.pointmap.get(pointindex).value;

                return new Vector3(value[0], value[1], value[2]);
            });
            segmentGeometry.addSegment({ start: points[0], end: points[1] });
        });
    }

    /**
     * 获取所有独立边
     */
    private getAllSingleLine()
    {
        const lines: Line[] = [];
        const needLine: Line[] = [];
        this.data.linemap.forEach((element) =>
        {
            element.triangles = element.triangles.filter((triangleIndex) => this.data.trianglemap.has(triangleIndex));
            if (element.triangles.length === 1)
            { lines.push(element); }
            else if (element.triangles.length === 0)
            { needLine.push(element); }
        });
        needLine.forEach((element) =>
        {
            this.data.linemap.delete(element.index);
        });

        return lines;
    }
}

/**
 * 点
 */
class Point
{
    /**
     * 点索引
     */
    index: number;
    /**
     * 点的值，xyz
     */
    value: [number, number, number];
    /**
     * 点连接的线段索引列表
     */
    lines: number[] = [];
    /**
     * 点连接的三角形索引列表
     */
    triangles: number[] = [];

    //
    pointmap: Map<number, Point>;
    linemap: Map<number, Line>;
    trianglemap: Map<number, Triangle>;

    constructor(pointmap, linemap, trianglemap)
    {
        this.pointmap = pointmap;
        this.linemap = linemap;
        this.trianglemap = trianglemap;
    }

    /**
     * 设置该点位置
     * @param p
     */
    setPoint(p: Vector3)
    {
        this.value = [p.x, p.y, p.z];
    }

    /**
     * 获取该点位置
     */
    getPoint()
    {
        return new Vector3(this.value[0], this.value[1], this.value[2]);
    }

    /**
     * 获取相邻点索引列表
     */
    getNearbyPoints()
    {
        const points = this.triangles.reduce((points: number[], triangleid) =>
        {
            const triangle = this.trianglemap.get(triangleid);
            if (!triangle)
            { return points; }
            triangle.points.forEach((point) =>
            {
                if (point !== this.index)
                {
                    points.push(point);
                }
            });

            return points;
        }, []);

        return points;
    }
}

/**
 * 边
 */
class Line
{
    /**
     * 线段索引
     */
    index: number;
    /**
     * 线段两端点索引
     */
    points: [number, number];
    /**
     * 线段连接的三角形索引列表
     */
    triangles: number[] = [];
}

/**
 * 三角形
 */
class Triangle
{
    /**
     * 索引
     */
    index: number;
    /**
     * 包含的三个点索引
     */
    points: [number, number, number];
    /**
     * 包含的三个边索引
     */
    lines: [number, number, number] = <any>[];

    //
    pointmap: Map<number, Point>;
    linemap: Map<number, Line>;
    trianglemap: Map<number, Triangle>;

    constructor(pointmap, linemap, trianglemap)
    {
        this.pointmap = pointmap;
        this.linemap = linemap;
        this.trianglemap = trianglemap;
    }

    getTriangle3D()
    {
        const points: Vector3[] = [];
        this.points.forEach((element) =>
        {
            const pointvalue = this.pointmap.get(element).value;
            points.push(new Vector3(pointvalue[0], pointvalue[1], pointvalue[2]));
        });
        const triangle3D = new Triangle3(points[0], points[1], points[2]);

        return triangle3D;
    }

    /**
     * 获取法线
     */
    getNormal()
    {
        const normal = this.getTriangle3D().getNormal();

        return normal;
    }
}

/**
 * 边
 */
class Line0
{
    /**
     * 线段索引
     */
    index: number;
    /**
     * 边所在直线
     */
    segment: Segment3;
    /**
     * 可行走区域的内部方向
     */
    direction: Vector3;
    /**
     * 左方边索引
     */
    leftline: number;
    /**
     * 左方边索引
     */
    rightline: number;
}

class NavigationData
{
    pointmap: Map<number, Point>;
    linemap: Map<number, Line>;
    trianglemap: Map<number, Triangle>;

    init(geometry: { positions: number[], indices: number[] })
    {
        const positions = geometry.positions;
        let indices = geometry.indices;

        console.assert(indices.length % 3 === 0);
        const pointmap = this.pointmap = new Map<number, Point>();
        const linemap = this.linemap = new Map<number, Line>();
        const trianglemap = this.trianglemap = new Map<number, Triangle>();
        // 合并相同点
        let pointAutoIndex = 0;
        const pointcache: { [x: number]: { [y: number]: { [z: number]: Point } } } = {};
        const pointindexmap: { [oldindex: number]: number } = {};// 通过点原来索引映射到新索引
        //
        let lineAutoIndex = 0;
        const linecache: { [point0: number]: { [point1: number]: Line } } = {};
        //
        for (let i = 0, n = positions.length; i < n; i += 3)
        {
            const point = createPoint(positions[i], positions[i + 1], positions[i + 2]);
            pointindexmap[i / 3] = point.index;
        }
        indices = indices.map((pointindex) => pointindexmap[pointindex]);
        //
        for (let i = 0, n = indices.length; i < n; i += 3)
        {
            const triangle = new Triangle(pointmap, linemap, trianglemap);
            triangle.index = i / 3;
            triangle.points = [indices[i], indices[i + 1], indices[i + 2]];
            trianglemap.set(triangle.index, triangle);
            //
            pointmap.get(indices[i]).triangles.push(triangle.index);
            pointmap.get(indices[i + 1]).triangles.push(triangle.index);
            pointmap.get(indices[i + 2]).triangles.push(triangle.index);
            //
            const points = triangle.points.concat().sort().map((value) => pointmap.get(value));
            createLine(points[0], points[1], triangle);
            createLine(points[0], points[2], triangle);
            createLine(points[1], points[2], triangle);
        }

        function createLine(point0: Point, point1: Point, triangle: Triangle)
        {
            linecache[point0.index] = linecache[point0.index] || {};
            let line = linecache[point0.index][point1.index];
            if (!line)
            {
                line = linecache[point0.index][point1.index] = new Line();
                line.index = lineAutoIndex++;
                line.points = [point0.index, point1.index];
                linemap.set(line.index, line);
                //
                point0.lines.push(line.index);
                point1.lines.push(line.index);
            }
            line.triangles.push(triangle.index);
            //
            triangle.lines.push(line.index);
        }

        function createPoint(x: number, y: number, z: number)
        {
            const xs = x.toPrecision(6);
            const ys = y.toPrecision(6);
            const zs = z.toPrecision(6);

            pointcache[xs] = pointcache[xs] || {};
            pointcache[xs][ys] = pointcache[xs][ys] || {};
            let point = pointcache[xs][ys][zs];
            if (!point)
            {
                point = pointcache[xs][ys][zs] = new Point(pointmap, linemap, trianglemap);
                point.index = pointAutoIndex++;
                point.value = [x, y, z];
                pointmap.set(point.index, point);
            }

            return point;
        }
    }

    getGeometry()
    {
        const positions: number[] = [];
        const pointIndexMap = new Map<number, number>();
        let autoId = 0;
        const indices: number[] = [];
        this.trianglemap.forEach((element) =>
        {
            const points = element.points.map((pointIndex) =>
            {
                if (pointIndexMap.has(pointIndex))
                {
                    return pointIndexMap.get(pointIndex);
                }
                // eslint-disable-next-line prefer-spread
                positions.push.apply(positions, this.pointmap.get(pointIndex).value);
                pointIndexMap.set(pointIndex, autoId++);

                return autoId - 1;
            });
            // eslint-disable-next-line prefer-spread
            indices.push.apply(indices, points);
        });

        return { positions, indices };
    }

    resetData()
    {
        const geometry = this.getGeometry();
        this.clearData();
        this.init(geometry);
    }

    clearData()
    {
        this.pointmap.forEach((point) =>
        {
            point.pointmap = point.linemap = point.trianglemap = null;
        });
        this.pointmap.clear();
        this.linemap.forEach((_line) =>
        {

        });
        this.linemap.clear();
        this.trianglemap.forEach((_triangle) =>
        {

        });
        this.trianglemap.clear();
    }
}

let segmentGeometry: SegmentGeometry;
let debugSegment: GameObject;
//
let pointGeometry: PointGeometry;
let debugPoint: GameObject;

function createSegment()
{
    console.error(`未实现`);
    let parentobject;
    if (!debugSegment)
    {
        debugSegment = serialization.setValue(new GameObject(), { name: 'segment' });
        debugSegment.mouseEnabled = false;
        // 初始化材质
        const model = debugSegment.addComponent(Renderable);
        model.material = serialization.setValue(new Material(), {
            shaderName: 'segment', renderParams: { renderMode: RenderMode.LINES },
            uniforms: { u_segmentColor: new Color4(1.0, 0, 0) },
        });
        segmentGeometry = model.geometry = new SegmentGeometry();
    }
    parentobject.addChild(debugSegment);
    //
    if (!debugPoint)
    {
        debugPoint = serialization.setValue(new GameObject(), { name: 'points' });
        debugPoint.mouseEnabled = false;
        const model = debugPoint.addComponent(Renderable);
        pointGeometry = model.geometry = new PointGeometry();
        model.material = serialization.setValue(new Material(), {
            shaderName: 'point', renderParams: { renderMode: RenderMode.POINTS },
            uniforms: { u_PointSize: 5, u_color: new Color4() },
        });
    }
    pointGeometry.points = [];
    parentobject.addChild(debugPoint);
}
