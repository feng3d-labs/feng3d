import { Vector2 } from './Vector2';

/**
 * 多边形
 */
export class Polygon
{
    /**
     * 多边形顶点列表。
     */
    vertices: Vector2[];

    /**
     *
     * @param vertices 多边形顶点列表。
     */
    constructor(vertices: Vector2[] = [])
    {
        this.vertices = vertices;
    }

    /**
     * 面积
     */
    area()
    {
        const contour = this.vertices;
        const n = contour.length;
        let a = 0.0;

        for (let p = n - 1, q = 0; q < n; p = q++)
        {
            a += (contour[p].x * contour[q].y) - (contour[q].x * contour[p].y);
        }

        return a * 0.5;
    }

    /**
     * 判断多边形是否为顺时针方向
     */
    isClockWise()
    {
        return this.area() < 0;
    }

    /**
     * 判断点是否在多边形内
     *
     * @param point 2维点。
     */
    contains(point: Vector2)
    {
        const inPolygon = this.vertices;
        const polyLen = inPolygon.length;

        // inPt on polygon contour => immediate success    or
        // toggling of inside/outside at every single! intersection point of an edge
        //  with the horizontal line through inPt, left of inPt
        //  not counting lowerY endpoints of edges and whole edges on that line
        let inside = false;

        for (let p = polyLen - 1, q = 0; q < polyLen; p = q++)
        {
            let edgeLowPt = inPolygon[p];
            let edgeHighPt = inPolygon[q];

            let edgeDx = edgeHighPt.x - edgeLowPt.x;
            let edgeDy = edgeHighPt.y - edgeLowPt.y;

            if (Math.abs(edgeDy) > Number.EPSILON)
            {
                // not parallel
                if (edgeDy < 0)
                {
                    edgeLowPt = inPolygon[q]; edgeDx = -edgeDx;
                    edgeHighPt = inPolygon[p]; edgeDy = -edgeDy;
                }

                if ((point.y < edgeLowPt.y) || (point.y > edgeHighPt.y)) continue;

                if (point.y === edgeLowPt.y)
                {
                    if (point.x === edgeLowPt.x) return true; // inPt is on contour ?
                    // continue;                // no intersection or edgeLowPt => doesn't count !!!
                }
                else
                {
                    const perpEdge = (edgeDy * (point.x - edgeLowPt.x)) - (edgeDx * (point.y - edgeLowPt.y));

                    if (perpEdge === 0) return true; // inPt is on contour ?
                    if (perpEdge < 0) continue;
                    inside = !inside; // true intersection left of inPt
                }
            }
            else
            {
                // parallel or collinear
                if (point.y !== edgeLowPt.y) continue; // parallel
                // edge lies on the same horizontal line as inPt
                if (((edgeHighPt.x <= point.x) && (point.x <= edgeLowPt.x))
                    || ((edgeLowPt.x <= point.x) && (point.x <= edgeHighPt.x))) return true; // inPt: Point on contour !
                // continue;
            }
        }

        return inside;
    }
}
