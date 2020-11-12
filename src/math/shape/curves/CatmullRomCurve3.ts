namespace feng3d
{

	/**
	 * Centripetal CatmullRom Curve - which is useful for avoiding
	 * cusps and self-intersections in non-uniform catmull rom curves.
	 * http://www.cemyuksel.com/research/catmullrom_param/catmullrom.pdf
	 *
	 * curve.type accepts centripetal(default), chordal and catmullrom
	 * curve.tension is used for catmullrom which defaults to 0.5
	 */
	export class CatmullRomCurve3 extends Curve<Vector3>
	{
		isCatmullRomCurve3 = true;

		points: Vector3[];
		closed: boolean;
		curveType: string;
		tension: number;

		constructor(points: Vector3[] = [], closed = false, curveType = 'centripetal', tension = 0.5)
		{
			super();

			this.points = points;
			this.closed = closed;
			this.curveType = curveType;
			this.tension = tension;
		}

		getPoint(t: number, optionalTarget = new Vector3())
		{
			const point = optionalTarget;

			const points = this.points;
			const l = points.length;

			const p = (l - (this.closed ? 0 : 1)) * t;
			let intPoint = Math.floor(p);
			let weight = p - intPoint;

			if (this.closed)
			{
				intPoint += intPoint > 0 ? 0 : (Math.floor(Math.abs(intPoint) / l) + 1) * l;

			} else if (weight === 0 && intPoint === l - 1)
			{
				intPoint = l - 2;
				weight = 1;
			}

			let p0: Vector3, p3: Vector3; // 4 points (p1 & p2 defined below)

			if (this.closed || intPoint > 0)
			{
				p0 = points[(intPoint - 1) % l];
			} else
			{
				// extrapolate first point
				tmp.copy(points[0]).sub(points[1]).add(points[0]);
				p0 = tmp;
			}

			const p1 = points[intPoint % l];
			const p2 = points[(intPoint + 1) % l];

			if (this.closed || intPoint + 2 < l)
			{
				p3 = points[(intPoint + 2) % l];
			} else
			{
				// extrapolate last point
				tmp.copy(points[l - 1]).sub(points[l - 2]).add(points[l - 1]);
				p3 = tmp;
			}

			if (this.curveType === 'centripetal' || this.curveType === 'chordal')
			{
				// init Centripetal / Chordal Catmull-Rom
				const pow = this.curveType === 'chordal' ? 0.5 : 0.25;
				let dt0 = Math.pow(p0.distanceSquared(p1), pow);
				let dt1 = Math.pow(p1.distanceSquared(p2), pow);
				let dt2 = Math.pow(p2.distanceSquared(p3), pow);

				// safety check for repeated points
				if (dt1 < 1e-4) dt1 = 1.0;
				if (dt0 < 1e-4) dt0 = dt1;
				if (dt2 < 1e-4) dt2 = dt1;

				px.initNonuniformCatmullRom(p0.x, p1.x, p2.x, p3.x, dt0, dt1, dt2);
				py.initNonuniformCatmullRom(p0.y, p1.y, p2.y, p3.y, dt0, dt1, dt2);
				pz.initNonuniformCatmullRom(p0.z, p1.z, p2.z, p3.z, dt0, dt1, dt2);

			} else if (this.curveType === 'catmullrom')
			{
				px.initCatmullRom(p0.x, p1.x, p2.x, p3.x, this.tension);
				py.initCatmullRom(p0.y, p1.y, p2.y, p3.y, this.tension);
				pz.initCatmullRom(p0.z, p1.z, p2.z, p3.z, this.tension);
			}

			point.set(
				px.calc(weight),
				py.calc(weight),
				pz.calc(weight)
			);

			return point;
		}
	}

	/*
	Based on an optimized c++ solution in
	 - http://stackoverflow.com/questions/9489736/catmull-rom-curve-with-no-cusps-and-no-self-intersections/
	 - http://ideone.com/NoEbVM
	
	This CubicPoly class could be used for reusing some variables and calculations,
	but for three.js curve use, it could be possible inlined and flatten into a single function call
	which can be placed in CurveUtils.
	*/
	class CubicPoly
	{
		c0 = 0;
		c1 = 0;
		c2 = 0;
		c3 = 0;

		/*
		 * Compute coefficients for a cubic polynomial
		 *   p(s) = c0 + c1*s + c2*s^2 + c3*s^3
		 * such that
		 *   p(0) = x0, p(1) = x1
		 *  and
		 *   p'(0) = t0, p'(1) = t1.
		 */
		init(x0: number, x1: number, t0: number, t1: number)
		{
			this.c0 = x0;
			this.c1 = t0;
			this.c2 = - 3 * x0 + 3 * x1 - 2 * t0 - t1;
			this.c3 = 2 * x0 - 2 * x1 + t0 + t1;
		}

		initCatmullRom(x0: number, x1: number, x2: number, x3: number, tension: number)
		{
			this.init(x1, x2, tension * (x2 - x0), tension * (x3 - x1));
		}

		initNonuniformCatmullRom(x0: number, x1: number, x2: number, x3: number, dt0: number, dt1: number, dt2: number)
		{
			// compute tangents when parameterized in [t1,t2]
			let t1 = (x1 - x0) / dt0 - (x2 - x0) / (dt0 + dt1) + (x2 - x1) / dt1;
			let t2 = (x2 - x1) / dt1 - (x3 - x1) / (dt1 + dt2) + (x3 - x2) / dt2;

			// rescale tangents for parametrization in [0,1]
			t1 *= dt1;
			t2 *= dt1;

			this.init(x1, x2, t1, t2);
		}

		calc(t: number)
		{
			const t2 = t * t;
			const t3 = t2 * t;
			return this.c0 + this.c1 * t + this.c2 * t2 + this.c3 * t3;
		}
	}

	//
	const tmp = new Vector3();
	const px = new CubicPoly(), py = new CubicPoly(), pz = new CubicPoly();
}