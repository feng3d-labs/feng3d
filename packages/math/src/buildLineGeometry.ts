/**
 * 构建线条几何数据
 *
 * @param lineData - The graphics object containing all the necessary properties
 * @param geometry - Geometry where to append output
 *
 * @see pixi.js https://github.com/pixijs/pixijs/blob/dev/packages/graphics/src/utils/buildLine.ts
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash
 */
export function buildLineGeometry(lineData: {
    /**
     * Minimal distance between points that are considered different.
     * Affects line tesselation.
     *
     * @default 1e-4
     */
    epsilon?: number;

    /**
     * 是否首尾相连。
     *
     * @default false
     */
    close?: boolean;

    /**
     * The style of the line.
     */
    lineStyle?: LineStyle;

    /**
     * The collection of points.
     */
    points: number[];
}, geometry: {
    /**
     * An array of points to draw, 2 numbers per point
     */
    points: number[];
    /**
     * The indices of the vertices
     */
    indices: number[];
} = { points: [], indices: [] })
{
    lineData = Object.assign({}, { epsilon: 1e-4, closeStroke: false }, lineData);
    lineData.lineStyle = Object.assign({}, { width: 1, alignment: 0.5, cap: 'butt', join: 'miter', miterLimit: 10, dashedLinePatternUnit: 1 }, lineData.lineStyle);
    //
    const dashedLineData = transformDashedLine(lineData.points, lineData.lineStyle.dashedLinePatternUnit, lineData.lineStyle.dashedLinePattern);
    dashedLineData.forEach((v) =>
    {
        lineData.points = v;
        buildSingleLineGeometry(lineData, geometry);
    });

return geometry;
}

/**
 * Builds a line to draw using the polygon method.
 *
 * @param lineData - The graphics object containing all the necessary properties
 * @param geometry - Geometry where to append output
 *
 * @see pixi.js https://github.com/pixijs/pixijs/blob/dev/packages/graphics/src/utils/buildLine.ts
 */
function buildSingleLineGeometry(lineData: {
    /**
     * Minimal distance between points that are considered different.
     * Affects line tesselation.
     *
     * @default 1e-4
     */
    epsilon?: number;

    /**
     * 是否首尾相连。
     *
     * @default false
     */
    close?: boolean;

    /**
     * The style of the line.
     */
    lineStyle?: LineStyle;

    /**
     * The collection of points.
     */
    points: number[];
}, geometry: {
    /**
     * An array of points to draw, 2 numbers per point
     */
    points: number[];
    /**
     * The indices of the vertices
     */
    indices: number[];
} = { points: [], indices: [] })
{
    let points = lineData.points;
    const eps = lineData.epsilon;

    if (points.length === 0)
    {
        return geometry;
    }

    const style = lineData.lineStyle;

    // get first and last point.. figure out the middle!
    const firstPoint = { x: points[0], y: points[1] };
    const lastPoint = { x: points[points.length - 2], y: points[points.length - 1] };
    const closedShape = lineData.close;
    const closedPath = Math.abs(firstPoint.x - lastPoint.x) < eps
        && Math.abs(firstPoint.y - lastPoint.y) < eps;

    // if the first point is the last point - gonna have issues :)
    if (closedShape)
    {
        // need to clone as we are going to slightly modify the shape..
        points = points.slice();

        if (closedPath)
        {
            points.pop();
            points.pop();
            lastPoint.x = points[points.length - 2];
            lastPoint.y = points[points.length - 1];
        }

        const midPointX = (firstPoint.x + lastPoint.x) * 0.5;
        const midPointY = (lastPoint.y + firstPoint.y) * 0.5;

        points.unshift(midPointX, midPointY);
        points.push(midPointX, midPointY);
    }

    const verts = geometry.points;
    const length = points.length / 2;
    let indexCount = points.length;
    const indexStart = verts.length / 2;

    // Max. inner and outer width
    const width = style.width / 2;
    const widthSquared = width * width;
    const miterLimitSquared = style.miterLimit * style.miterLimit;

    /* Line segments of interest where (x1,y1) forms the corner. */
    let x0 = points[0];
    let y0 = points[1];
    let x1 = points[2];
    let y1 = points[3];
    let x2 = 0;
    let y2 = 0;

    /* perp[?](x|y) = the line normal with magnitude lineWidth. */
    let perpx = -(y0 - y1);
    let perpy = x0 - x1;
    let perp1x = 0;
    let perp1y = 0;

    let dist = Math.sqrt((perpx * perpx) + (perpy * perpy));

    perpx /= dist;
    perpy /= dist;
    perpx *= width;
    perpy *= width;

    const ratio = style.alignment;
    const innerWeight = (1 - ratio) * 2;
    const outerWeight = ratio * 2;

    if (!closedShape)
    {
        if (style.cap === 'round')
        {
            indexCount += round(
                x0 - (perpx * (innerWeight - outerWeight) * 0.5),
                y0 - (perpy * (innerWeight - outerWeight) * 0.5),
                x0 - (perpx * innerWeight),
                y0 - (perpy * innerWeight),
                x0 + (perpx * outerWeight),
                y0 + (perpy * outerWeight),
                verts,
                true,
            ) + 2;
        }
        else if (style.cap === 'square')
        {
            indexCount += square(x0, y0, perpx, perpy, innerWeight, outerWeight, true, verts);
        }
    }

    // Push first point (below & above vertices)
    verts.push(
        x0 - (perpx * innerWeight),
        y0 - (perpy * innerWeight));
    verts.push(
        x0 + (perpx * outerWeight),
        y0 + (perpy * outerWeight));

    for (let i = 1; i < length - 1; ++i)
    {
        x0 = points[(i - 1) * 2];
        y0 = points[((i - 1) * 2) + 1];

        x1 = points[i * 2];
        y1 = points[(i * 2) + 1];

        x2 = points[(i + 1) * 2];
        y2 = points[((i + 1) * 2) + 1];

        perpx = -(y0 - y1);
        perpy = x0 - x1;

        dist = Math.sqrt((perpx * perpx) + (perpy * perpy));
        perpx /= dist;
        perpy /= dist;
        perpx *= width;
        perpy *= width;

        perp1x = -(y1 - y2);
        perp1y = x1 - x2;

        dist = Math.sqrt((perp1x * perp1x) + (perp1y * perp1y));
        perp1x /= dist;
        perp1y /= dist;
        perp1x *= width;
        perp1y *= width;

        /* d[x|y](0|1) = the component displacement between points p(0,1|1,2) */
        const dx0 = x1 - x0;
        const dy0 = y0 - y1;
        const dx1 = x1 - x2;
        const dy1 = y2 - y1;

        /* +ve if internal angle counterclockwise, -ve if internal angle clockwise. */
        const cross = (dy0 * dx1) - (dy1 * dx0);
        const clockwise = (cross < 0);

        /* Going nearly straight? */
        if (Math.abs(cross) < 0.1)
        {
            verts.push(
                x1 - (perpx * innerWeight),
                y1 - (perpy * innerWeight));
            verts.push(
                x1 + (perpx * outerWeight),
                y1 + (perpy * outerWeight));

            continue;
        }

        /* p[x|y] is the miter point. pdist is the distance between miter point and p1. */
        const c1 = ((-perpx + x0) * (-perpy + y1)) - ((-perpx + x1) * (-perpy + y0));
        const c2 = ((-perp1x + x2) * (-perp1y + y1)) - ((-perp1x + x1) * (-perp1y + y2));
        const px = ((dx0 * c2) - (dx1 * c1)) / cross;
        const py = ((dy1 * c1) - (dy0 * c2)) / cross;
        const pdist = ((px - x1) * (px - x1)) + ((py - y1) * (py - y1));

        /* Inner miter point */
        const imx = x1 + ((px - x1) * innerWeight);
        const imy = y1 + ((py - y1) * innerWeight);
        /* Outer miter point */
        const omx = x1 - ((px - x1) * outerWeight);
        const omy = y1 - ((py - y1) * outerWeight);

        /* Is the inside miter point too far away, creating a spike? */
        const smallerInsideSegmentSq = Math.min((dx0 * dx0) + (dy0 * dy0), (dx1 * dx1) + (dy1 * dy1));
        const insideWeight = clockwise ? innerWeight : outerWeight;
        const smallerInsideDiagonalSq = smallerInsideSegmentSq + (insideWeight * insideWeight * widthSquared);
        const insideMiterOk = pdist <= smallerInsideDiagonalSq;

        if (insideMiterOk)
        {
            if (style.join === 'bevel' || pdist / widthSquared > miterLimitSquared)
            {
                if (clockwise) /* rotating at inner angle */
                {
                    verts.push(imx, imy);// inner miter point
                    verts.push(x1 + (perpx * outerWeight), y1 + (perpy * outerWeight));// first segment's outer vertex
                    verts.push(imx, imy);// inner miter point
                    verts.push(x1 + (perp1x * outerWeight), y1 + (perp1y * outerWeight));// second segment's outer vertex
                }
                else /* rotating at outer angle */
                {
                    verts.push(x1 - (perpx * innerWeight), y1 - (perpy * innerWeight));// first segment's inner vertex
                    verts.push(omx, omy);// outer miter point
                    verts.push(x1 - (perp1x * innerWeight), y1 - (perp1y * innerWeight));// second segment's outer vertex
                    verts.push(omx, omy);// outer miter point
                }

                indexCount += 2;
            }
            else if (style.join === 'round')
            {
                if (clockwise) /* arc is outside */
                {
                    verts.push(imx, imy);
                    verts.push(x1 + (perpx * outerWeight), y1 + (perpy * outerWeight));

                    indexCount += round(
                        x1, y1,
                        x1 + (perpx * outerWeight), y1 + (perpy * outerWeight),
                        x1 + (perp1x * outerWeight), y1 + (perp1y * outerWeight),
                        verts, true
                    ) + 4;

                    verts.push(imx, imy);
                    verts.push(x1 + (perp1x * outerWeight), y1 + (perp1y * outerWeight));
                }
                else /* arc is inside */
                {
                    verts.push(x1 - (perpx * innerWeight), y1 - (perpy * innerWeight));
                    verts.push(omx, omy);

                    indexCount += round(
                        x1, y1,
                        x1 - (perpx * innerWeight), y1 - (perpy * innerWeight),
                        x1 - (perp1x * innerWeight), y1 - (perp1y * innerWeight),
                        verts, false
                    ) + 4;

                    verts.push(x1 - (perp1x * innerWeight), y1 - (perp1y * innerWeight));
                    verts.push(omx, omy);
                }
            }
            else
            {
                verts.push(imx, imy);
                verts.push(omx, omy);
            }
        }
        else // inside miter is NOT ok
        {
            verts.push(x1 - (perpx * innerWeight), y1 - (perpy * innerWeight)); // first segment's inner vertex
            verts.push(x1 + (perpx * outerWeight), y1 + (perpy * outerWeight)); // first segment's outer vertex
            if (style.join === 'bevel' || pdist / widthSquared > miterLimitSquared)
            {
                // Nothing needed
            }
            else if (style.join === 'round')
            {
                if (clockwise) /* arc is outside */
                {
                    indexCount += round(
                        x1, y1,
                        x1 + (perpx * outerWeight), y1 + (perpy * outerWeight),
                        x1 + (perp1x * outerWeight), y1 + (perp1y * outerWeight),
                        verts, true
                    ) + 2;
                }
                else /* arc is inside */
                {
                    indexCount += round(
                        x1, y1,
                        x1 - (perpx * innerWeight), y1 - (perpy * innerWeight),
                        x1 - (perp1x * innerWeight), y1 - (perp1y * innerWeight),
                        verts, false
                    ) + 2;
                }
            }
            else
            {
                if (clockwise)
                {
                    verts.push(omx, omy); // inner miter point
                    verts.push(omx, omy); // inner miter point
                }
                else
                {
                    verts.push(imx, imy); // outer miter point
                    verts.push(imx, imy); // outer miter point
                }
                indexCount += 2;
            }
            verts.push(x1 - (perp1x * innerWeight), y1 - (perp1y * innerWeight)); // second segment's inner vertex
            verts.push(x1 + (perp1x * outerWeight), y1 + (perp1y * outerWeight)); // second segment's outer vertex
            indexCount += 2;
        }
    }

    x0 = points[(length - 2) * 2];
    y0 = points[((length - 2) * 2) + 1];

    x1 = points[(length - 1) * 2];
    y1 = points[((length - 1) * 2) + 1];

    perpx = -(y0 - y1);
    perpy = x0 - x1;

    dist = Math.sqrt((perpx * perpx) + (perpy * perpy));
    perpx /= dist;
    perpy /= dist;
    perpx *= width;
    perpy *= width;

    verts.push(x1 - (perpx * innerWeight), y1 - (perpy * innerWeight));
    verts.push(x1 + (perpx * outerWeight), y1 + (perpy * outerWeight));

    if (!closedShape)
    {
        if (style.cap === 'round')
        {
            indexCount += round(
                x1 - (perpx * (innerWeight - outerWeight) * 0.5),
                y1 - (perpy * (innerWeight - outerWeight) * 0.5),
                x1 - (perpx * innerWeight),
                y1 - (perpy * innerWeight),
                x1 + (perpx * outerWeight),
                y1 + (perpy * outerWeight),
                verts,
                false
            ) + 2;
        }
        else if (style.cap === 'square')
        {
            indexCount += square(x1, y1, perpx, perpy, innerWeight, outerWeight, false, verts);
        }
    }

    const indices = geometry.indices;
    const eps2 = lineData.epsilon * lineData.epsilon;

    // indices.push(indexStart);
    for (let i = indexStart; i < indexCount + indexStart - 2; ++i)
    {
        x0 = verts[(i * 2)];
        y0 = verts[(i * 2) + 1];

        x1 = verts[(i + 1) * 2];
        y1 = verts[((i + 1) * 2) + 1];

        x2 = verts[(i + 2) * 2];
        y2 = verts[((i + 2) * 2) + 1];

        /* Skip zero area triangles */
        if (Math.abs((x0 * (y1 - y2)) + (x1 * (y2 - y0)) + (x2 * (y0 - y1))) < eps2)
        {
            continue;
        }

        indices.push(i, i + 1, i + 2);
    }

return geometry;
}

/**
 * 转换一条线条为一组线条构成的虚线条
 *
 * @param linePoints 线条顶点坐标列表
 * @param unit 虚线模式中单位长度，通常被设置为线条宽度
 * @param pattern 虚线模式
 * @returns 由一组线条构成的虚线条
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash
 */
function transformDashedLine(linePoints: number[], unit: number, pattern: number[] = [])
{
    if (!pattern || pattern.length === 0)
    {
        return [linePoints];
    }
    /**
     * 当前虚线条中线条数据
     */
    let currentStepDashedLinePoints: number[] = [linePoints[0], linePoints[1]];
    /**
     * 虚线条数据
     */
    const dashedLinePoints: number[][] = [currentStepDashedLinePoints];
    /**
     * 模式索引
     */
    let patternIndex = 0;
    /**
     * 是否为填充的部分
     */
    let isFill = true;
    /**
     * 当前模式宽度
     */
    let currentPartternWidth = pattern[0] * unit;
    /**
     * 当前节点
     */
    let currentPoint: [number, number] = [linePoints[0], linePoints[1]];

    for (let i = 2; i < linePoints.length; i += 2)
    {
        /**
         * 线段下个节点
         */
        const nextPoint: [number, number] = [linePoints[i], linePoints[i + 1]];
        /**
         * 当前线条宽度
         */
        const currentSegmentWidth = Math.sqrt(
            ((nextPoint[0] - currentPoint[0]) * (nextPoint[0] - currentPoint[0]))
            + ((nextPoint[1] - currentPoint[1]) * (nextPoint[1] - currentPoint[1]))
        );
        /**
         * 剩余线条宽度
         */
        let leftSegmentWidth = currentSegmentWidth;
        while (leftSegmentWidth > 0 && currentPartternWidth > 0)
        {
            if (currentPartternWidth > leftSegmentWidth)
            {
                if (isFill)
                {
                    currentStepDashedLinePoints.push(nextPoint[0], nextPoint[1]);
                }
                currentPartternWidth = currentPartternWidth - leftSegmentWidth;
                // 跳转到下个线段
                leftSegmentWidth = 0;
            }
 else if (currentPartternWidth === leftSegmentWidth)
            {
                if (isFill)
                {
                    currentStepDashedLinePoints.push(nextPoint[0], nextPoint[1]);
                }
                // 跳转到下个线段
                leftSegmentWidth = 0;
                // 跳转到下个模式
                isFill = !isFill;
                if (isFill)
                {
                    currentStepDashedLinePoints = [nextPoint[0], nextPoint[1]];
                    dashedLinePoints.push(currentStepDashedLinePoints);
                }
                currentPartternWidth = pattern[++patternIndex % pattern.length] * unit;
            }
 else
            {
                leftSegmentWidth = leftSegmentWidth - currentPartternWidth;
                /**
                 * 模式切割当前线段的位置
                 */
                const alpha = 1 - leftSegmentWidth / currentSegmentWidth;
                const alphaX = currentPoint[0] + (alpha * (nextPoint[0] - currentPoint[0]));
                const alphaY = currentPoint[1] + (alpha * (nextPoint[1] - currentPoint[1]));
                if (isFill)
                {
                    currentStepDashedLinePoints.push(alphaX, alphaY);
                }
                // 跳转到下个模式
                isFill = !isFill;
                if (isFill)
                {
                    currentStepDashedLinePoints = [alphaX, alphaY];
                    dashedLinePoints.push(currentStepDashedLinePoints);
                }
                currentPartternWidth = pattern[++patternIndex % pattern.length] * unit;
            }
        }
        currentPoint = nextPoint;
    }

return dashedLinePoints;
}

/**
 * Buffers vertices to draw a square cap.
 *
 * Ignored from docs since it is not directly exposed.
 *
 * @ignore
 * @private
 * @param {number} x - X-coord of end point
 * @param {number} y - Y-coord of end point
 * @param {number} nx - X-coord of line normal pointing inside
 * @param {number} ny - Y-coord of line normal pointing inside
 * @param {Array<number>} verts - vertex buffer
 * @returns {}
 */
function square(
    x: number,
    y: number,
    nx: number,
    ny: number,
    innerWeight: number,
    outerWeight: number,
    clockwise: boolean, /* rotation for square (true at left end, false at right end) */
    verts: Array<number>
): number
{
    const ix = x - (nx * innerWeight);
    const iy = y - (ny * innerWeight);
    const ox = x + (nx * outerWeight);
    const oy = y + (ny * outerWeight);

    /* Rotate nx,ny for extension vector */
    let exx; let
        eyy;

    if (clockwise)
    {
        exx = ny;
        eyy = -nx;
    }
    else
    {
        exx = -ny;
        eyy = nx;
    }

    /* [i|0]x,y extended at cap */
    const eix = ix + exx;
    const eiy = iy + eyy;
    const eox = ox + exx;
    const eoy = oy + eyy;

    /* Square itself must be inserted clockwise*/
    verts.push(eix, eiy);
    verts.push(eox, eoy);

    return 2;
}

/**
 * Buffers vertices to draw an arc at the line joint or cap.
 *
 * Ignored from docs since it is not directly exposed.
 *
 * @ignore
 * @private
 * @param {number} cx - X-coord of center
 * @param {number} cy - Y-coord of center
 * @param {number} sx - X-coord of arc start
 * @param {number} sy - Y-coord of arc start
 * @param {number} ex - X-coord of arc end
 * @param {number} ey - Y-coord of arc end
 * @param {Array<number>} verts - buffer of vertices
 * @param {boolean} clockwise - orientation of vertices
 * @returns {number} - no. of vertices pushed
 */
function round(
    cx: number,
    cy: number,
    sx: number,
    sy: number,
    ex: number,
    ey: number,
    verts: Array<number>,
    clockwise: boolean, /* if not cap, then clockwise is turn of joint, otherwise rotation from angle0 to angle1 */
): number
{
    const cx2p0x = sx - cx;
    const cy2p0y = sy - cy;

    let angle0 = Math.atan2(cx2p0x, cy2p0y);
    let angle1 = Math.atan2(ex - cx, ey - cy);

    if (clockwise && angle0 < angle1)
    {
        angle0 += Math.PI * 2;
    }
    else if (!clockwise && angle0 > angle1)
    {
        angle1 += Math.PI * 2;
    }

    let startAngle = angle0;
    const angleDiff = angle1 - angle0;
    const absAngleDiff = Math.abs(angleDiff);

    /* if (absAngleDiff >= PI_LBOUND && absAngleDiff <= PI_UBOUND)
    {
        const r1x = cx - nxtPx;
        const r1y = cy - nxtPy;

        if (r1x === 0)
        {
            if (r1y > 0)
            {
                angleDiff = -angleDiff;
            }
        }
        else if (r1x >= -GRAPHICS_CURVES.epsilon)
        {
            angleDiff = -angleDiff;
        }
    }*/

    const radius = Math.sqrt((cx2p0x * cx2p0x) + (cy2p0y * cy2p0y));
    const segCount = ((15 * absAngleDiff * Math.sqrt(radius) / Math.PI) >> 0) + 1;
    const angleInc = angleDiff / segCount;

    startAngle += angleInc;

    if (clockwise)
    {
        verts.push(cx, cy);
        verts.push(sx, sy);

        for (let i = 1, angle = startAngle; i < segCount; i++, angle += angleInc)
        {
            verts.push(cx, cy);
            verts.push(cx + ((Math.sin(angle) * radius)),
                cy + ((Math.cos(angle) * radius)));
        }

        verts.push(cx, cy);
        verts.push(ex, ey);
    }
    else
    {
        verts.push(sx, sy);
        verts.push(cx, cy);

        for (let i = 1, angle = startAngle; i < segCount; i++, angle += angleInc)
        {
            verts.push(cx + ((Math.sin(angle) * radius)),
                cy + ((Math.cos(angle) * radius)));
            verts.push(cx, cy);
        }

        verts.push(ex, ey);
        verts.push(cx, cy);
    }

    return segCount * 2;
}

/**
 * Represents the line style for Graphics.
 */
interface LineStyle
{
    /**
     * The width (thickness) of any lines drawn.
     *
     * @default 1
     */
    width?: number;

    /**
     * The alignment of any lines drawn (0.5 = middle, 1 = outer, 0 = inner). WebGL only.
     *
     * @default 0.5
     */
    alignment?: number;

    /**
     * Line cap style.
     *
     * 'butt': don't add any cap at line ends (leaves orthogonal edges)
     *
     * 'round': add semicircle at ends
     *
     * 'square': add square at end (like `BUTT` except more length at end)
     *
     * @default  'butt'
     */
    cap?: 'butt' | 'round' | 'square';

    /**
     * Line join style.
     *
     * 'miter': make a sharp corner where outer part of lines meet
     *
     * 'bevel': add a square butt at each end of line segment and fill the triangle at turn
     *
     * 'round': add an arc at the joint
     *
     * @default 'miter'
     *
     * @see https://graphicdesign.stackexchange.com/questions/59018/what-is-a-bevel-join-of-two-lines-exactly-illustrator
     */
    join?: 'miter' | 'bevel' | 'round';

    /**
     * Miter limit.
     *
     * @default 10
     */
    miterLimit?: number;

    /**
     * 虚线模式中单位长度，通常被设置为线条宽度
     *
     * @default 1
     */
    dashedLinePatternUnit?: number;

    /**
     * 虚线模式
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash
     */
    dashedLinePattern?: number[];
}
