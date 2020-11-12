namespace feng3d
{
	export class CubicBezierCurve2 extends Curve<Vector2>
	{
		v0: Vector2;
		v1: Vector2;
		v2: Vector2;
		v3: Vector2;

		constructor(v0 = new Vector2(), v1 = new Vector2(), v2 = new Vector2(), v3 = new Vector2())
		{
			super();

			this.v0 = v0;
			this.v1 = v1;
			this.v2 = v2;
			this.v3 = v3;
		}

		getPoint(t: number, optionalTarget = new Vector2())
		{
			const point = optionalTarget;

			const v0 = this.v0, v1 = this.v1, v2 = this.v2, v3 = this.v3;

			point.set(
				Interpolations.CubicBezier(t, v0.x, v1.x, v2.x, v3.x),
				Interpolations.CubicBezier(t, v0.y, v1.y, v2.y, v3.y)
			);
			return point;
		}
	}
}



