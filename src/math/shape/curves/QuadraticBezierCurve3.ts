namespace feng3d
{
	export class QuadraticBezierCurve3 extends Curve<Vector3>
	{
		v0: Vector3;
		v1: Vector3;
		v2: Vector3;

		constructor(v0 = new Vector3(), v1 = new Vector3(), v2 = new Vector3())
		{
			super();

			this.v0 = v0;
			this.v1 = v1;
			this.v2 = v2;

		}

		getPoint(t: number, optionalTarget = new Vector3())
		{

			const point = optionalTarget;

			const v0 = this.v0, v1 = this.v1, v2 = this.v2;

			point.set(
				Interpolations.QuadraticBezier(t, v0.x, v1.x, v2.x),
				Interpolations.QuadraticBezier(t, v0.y, v1.y, v2.y),
				Interpolations.QuadraticBezier(t, v0.z, v1.z, v2.z)
			);

			return point;

		}
	}
}


