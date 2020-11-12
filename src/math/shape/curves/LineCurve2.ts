namespace feng3d
{
	export class LineCurve2 extends Curve<Vector2>
	{
		v1: Vector2;
		v2: Vector2;

		constructor(v1 = new Vector2(), v2 = new Vector2())
		{
			super();
			this.v1 = v1;
			this.v2 = v2;
		}
		
		getResolution(divisions: number): number
		{
			return 1;
		}
		
		getPoint(t: number, optionalTarget: Vector2)
		{
			const point = optionalTarget || new Vector2();

			if (t === 1)
			{
				point.copy(this.v2);
			} else
			{
				point.copy(this.v2).sub(this.v1);
				point.scaleNumber(t).add(this.v1);
			}

			return point;
		}

		// Line curve is linear, so we can overwrite default getPointAt
		getPointAt(u: number, optionalTarget: Vector2)
		{
			return this.getPoint(u, optionalTarget);
		}

		getTangent(t: number, optionalTarget = new Vector2())
		{
			const tangent = optionalTarget;
			tangent.copy(this.v2).sub(this.v1).normalize();
			return tangent;
		}
	}
}
