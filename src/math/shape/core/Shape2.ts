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

		extractArray(divisions?: number)
		{
			const result = this.extractPoints(divisions);
			// 
			const points = result.shape.reduce((pv: number[], cv) => { pv.push(cv.x, cv.y); return pv; }, []);
			const holes = result.holes.reduce((pv: number[][], cv) =>
			{
				const arr = cv.reduce((pv1: number[], cv1) =>
				{
					pv1.push(cv1.x, cv1.y); return pv1;
				}, []); pv.push(arr); return pv;
			}, []);

			return { points: points, holes: holes };
		}

		triangulate(geometry: { points: number[], indices: number[] } = { points: [], indices: [] })
		{
			const result = this.extractArray();
			//
			Shape2.triangulate(result.points, result.holes, geometry);
			return geometry;
		}

		static triangulate(points: number[], holes: number[][] = [], geometry: { points: number[], indices: number[] } = { points: [], indices: [] })
		{
			const verts = geometry.points;
			const indices = geometry.indices;

			if (points.length >= 6)
			{
				const holeArray: number[] = [];
				// Process holes..

				for (let i = 0; i < holes.length; i++)
				{
					const hole = holes[i];

					holeArray.push(points.length / 2);
					points = points.concat(hole);
				}

				// sort color
				const triangles = Earcut.triangulate(points, holeArray, 2);

				if (!triangles)
				{
					return;
				}

				const vertPos = verts.length / 2;

				for (let i = 0; i < triangles.length; i += 3)
				{
					indices.push(triangles[i] + vertPos);
					indices.push(triangles[i + 1] + vertPos);
					indices.push(triangles[i + 2] + vertPos);
				}

				for (let i = 0; i < points.length; i++)
				{
					verts.push(points[i]);
				}
			}
			return geometry;
		}
	}
}


