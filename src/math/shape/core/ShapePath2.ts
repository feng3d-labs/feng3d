namespace feng3d
{
	export class ShapePath2
	{
		color = new Color4();
		subPaths: Path2[] = [];
		currentPath: Path2;

		constructor()
		{
			this.subPaths = [];
			this.currentPath = null;
		}

		moveTo(x: number, y: number)
		{
			this.currentPath = new Path2();
			this.subPaths.push(this.currentPath);
			this.currentPath.moveTo(x, y);
			return this;
		}

		lineTo(x: number, y: number)
		{
			this.currentPath.lineTo(x, y);
			return this;
		}

		quadraticCurveTo(aCPx: number, aCPy: number, aX: number, aY: number)
		{
			this.currentPath.quadraticCurveTo(aCPx, aCPy, aX, aY);
			return this;
		}

		bezierCurveTo(aCP1x: number, aCP1y: number, aCP2x: number, aCP2y: number, aX: number, aY: number)
		{
			this.currentPath.bezierCurveTo(aCP1x, aCP1y, aCP2x, aCP2y, aX, aY);
			return this;
		}

		splineThru(pts: Vector2[])
		{
			this.currentPath.splineThru(pts);
			return this;
		}

		closePath()
		{
			this.currentPath.closePath();
		}

		toShapes(isCCW = false, noHoles = false)
		{
			/**
			 * 转换没有孔的路径为形状
			 * 
			 * @param inSubpaths 
			 */
			function toShapesNoHoles(inSubpaths: Path2[])
			{
				const shapes: Shape2[] = [];
				for (let i = 0, l = inSubpaths.length; i < l; i++)
				{
					const tmpPath = inSubpaths[i];

					const tmpShape = new Shape2();
					tmpShape.curves = tmpPath.curves;

					shapes.push(tmpShape);
				}

				return shapes;
			}

			/**
			 * 判断点是否在多边形内
			 * @param inPt 
			 * @param inPolygon 
			 */
			function isPointInsidePolygon(inPt: Vector2, inPolygon: Vector2[])
			{
				const polyLen = inPolygon.length;

				// inPt on polygon contour => immediate success    or
				// toggling of inside/outside at every single! intersection point of an edge
				//  with the horizontal line through inPt, left of inPt
				//  not counting lowerY endpoints of edges and whole edges on that line
				let inside = false;
				for (let p = polyLen - 1, q = 0; q < polyLen; p = q++)
				{
					let edgeLowPt = inPolygon[p];
					let edgeHighPt = inPolygon[q];

					let edgeDx = edgeHighPt.x - edgeLowPt.x;
					let edgeDy = edgeHighPt.y - edgeLowPt.y;

					if (Math.abs(edgeDy) > Number.EPSILON)
					{
						// not parallel
						if (edgeDy < 0)
						{
							edgeLowPt = inPolygon[q]; edgeDx = - edgeDx;
							edgeHighPt = inPolygon[p]; edgeDy = - edgeDy;
						}

						if ((inPt.y < edgeLowPt.y) || (inPt.y > edgeHighPt.y)) continue;

						if (inPt.y === edgeLowPt.y)
						{
							if (inPt.x === edgeLowPt.x) return true;		// inPt is on contour ?
							// continue;				// no intersection or edgeLowPt => doesn't count !!!
						} else
						{
							const perpEdge = edgeDy * (inPt.x - edgeLowPt.x) - edgeDx * (inPt.y - edgeLowPt.y);
							if (perpEdge === 0) return true;		// inPt is on contour ?
							if (perpEdge < 0) continue;
							inside = !inside;		// true intersection left of inPt
						}
					} else
					{
						// parallel or collinear
						if (inPt.y !== edgeLowPt.y) continue;			// parallel
						// edge lies on the same horizontal line as inPt
						if (((edgeHighPt.x <= inPt.x) && (inPt.x <= edgeLowPt.x)) ||
							((edgeLowPt.x <= inPt.x) && (inPt.x <= edgeHighPt.x))) return true;	// inPt: Point on contour !
						// continue;
					}
				}

				return inside;
			}

			const subPaths = this.subPaths;
			if (subPaths.length === 0) return [];

			// 处理无孔形状
			if (noHoles === true) return toShapesNoHoles(subPaths);

			let solid: boolean, tmpPath: Path2, tmpShape: Shape2;
			const shapes: Shape2[] = [];

			if (subPaths.length === 1)
			{
				tmpPath = subPaths[0];
				tmpShape = new Shape2();
				tmpShape.curves = tmpPath.curves;
				shapes.push(tmpShape);
				return shapes;
			}

			// 第一个是否为空
			let holesFirst = !ShapeUtils.isClockWise(subPaths[0].getPoints());
			if (isCCW)// 判断是否为孔
			{
				holesFirst = !holesFirst;
			}

			// console.log("Holes first", holesFirst);

			const betterShapeHoles: { h: Path2, p: Vector2 }[][] = [];
			const newShapes: { s: Shape2, p: Vector2[] }[] = [];
			let newShapeHoles: { h: Path2, p: Vector2 }[][] = [];
			let mainIdx = 0;
			let tmpPoints: Vector2[];

			newShapes[mainIdx] = undefined;
			newShapeHoles[mainIdx] = [];

			for (let i = 0, l = subPaths.length; i < l; i++)
			{
				tmpPath = subPaths[i];
				tmpPoints = tmpPath.getPoints();
				solid = ShapeUtils.isClockWise(tmpPoints);
				if (isCCW)// 判断是否为实线
				{
					solid = !solid;
				}

				if (solid)
				{
					if ((!holesFirst) && (newShapes[mainIdx])) mainIdx++;

					newShapes[mainIdx] = { s: new Shape2(), p: tmpPoints };
					newShapes[mainIdx].s.curves = tmpPath.curves;

					if (holesFirst) mainIdx++;
					newShapeHoles[mainIdx] = [];
					//console.log('cw', i);
				} else
				{
					newShapeHoles[mainIdx].push({ h: tmpPath, p: tmpPoints[0] });
					//console.log('ccw', i);
				}
			}

			// only Holes? -> probably all Shapes with wrong orientation
			if (!newShapes[0]) return toShapesNoHoles(subPaths);

			if (newShapes.length > 1)
			{
				let ambiguous = false;
				const toChange = [];

				for (let sIdx = 0, sLen = newShapes.length; sIdx < sLen; sIdx++)
				{
					betterShapeHoles[sIdx] = [];
				}

				for (let sIdx = 0, sLen = newShapes.length; sIdx < sLen; sIdx++)
				{
					const sho = newShapeHoles[sIdx];

					for (let hIdx = 0; hIdx < sho.length; hIdx++)
					{
						const ho = sho[hIdx];
						let hole_unassigned = true;

						for (let s2Idx = 0; s2Idx < newShapes.length; s2Idx++)
						{
							if (isPointInsidePolygon(ho.p, newShapes[s2Idx].p))
							{
								if (sIdx !== s2Idx) toChange.push({ froms: sIdx, tos: s2Idx, hole: hIdx });
								if (hole_unassigned)
								{
									hole_unassigned = false;
									betterShapeHoles[s2Idx].push(ho);
								} else
								{
									ambiguous = true;
								}
							}
						}

						if (hole_unassigned)
						{
							betterShapeHoles[sIdx].push(ho);
						}
					}
				}
				// console.log("ambiguous: ", ambiguous);

				if (toChange.length > 0)
				{
					// console.log("to change: ", toChange);
					if (!ambiguous) newShapeHoles = betterShapeHoles;
				}

			}

			let tmpHoles: { h: Path2; p: Vector2; }[];

			for (let i = 0, il = newShapes.length; i < il; i++)
			{

				tmpShape = newShapes[i].s;
				shapes.push(tmpShape);
				tmpHoles = newShapeHoles[i];

				for (let j = 0, jl = tmpHoles.length; j < jl; j++)
				{
					tmpShape.holes.push(tmpHoles[j].h);
				}
			}

			//console.log("shape", shapes);
			return shapes;
		}
	}
}

