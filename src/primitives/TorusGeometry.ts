module feng3d
{

	/**
	 * 圆环几何体
	 */
	export class TorusGeometry extends Geometry
	{

		/**
		 * 创建<code>Torus</code>实例
		 * @param radius						圆环半径
		 * @param tubeRadius					管道半径
		 * @param segmentsR						横向段数
		 * @param segmentsT						纵向段数
		 * @param yUp							Y轴是否朝上
		 */
		constructor(public radius = 50, public tubeRadius = 10, public segmentsR = 16, public segmentsT = 8, public yUp = true)
		{
			super();

			Watcher.watch(this, ["radius"], this.buildGeometry, this);
			Watcher.watch(this, ["tubeRadius"], this.buildGeometry, this);
			Watcher.watch(this, ["segmentsR"], this.buildGeometry, this);
			Watcher.watch(this, ["segmentsT"], this.buildGeometry, this);
			Watcher.watch(this, ["yUp"], this.buildGeometry, this);
		}

		//
		protected _vertexPositionData: Float32Array;
		protected _vertexNormalData: Float32Array;
		protected _vertexTangentData: Float32Array;
		private _rawIndices: Uint16Array;
		private _vertexIndex: number;
		private _currentTriangleIndex: number;
		private _numVertices: number;
		private _vertexPositionStride: number = 3;
		private _vertexNormalStride: number = 3;
		private _vertexTangentStride: number = 3;

		/**
		 * 添加顶点数据
		 */
		private addVertex(vertexIndex: number, px: number, py: number, pz: number, nx: number, ny: number, nz: number, tx: number, ty: number, tz: number)
		{
			this._vertexPositionData[vertexIndex * this._vertexPositionStride] = px;
			this._vertexPositionData[vertexIndex * this._vertexPositionStride + 1] = py;
			this._vertexPositionData[vertexIndex * this._vertexPositionStride + 2] = pz;
			this._vertexNormalData[vertexIndex * this._vertexNormalStride] = nx;
			this._vertexNormalData[vertexIndex * this._vertexNormalStride + 1] = ny;
			this._vertexNormalData[vertexIndex * this._vertexNormalStride + 2] = nz;
			this._vertexTangentData[vertexIndex * this._vertexTangentStride] = tx;
			this._vertexTangentData[vertexIndex * this._vertexTangentStride + 1] = ty;
			this._vertexTangentData[vertexIndex * this._vertexTangentStride + 2] = tz;
		}

		/**
		 * 添加三角形索引数据
		 * @param currentTriangleIndex		当前三角形索引
		 * @param cwVertexIndex0			索引0
		 * @param cwVertexIndex1			索引1
		 * @param cwVertexIndex2			索引2
		 */
		private addTriangleClockWise(currentTriangleIndex: number, cwVertexIndex0: number, cwVertexIndex1: number, cwVertexIndex2: number)
		{
			this._rawIndices[currentTriangleIndex * 3] = cwVertexIndex0;
			this._rawIndices[currentTriangleIndex * 3 + 1] = cwVertexIndex1;
			this._rawIndices[currentTriangleIndex * 3 + 2] = cwVertexIndex2;
		}

		/**
		 * @inheritDoc
		 */
		protected buildGeometry()
		{
			var i: number, j: number;
			var x: number, y: number, z: number, nx: number, ny: number, nz: number, revolutionAngleR: number, revolutionAngleT: number;
			var numTriangles: number;
			// reset utility variables
			this._numVertices = 0;
			this._vertexIndex = 0;
			this._currentTriangleIndex = 0;

			// evaluate target number of vertices, triangles and indices
			this._numVertices = (this.segmentsT + 1) * (this.segmentsR + 1); // this.segmentsT + 1 because of closure, this.segmentsR + 1 because of closure
			numTriangles = this.segmentsT * this.segmentsR * 2; // each level has segmentR quads, each of 2 triangles

			this._vertexPositionData = new Float32Array(this._numVertices * this._vertexPositionStride);
			this._vertexNormalData = new Float32Array(this._numVertices * this._vertexNormalStride);
			this._vertexTangentData = new Float32Array(this._numVertices * this._vertexTangentStride);
			this._rawIndices = new Uint16Array(numTriangles * 3);
			this.buildUVs();

			// evaluate revolution steps
			var revolutionAngleDeltaR: number = 2 * Math.PI / this.segmentsR;
			var revolutionAngleDeltaT: number = 2 * Math.PI / this.segmentsT;

			var comp1: number, comp2: number;
			var t1: number, t2: number, n1: number, n2: number;

			var startPositionIndex: number;

			// surface
			var a: number, b: number, c: number, d: number, length: number;

			for (j = 0; j <= this.segmentsT; ++j)
			{
				startPositionIndex = j * (this.segmentsR + 1) * this._vertexPositionStride;

				for (i = 0; i <= this.segmentsR; ++i)
				{
					this._vertexIndex = j * (this.segmentsR + 1) + i;

					// revolution vertex
					revolutionAngleR = i * revolutionAngleDeltaR;
					revolutionAngleT = j * revolutionAngleDeltaT;

					length = Math.cos(revolutionAngleT);
					nx = length * Math.cos(revolutionAngleR);
					ny = length * Math.sin(revolutionAngleR);
					nz = Math.sin(revolutionAngleT);

					x = this.radius * Math.cos(revolutionAngleR) + this.tubeRadius * nx;
					y = this.radius * Math.sin(revolutionAngleR) + this.tubeRadius * ny;
					z = (j == this.segmentsT) ? 0 : this.tubeRadius * nz;

					if (this.yUp)
					{
						n1 = -nz;
						n2 = ny;
						t1 = 0;
						t2 = (length ? nx / length : x / this.radius);
						comp1 = -z;
						comp2 = y;

					}
					else
					{
						n1 = ny;
						n2 = nz;
						t1 = (length ? nx / length : x / this.radius);
						t2 = 0;
						comp1 = y;
						comp2 = z;
					}

					if (i == this.segmentsR)
					{
						this.addVertex(this._vertexIndex, x, this._vertexPositionData[startPositionIndex + 1], this._vertexPositionData[startPositionIndex + 2], nx, n1, n2, -(length ? ny / length : y / this.radius), t1, t2);
					}
					else
					{
						this.addVertex(this._vertexIndex, x, comp1, comp2, nx, n1, n2, -(length ? ny / length : y / this.radius), t1, t2);
					}

					// close triangle
					if (i > 0 && j > 0)
					{
						a = this._vertexIndex; // current
						b = this._vertexIndex - 1; // previous
						c = b - this.segmentsR - 1; // previous of last level
						d = a - this.segmentsR - 1; // current of last level
						this.addTriangleClockWise(this._currentTriangleIndex++, a, b, c);
						this.addTriangleClockWise(this._currentTriangleIndex++, a, c, d);
					}
				}
			}

			this.setVAData(GLAttribute.a_position, this._vertexPositionData, 3);
			this.setVAData(GLAttribute.a_normal, this._vertexNormalData, 3);
			this.setVAData(GLAttribute.a_tangent, this._vertexTangentData, 3);
			this.setIndices(this._rawIndices);
		}

		/**
		 * @inheritDoc
		 */
		protected buildUVs()
		{
			var i: number, j: number;
			var stride: number = 2;
			var data = new Float32Array(this._numVertices * stride);

			// evaluate num uvs
			var numUvs: number = this._numVertices * stride;

			// current uv component index
			var currentUvCompIndex: number = 0;

			var index: number = 0;
			// surface
			for (j = 0; j <= this.segmentsT; ++j)
			{
				for (i = 0; i <= this.segmentsR; ++i)
				{
					index = j * (this.segmentsR + 1) + i;
					// revolution vertex
					data[index * stride] = i / this.segmentsR;
					data[index * stride + 1] = j / this.segmentsT;
				}
			}

			// build real data from raw data
			this.setVAData(GLAttribute.a_uv, data, 2);

		}
	}
}
