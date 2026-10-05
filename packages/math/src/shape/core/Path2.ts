import type { Vector2Like, WritableVector2Like } from '../../geom/vector2';
import { vec2Copy, vec2Equals, vec2From } from '../../geom/vector2';
import { CubicBezierCurve2 } from '../curves/CubicBezierCurve2';
import { EllipseCurve2 } from '../curves/EllipseCurve2';
import { LineCurve2 } from '../curves/LineCurve2';
import { QuadraticBezierCurve2 } from '../curves/QuadraticBezierCurve2';
import { SplineCurve2 } from '../curves/SplineCurve2';
import { CurvePath } from './CurvePath';

export class Path2 extends CurvePath<Vector2Like>
{
    // 阶段 C-f：原 `Vector2` 的 class 已删除，`currentPoint` 是纯粹的可写数据槽
    currentPoint: WritableVector2Like;

    constructor(points?: Vector2Like[])
    {
        super();
        this.currentPoint = { x: 0, y: 0 };
        if (points)
        {
            this.fromPoints(points);
        }
    }

    fromPoints(points: Vector2Like[])
    {
        this.moveTo(points[0].x, points[0].y);
        for (let i = 1, l = points.length; i < l; i++)
        {
            this.lineTo(points[i].x, points[i].y);
        }

        return this;
    }

    moveTo(x: number, y: number)
    {
        vec2From(x, y, this.currentPoint); // TODO consider referencing vectors instead of copying?

        return this;
    }

    lineTo(x: number, y: number)
    {
        const curve = new LineCurve2(vec2Copy(this.currentPoint), vec2From(x, y));

        this.curves.push(curve);

        vec2From(x, y, this.currentPoint);

        return this;
    }

    quadraticCurveTo(aCPx: number, aCPy: number, aX: number, aY: number)
    {
        const curve = new QuadraticBezierCurve2(
            vec2Copy(this.currentPoint),
            vec2From(aCPx, aCPy),
            vec2From(aX, aY)
        );

        this.curves.push(curve);

        vec2From(aX, aY, this.currentPoint);

        return this;
    }

    bezierCurveTo(aCP1x: number, aCP1y: number, aCP2x: number, aCP2y: number, aX: number, aY: number)
    {
        const curve = new CubicBezierCurve2(
            vec2Copy(this.currentPoint),
            vec2From(aCP1x, aCP1y),
            vec2From(aCP2x, aCP2y),
            vec2From(aX, aY)
        );

        this.curves.push(curve);

        vec2From(aX, aY, this.currentPoint);

        return this;
    }

    splineThru(pts: Vector2Like[])
    {
        const npts = [vec2Copy(this.currentPoint)].concat(pts);

        const curve = new SplineCurve2(npts);

        this.curves.push(curve);

        vec2Copy(pts[pts.length - 1], this.currentPoint);

        return this;
    }

    arc(aX = 0, aY = 0, aRadius = 1, aStartAngle = 0, aEndAngle = 2 * Math.PI, aClockwise = false)
    {
        const x0 = this.currentPoint.x;
        const y0 = this.currentPoint.y;

        this.absarc(aX + x0, aY + y0, aRadius,
            aStartAngle, aEndAngle, aClockwise);

        return this;
    }

    absarc(aX = 0, aY = 0, aRadius = 1, aStartAngle = 0, aEndAngle = 2 * Math.PI, aClockwise = false)
    {
        this.absellipse(aX, aY, aRadius, aRadius, aStartAngle, aEndAngle, aClockwise);

        return this;
    }

    ellipse(aX = 0, aY = 0, xRadius = 1, yRadius = 1, aStartAngle = 0, aEndAngle = 2 * Math.PI, aClockwise = false, aRotation = 0)
    {
        const x0 = this.currentPoint.x;
        const y0 = this.currentPoint.y;

        this.absellipse(aX + x0, aY + y0, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise, aRotation);

        return this;
    }

    absellipse(aX = 0, aY = 0, xRadius = 1, yRadius = 1, aStartAngle = 0, aEndAngle = 2 * Math.PI, aClockwise = false, aRotation = 0)
    {
        const curve = new EllipseCurve2(aX, aY, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise, aRotation);

        if (this.curves.length > 0)
        {
            // if a previous curve is present, attempt to join
            const firstPoint = curve.getPoint(0);

            if (!vec2Equals(firstPoint, this.currentPoint))
            {
                this.lineTo(firstPoint.x, firstPoint.y);
            }
        }

        this.curves.push(curve);

        const lastPoint = curve.getPoint(1);

        vec2Copy(lastPoint, this.currentPoint);

        return this;
    }
}
