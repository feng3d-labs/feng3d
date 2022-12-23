import { oav } from '../../objectview/ObjectView';
import { gPartial } from '../../polyfill/Types';
import { serializable } from '../../serialization/ClassUtils';
import { serialize } from '../../serialization/serialize';
import { watcher } from '../../watcher/watcher';
import { MeshRenderer } from '../core/MeshRenderer';
import { Object3D } from '../core/Object3D';
import { Geometry } from '../geometry/Geometry';
import { createNodeMenu } from '../menu/CreateNodeMenu';

declare global
{
	export interface MixinsGeometryMap
	{
		TorusGeometry: TorusGeometry
	}
	export interface MixinsDefaultGeometry
	{
		Torus: TorusGeometry;
	}
	export interface MixinsPrimitiveObject3D
	{
		Torus: Object3D;
	}
}

/**
 * 圆环几何体
 */
@serializable()
export class TorusGeometry extends Geometry
{
	__class__: 'TorusGeometry' = 'TorusGeometry';

	/**
	 * 半径
	 */
	@serialize
	@oav()
	radius = 0.5;

	/**
	 * 管道半径
	 */
	@serialize
	@oav()
	tubeRadius = 0.1;

	/**
	 * 半径方向分割数
	 */
	@serialize
	@oav()
	segmentsR = 16;

	/**
	 * 管道方向分割数
	 */
	@serialize
	@oav()
	segmentsT = 8;

	/**
	 * 是否朝上
	 */
	@serialize
	@oav()
	yUp = true;

	name = 'Torus';

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

	constructor(param?: gPartial<TorusGeometry>)
	{
		super();
		Object.assign(this, param);
		watcher.watch(this as TorusGeometry, 'radius', this.invalidateGeometry, this);
		watcher.watch(this as TorusGeometry, 'tubeRadius', this.invalidateGeometry, this);
		watcher.watch(this as TorusGeometry, 'segmentsR', this.invalidateGeometry, this);
		watcher.watch(this as TorusGeometry, 'segmentsT', this.invalidateGeometry, this);
		watcher.watch(this as TorusGeometry, 'yUp', this.invalidateGeometry, this);
	}

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
		let i: number; let
			j: number;
		let x: number; let y: number; let z: number; let nx: number; let ny: number; let nz: number; let revolutionAngleR: number; let
			revolutionAngleT: number;
		// reset utility variables
		this._numVertices = 0;
		this._vertexIndex = 0;
		this._currentTriangleIndex = 0;

		// evaluate target number of vertices, triangles and indices
		this._numVertices = (this.segmentsT + 1) * (this.segmentsR + 1); // this.segmentsT + 1 because of closure, this.segmentsR + 1 because of closure
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const numTriangles = this.segmentsT * this.segmentsR * 2; // each level has segmentsR quads, each of 2 triangles

		this._vertexPositionData = [];
		this._vertexNormalData = [];
		this._vertexTangentData = [];
		this._rawIndices = [];

		// evaluate revolution steps
		const revolutionAngleDeltaR = 2 * Math.PI / this.segmentsR;
		const revolutionAngleDeltaT = 2 * Math.PI / this.segmentsT;

		let comp1: number; let
			comp2: number;
		let t1: number; let t2: number; let n1: number; let
			n2: number;

		let startPositionIndex: number;

		// surface
		let a: number; let b: number; let c: number; let d: number; let
			length: number;

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
				z = (j === this.segmentsT) ? 0 : this.tubeRadius * nz;

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

				if (i === this.segmentsR)
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

		const uvs = this.buildUVs();

		this.indexBuffer = { array: this._rawIndices };
		this.attributes.a_position = { array: this._vertexPositionData, itemSize: 3 };
		this.attributes.a_normal = { array: this._vertexNormalData, itemSize: 3 };
		this.attributes.a_tangent = { array: this._vertexTangentData, itemSize: 3 };
		this.attributes.a_uv = { array: uvs, itemSize: 2 };
	}

	/**
	 * @inheritDoc
	 */
	protected buildUVs()
	{
		let i: number; let
			j: number;
		const stride = 2;
		const data: number[] = [];

		let index = 0;
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
		return data;
	}
}

Geometry.setDefault('Torus', new TorusGeometry());

Object3D.registerPrimitive('Torus', (g) =>
{
	g.addComponent(MeshRenderer).geometry = Geometry.getDefault('Torus');
});

// 在 Hierarchy 界面新增右键菜单项
createNodeMenu.push(
	{
		path: '3D Object/Torus',
		priority: -10000,
		click: () =>
			Object3D.createPrimitive('Torus')
	}
);
