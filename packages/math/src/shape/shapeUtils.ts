/**
 * 多边形工具纯函数集（原 `ShapeUtils` class 的纯函数形态）
 *
 * ## 为什么是「模块级函数」而不是 class
 *
 * 原 `ShapeUtils` 是**纯静态算法容器**：3 个 `static` 方法（`area` / `isClockWise` / `triangulateShape`），
 * 没有构造函数、没有实例字段、没有继承、没有 `this`；同文件的 `removeDupEndPts` / `addContour`
 * **本来就已经是模块级函数**。所以拆解方式就是「把 `static` 方法改成模块级函数」，
 * 不需要 tagged union + 分发（方案 §8 的脚注 `[^shapeutils]` 已核实过这一点）。
 *
 * ## 保真注意：`shapeUtilsTriangulateShape` **会修改入参**——这是有意保留的既有语义
 *
 * 原 `ShapeUtils.triangulateShape` 内部调 `removeDupEndPts(contour)`，后者对「首尾点重复」的
 * 多边形直接 `points.pop()`——**改的是调用方传进来的那个数组**。这是 three.js 的原样移植
 * （其 `ShapeUtils.triangulateShape` 同样就地弹出重复末点）。
 *
 * 按方案 §3.1「纯函数一律不修改入参」这条本该改掉，但本批的边界是**去 class 化，不改行为**：
 * 一旦改成「复制后再 pop」，`shapeUtilsTriangulateShape` 会从「写一个入参」变成「不写任何入参」，
 * 而 `ShapePath2` 的调用点依赖的正是原语义（它随后还要用同一个 `subPaths` 数组算洞口）。
 * 所以这里**逐字保留**，并在签名注释里写明——要改语义请单开一批、连带迁移调用点。
 */
import type { Vector2Like } from '../geom/vector2';
import { vec2Equals } from '../geom/vector2';
import earcut from 'earcut';

/**
 * 计算多边形面积
 *
 * @param contour 多边形轮廓，使用顶点数组表示。
 */
export function shapeUtilsArea(contour: readonly Vector2Like[])
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
export function shapeUtilsIsClockWise(contour: readonly Vector2Like[])
{
    return shapeUtilsArea(contour) < 0;
}

/**
 * 三角化多边形
 *
 * ⚠️ **会就地修改入参 `contour` / `holes`**（弹出与首点重复的末点），理由见文件头。
 *
 * @param contour 多边形轮廓，使用顶点数组表示。
 * @param holes 孔洞多边形数组，每个孔洞多边形使用顶点数组表示。
 */
export function shapeUtilsTriangulateShape(contour: Vector2Like[], holes: Vector2Like[][])
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

function removeDupEndPts(points: Vector2Like[])
{
    const l = points.length;

    if (l > 2 && vec2Equals(points[l - 1], points[0]))
    {
        points.pop();
    }
}

function addContour(vertices: number[], contour: readonly Vector2Like[])
{
    for (let i = 0; i < contour.length; i++)
    {
        vertices.push(contour[i].x);
        vertices.push(contour[i].y);
    }
}
