namespace feng3d
{
	export class ArcCurve2 extends EllipseCurve2
	{
		constructor(aX = 0, aY = 0, aRadius = 1, aStartAngle = 0, aEndAngle = 2 * Math.PI, aClockwise = false)
		{
			super(aX, aY, aRadius, aRadius, aStartAngle, aEndAngle, aClockwise);
		}
	}
}