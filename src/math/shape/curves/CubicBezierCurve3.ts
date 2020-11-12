namespace feng3d
{
	export class CubicBezierCurve3 extends Curve<Vector3>
	{
		v0: Vector3;
		v1: Vector3;
		v2: Vector3;
		v3: Vector3;

		constructor(v0 = new Vector3(), v1 = new Vector3(), v2 = new Vector3(), v3 = new Vector3())
		{
			super();

			this.v0 = v0;
			this.v1 = v1;
			this.v2 = v2;
			this.v3 = v3;
		}

		getPoint(t: number, optionalTarget = new Vector3())
		{
			const point = optionalTarget;

			const v0 = this.v0, v1 = this.v1, v2 = this.v2, v3 = this.v3;

			point.set(
				Interpolations.CubicBezier(t, v0.x, v1.x, v2.x, v3.x),
				Interpolations.CubicBezier(t, v0.y, v1.y, v2.y, v3.y),
				Interpolations.CubicBezier(t, v0.z, v1.z, v2.z, v3.z)
			);

			return point;
		}
	}
}
