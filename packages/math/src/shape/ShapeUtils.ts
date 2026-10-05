import type { Vector2Like } from '../geom/vector2';
import { vec2Equals } from '../geom/vector2';
import earcut from 'earcut';

export class ShapeUtils
{
    /**
     * 计算多边形面积
     * @param contour 多边形轮廓，使用顶点数组表示。
     */
    static area(contour: Vector2Like[])
    {
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
     *
     * @param contour 多边形轮廓，使用顶点数组表示。
     */
    static isClockWise(contour: Vector2Like[])
    {
        return ShapeUtils.area(contour) < 0;
    }

    /**
     * 三角化多边形
     *
     * @param contour 多边形轮廓，使用顶点数组表示。
     * @param holes 孔洞多边形数组，每个孔洞多边形使用顶点数组表示。
     */
    static triangulateShape(contour: Vector2Like[], holes: Vector2Like[][])
    {
        const vertices: number[] = []; // flat array of vertices like [ x0,y0, x1,y1, x2,y2, ... ]
        const holeIndices: number[] = []; // array of hole indices
        const faces: number[][] = []; // final array of vertex indices like [ [ a,b,d ], [ b,c,d ] ]

        removeDupEndPts(contour);
        addContour(vertices, contour);

        //
        let holeIndex = contour.length;

        holes.forEach(removeDupEndPts);

        for (let i = 0; i < holes.length; i++)
        {
            holeIndices.push(holeIndex);
            holeIndex += holes[i].length;
            addContour(vertices, holes[i]);
        }
        //
        const triangles = earcut(vertices, holeIndices);

        //
        for (let i = 0; i < triangles.length; i += 3)
        {
            faces.push(triangles.slice(i, i + 3));
        }

        return faces;
    }
}

function removeDupEndPts(points: Vector2Like[])
{
    const l = points.length;

    if (l > 2 && vec2Equals(points[l - 1], points[0]))
    {
        points.pop();
    }
}

function addContour(vertices: number[], contour: Vector2Like[])
{
    for (let i = 0; i < contour.length; i++)
    {
        vertices.push(contour[i].x);
        vertices.push(contour[i].y);
    }
}

