namespace feng3d
{
	/**
	 * An extensible curve object which contains methods for interpolation
	 */
	export class Curve<T extends Vector>
	{
		/**
		 * This value determines the amount of divisions when calculating the cumulative segment lengths of a curve via .getLengths.
		 * To ensure precision when using methods like .getSpacedPoints, it is recommended to increase .arcLengthDivisions if the curve is very large.
		 */
		arcLengthDivisions = 200;

		needsUpdate = false;

		cacheArcLengths: number[];

		getResolution(divisions: number): number
		{
			return divisions;
		}

		/**
		 * Virtual base class method to overwrite and implement in subclasses
		 * 
		 * - t [0 .. 1]
		 * Returns a vector for point t of the curve where t is between 0 and 1
		 */
		getPoint(t?: number, optionalTarget?: T): T
		{
			console.warn('THREE.Curve: .getPoint() not implemented.');
			return null;
		}

		/**
		 * Get point at relative position in curve according to arc length
		 * Returns a vector for point at relative position in curve according to arc length
		 * 
		 * @param u [0 .. 1]
		 * @param optionalTarget 
		 */
		getPointAt(u: number, optionalTarget?: T)
		{
			const t = this.getUtoTmapping(u);
			return this.getPoint(t, optionalTarget);
		}

		/**
		 * Get sequence of points using getPoint( t )
		 */
		getPoints(divisions = 5)
		{
			const points: T[] = [];

			for (let d = 0; d <= divisions; d++)
			{
				points.push(this.getPoint(d / divisions));
			}
			return points;
		}

		/**
		 * Get sequence of equi-spaced points using getPointAt( u )
		 */
		getSpacedPoints(divisions: number)
		{
			if (divisions === undefined) divisions = 5;
			const points = [];
			for (let d = 0; d <= divisions; d++)
			{
				points.push(this.getPointAt(d / divisions));
			}
			return points;
		}

		/**
		 * Get total curve arc length
		 */
		getLength()
		{
			const lengths = this.getLengths();
			return lengths[lengths.length - 1];
		}

		/**
		 * Get list of cumulative segment lengths
		 */
		getLengths(divisions?: number)
		{
			if (divisions === undefined) divisions = this.arcLengthDivisions;

			if (this.cacheArcLengths && (this.cacheArcLengths.length === divisions + 1) && !this.needsUpdate)
			{
				return this.cacheArcLengths;
			}

			this.needsUpdate = false;

			const cache: number[] = [];
			let current: T, last = this.getPoint(0);
			let sum = 0;

			cache.push(0);

			for (let p = 1; p <= divisions; p++)
			{
				current = this.getPoint(p / divisions);
				sum += current.distance(last);
				cache.push(sum);
				last = current;
			}

			this.cacheArcLengths = cache;

			return cache;
		}

		/**
		 * Update the cumlative segment distance cache
		 */
		updateArcLengths()
		{
			this.needsUpdate = true;
			this.getLengths();
		}

		/**
		 * Given u ( 0 .. 1 ), get a t to find p. This gives you points which are equi distance
		 */
		getUtoTmapping(u: number, distance?: number)
		{
			const arcLengths = this.getLengths();

			let i = 0;
			const il = arcLengths.length;

			let targetArcLength: number; // The targeted u distance value to get

			if (distance)
			{
				targetArcLength = distance;
			} else
			{
				targetArcLength = u * arcLengths[il - 1];
			}

			// binary search for the index with largest value smaller than target u distance
			let low = 0, high = il - 1, comparison;

			while (low <= high)
			{
				i = Math.floor(low + (high - low) / 2); // less likely to overflow, though probably not issue here, JS doesn't really have integers, all numbers are floats
				comparison = arcLengths[i] - targetArcLength;
				if (comparison < 0)
				{
					low = i + 1;
				} else if (comparison > 0)
				{
					high = i - 1;
				} else
				{
					high = i;
					break;
				}
			}

			i = high;

			if (arcLengths[i] === targetArcLength)
			{
				return i / (il - 1);
			}

			// we could get finer grain at lengths, or use simple interpolation between two points
			const lengthBefore = arcLengths[i];
			const lengthAfter = arcLengths[i + 1];

			const segmentLength = lengthAfter - lengthBefore;

			// determine where we are between the 'before' and 'after' points
			const segmentFraction = (targetArcLength - lengthBefore) / segmentLength;

			// add that fractional amount to t
			const t = (i + segmentFraction) / (il - 1);
			return t;
		}

		/**
		 * Returns a unit vector tangent at t. If the subclassed curve do not implement its tangent derivation, 2 points a small delta apart will be used to find its gradient which seems to give a reasonable approximation
		 * getTangent(t: number, optionalTarget?: T): T;
		 */
		getTangent(t: number, optionalTarget: T): T
		{
			const delta = 0.0001;
			let t1 = t - delta;
			let t2 = t + delta;

			// Capping in case of danger

			if (t1 < 0) t1 = 0;
			if (t2 > 1) t2 = 1;

			const pt1 = this.getPoint(t1);
			const pt2 = this.getPoint(t2);

			const tangent = optionalTarget;

			tangent.copy(pt2).sub(pt1).normalize();

			return tangent;
		}

		/**
		 * Returns tangent at equidistance point u on the curve
		 * getTangentAt(u: number, optionalTarget?: T): T;
		 */
		getTangentAt(u: number, optionalTarget: T)
		{
			const t = this.getUtoTmapping(u);
			return this.getTangent(t, optionalTarget);
		}

		computeFrenetFrames(segments: number, closed: boolean)
		{
			// see http://www.cs.indiana.edu/pub/techreports/TR425.pdf

			const normal = new Vector3();

			const tangents: Vector3[] = [];
			const normals: Vector3[] = [];
			const binormals: Vector3[] = [];

			const vec = new Vector3();
			const mat = new Matrix4x4();

			// compute the tangent vectors for each segment on the curve

			let curve3: Curve<Vector3> = <any>this;
			for (let i = 0; i <= segments; i++)
			{
				const u = i / segments;

				tangents[i] = curve3.getTangentAt(u, new Vector3());
				tangents[i].normalize();
			}

			// select an initial normal vector perpendicular to the first tangent vector,
			// and in the direction of the minimum tangent xyz component
			normals[0] = new Vector3();
			binormals[0] = new Vector3();
			let min = Number.MAX_VALUE;
			const tx = Math.abs(tangents[0].x);
			const ty = Math.abs(tangents[0].y);
			const tz = Math.abs(tangents[0].z);

			if (tx <= min)
			{
				min = tx;
				normal.set(1, 0, 0);
			}

			if (ty <= min)
			{
				min = ty;
				normal.set(0, 1, 0);
			}

			if (tz <= min)
			{
				normal.set(0, 0, 1);
			}

			tangents[0].crossTo(normal, vec).normalize();
			tangents[0].crossTo(vec, normals[0]);
			tangents[0].crossTo(normals[0], binormals[0]);

			// compute the slowly-varying normal and binormal vectors for each segment on the curve
			for (let i = 1; i <= segments; i++)
			{
				normals[i] = normals[i - 1].clone();
				binormals[i] = binormals[i - 1].clone();
				tangents[i - 1].crossTo(tangents[i], vec);

				if (vec.length > Number.EPSILON)
				{
					vec.normalize();

					const theta = Math.acos(Math.clamp(tangents[i - 1].dot(tangents[i]), - 1, 1)); // clamp for floating pt errors
					mat.fromAxisRotate(vec, theta * Math.RAD2DEG);
					mat.transformPoint3(normals[i], normals[i]);
				}

				tangents[i].crossTo(normals[i], binormals[i]);
			}

			// if the curve is closed, postprocess the vectors so the first and last normal vectors are the same

			if (closed === true)
			{
				let theta = Math.acos(Math.clamp(normals[0].dot(normals[segments]), - 1, 1));
				theta /= segments;

				if (tangents[0].dot(normals[0].crossTo(normals[segments], vec)) > 0)
				{
					theta = - theta;
				}

				for (let i = 1; i <= segments; i++)
				{
					// twist a little...
					mat.fromAxisRotate(tangents[i], theta * i * Math.RAD2DEG).transformPoint3(normals[i], normals[i]);
					tangents[i].crossTo(normals[i], binormals[i]);
				}
			}

			return {
				tangents: tangents,
				normals: normals,
				binormals: binormals
			};
		}
	}
}