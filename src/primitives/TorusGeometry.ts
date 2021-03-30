namespace feng3d
{

	export interface GeometryTypes { TorusGeometry: TorusGeometry }

	/**
	 * 圆环几何体
	 */
	export class TorusGeometry extends Geometry
	{

		__class__: "feng3d.TorusGeometry" = "feng3d.TorusGeometry";

		@AddEntityMenu("Node3D/Torus")
		create(name = "Torus")
		{
			var mesh = new Entity().addComponent(MeshRenderer);
			mesh.name = name;
			mesh.geometry = Geometry.getDefault("Torus");
			return mesh;
		}

		/**
		 * 半径
		 */
		@serialize
		@oav()
		@watch("invalidateGeometry")
		radius = 0.5;

		/**
		 * 管道半径
		 */
		@serialize
		@oav()
		@watch("invalidateGeometry")
		tubeRadius = 0.1;

		/**
		 * 半径方向分割数
		 */
		@serialize
		@oav()
		@watch("invalidateGeometry")
		segmentsR = 16;

		/**
		 * 管道方向分割数
		 */
		@serialize
		@oav()
		@watch("invalidateGeometry")
		segmentsT = 8;

		/**
		 * 是否朝上
		 */
		@serialize
		@oav()
		@watch("invalidateGeometry")
		yUp = true;

		name = "Torus";

		//
		protected _vertexPositionData: number[];
		protected _vertexNormalData: number[];
		protected _vertexTangentData: number[];
		private _rawIndices: number[];
		private _vertexIndex: number;
		private _currentTriangleIndex: number;
		private _numVertices: number;
		private _vertexPositionStride = 3;
		private _vertexNormalStride = 3;
		private _vertexTangentStride = 3;

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
			numTriangles = this.segmentsT * this.segmentsR * 2; // each level has segmentsR quads, each of 2 triangles

			this._vertexPositionData = [];
			this._vertexNormalData = [];
			this._vertexTangentData = [];
			this._rawIndices = [];
			this.buildUVs();

			// evaluate revolution steps
			var revolutionAngleDeltaR = 2 * Math.PI / this.segmentsR;
			var revolutionAngleDeltaT = 2 * Math.PI / this.segmentsT;

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

			this.positions = this._vertexPositionData;
			this.normals = this._vertexNormalData;
			this.tangents = this._vertexTangentData;

			this.indices = this._rawIndices;
		}

		/**
		 * @inheritDoc
		 */
		protected buildUVs()
		{
			var i: number, j: number;
			var stride = 2;
			var data: number[] = [];

			// evaluate num uvs
			var numUvs = this._numVertices * stride;

			// current uv component index
			var currentUvCompIndex = 0;

			var index = 0;
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
			this.uvs = data;
		}
	}

	export interface DefaultGeometry
	{
		Torus: TorusGeometry;
	}
	Geometry.setDefault("Torus", new TorusGeometry());

	Entity.registerPrimitive("Torus", (g) =>
	{
		g.addComponent(MeshRenderer).geometry = Geometry.getDefault("Torus");
	});

	export interface PrimitiveEntity
	{
		Torus: Entity;
	}
}
