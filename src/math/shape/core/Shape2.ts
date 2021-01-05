namespace feng3d
{
	export class Shape2 extends Path2
	{
		holes: Path2[];

		constructor(points?: Vector2[])
		{
			super(points);

			this.holes = [];
		}

		getPointsHoles(divisions: number)
		{
			const holesPts: Vector2[][] = [];
			for (let i = 0, l = this.holes.length; i < l; i++)
			{
				holesPts[i] = this.holes[i].getPoints(divisions);
			}
			return holesPts;
		}

		// get points of shape and holes (keypoints based on segments parameter)
		extractPoints(divisions: number)
		{
			return {
				shape: this.getPoints(divisions),
				holes: this.getPointsHoles(divisions)
			};
		}

	}
}


