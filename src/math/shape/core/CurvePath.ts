namespace feng3d
{
	/**
	 * Curved Path - a curve path is simply a array of connected
	 * curves, but retains the api of a curve
	 */
	export class CurvePath<T extends Vector> extends Curve<T>
	{
		curves: Curve<T>[] = [];
		autoClose = false; // Automatically closes the path
		cacheLengths: number[];

		add(curve: Curve<T>)
		{
			this.curves.push(curve);
		}

		closePath()
		{
			// Add a line curve if start and end of lines are not connected
			const startPoint = this.curves[0].getPoint(0);
			const endPoint = this.curves[this.curves.length - 1].getPoint(1);

			if (!startPoint.equals(endPoint))
			{
				this.curves.push(<any>new LineCurve2(<any>endPoint, <any>startPoint));
			}
		}

		// To get accurate point with reference to
		// entire path distance at time t,
		// following has to be done:

		// 1. Length of each sub path have to be known
		// 2. Locate and identify type of curve
		// 3. Get t for the curve
		// 4. Return curve.getPointAt(t')

		getPoint(t: number)
		{
			const d = t * this.getLength();
			const curveLengths = this.getCurveLengths();
			let i = 0;

			// To think about boundaries points.
			while (i < curveLengths.length)
			{
				if (curveLengths[i] >= d)
				{
					const diff = curveLengths[i] - d;
					const curve = this.curves[i];

					const segmentLength = curve.getLength();
					const u = segmentLength === 0 ? 0 : 1 - diff / segmentLength;

					return curve.getPointAt(u);
				}
				i++;
			}
			return null;			// loop where sum != 0, sum > d , sum+1 <d
		}

		// We cannot use the default THREE.Curve getPoint() with getLength() because in
		// THREE.Curve, getLength() depends on getPoint() but in THREE.CurvePath
		// getPoint() depends on getLength

		getLength()
		{
			const lens = this.getCurveLengths();
			return lens[lens.length - 1];
		}

		// cacheLengths must be recalculated.
		updateArcLengths()
		{
			this.needsUpdate = true;
			this.cacheLengths = null;
			this.getCurveLengths();
		}

		// Compute lengths and cache them
		// We cannot overwrite getLengths() because UtoT mapping uses it.
		getCurveLengths()
		{
			// We use cache values if curves and cache array are same length
			if (this.cacheLengths && this.cacheLengths.length === this.curves.length)
			{
				return this.cacheLengths;
			}

			// Get length of sub-curve
			// Push sums into cached array
			const lengths: number[] = [];
			let sums = 0;

			for (let i = 0, l = this.curves.length; i < l; i++)
			{
				sums += this.curves[i].getLength();
				lengths.push(sums);
			}
			this.cacheLengths = lengths;
			return lengths;
		}

		getSpacedPoints(divisions = 40)
		{
			const points: T[] = [];

			for (let i = 0; i <= divisions; i++)
			{
				points.push(this.getPoint(i / divisions));
			}

			if (this.autoClose)
			{
				points.push(points[0]);
			}
			return points;
		}

		getPoints(divisions = 12)
		{
			const points: T[] = [];
			let last: T;
			for (let i = 0, curves = this.curves; i < curves.length; i++)
			{
				const curve = curves[i];
				const resolution = curve.getResolution(divisions);
				const pts = curve.getPoints(resolution);
				for (let j = 0; j < pts.length; j++)
				{
					const point = pts[j];
					if (last && last.equals(point)) continue; // ensures no consecutive points are duplicates
					points.push(point);
					last = point;
				}
			}

			if (this.autoClose && points.length > 1 && !points[points.length - 1].equals(points[0]))
			{
				points.push(points[0]);
			}

			return points;
		}
	}
}