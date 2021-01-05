namespace feng3d
{
    export class Path2 extends CurvePath<Vector2>
    {
        currentPoint: Vector2;

        constructor(points?: Vector2[])
        {
            super();
            this.currentPoint = new Vector2();
            if (points)
            {
                this.setFromPoints(points);
            }
        }

        setFromPoints(points: Vector2[])
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
            this.currentPoint.set(x, y); // TODO consider referencing vectors instead of copying?
            return this;
        }

        lineTo(x: number, y: number)
        {
            const curve = new LineCurve2(this.currentPoint.clone(), new Vector2(x, y));
            this.curves.push(curve);

            this.currentPoint.set(x, y);

            return this;
        }

        quadraticCurveTo(aCPx: number, aCPy: number, aX: number, aY: number)
        {
            const curve = new QuadraticBezierCurve2(
                this.currentPoint.clone(),
                new Vector2(aCPx, aCPy),
                new Vector2(aX, aY)
            );

            this.curves.push(curve);

            this.currentPoint.set(aX, aY);

            return this;
        }

        bezierCurveTo(aCP1x: number, aCP1y: number, aCP2x: number, aCP2y: number, aX: number, aY: number)
        {
            const curve = new CubicBezierCurve2(
                this.currentPoint.clone(),
                new Vector2(aCP1x, aCP1y),
                new Vector2(aCP2x, aCP2y),
                new Vector2(aX, aY)
            );

            this.curves.push(curve);

            this.currentPoint.set(aX, aY);

            return this;
        }

        splineThru(pts: Vector2[])
        {
            const npts = [this.currentPoint.clone()].concat(pts);

            const curve = new SplineCurve2(npts);
            this.curves.push(curve);

            this.currentPoint.copy(pts[pts.length - 1]);

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

                if (!firstPoint.equals(this.currentPoint))
                {
                    this.lineTo(firstPoint.x, firstPoint.y);
                }
            }

            this.curves.push(curve);

            const lastPoint = curve.getPoint(1);
            this.currentPoint.copy(lastPoint);

            return this;
        }
    }
}