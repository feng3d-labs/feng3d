namespace feng3d
{
	export class QuadraticBezierCurve2 extends Curve<Vector2>
	{
		v0: Vector2;
		v1: Vector2;
		v2: Vector2;

		constructor(v0 = new Vector2(), v1 = new Vector2(), v2 = new Vector2())
		{
			super();

			this.v0 = v0;
			this.v1 = v1;
			this.v2 = v2;
		}

		getPoint(t: number, optionalTarget = new Vector2())
		{
			const point = optionalTarget;
			const v0 = this.v0, v1 = this.v1, v2 = this.v2;

			point.set(
				Interpolations.QuadraticBezier(t, v0.x, v1.x, v2.x),
				Interpolations.QuadraticBezier(t, v0.y, v1.y, v2.y)
			);

			return point;
		}


	}
}



