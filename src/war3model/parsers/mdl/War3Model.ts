namespace feng3d.war3
{

	/**
	 * war3模型数据
	 * @author warden_feng 2014-6-28
	 */
	export class War3Model
	{
		/** 版本号 */
		_version: number;
		/** 模型数据统计结果 */
		model: Model;
		/** 动作序列 */
		sequences: AnimInfo[];
		/** 全局序列 */
		globalsequences: Globalsequences;
		/** 纹理列表 */
		textures: FBitmap[];
		/** 材质列表 */
		materials: Material[];
		/** 几何设置列表 */
		geosets: Geoset[] = [];
		/** 几何动画列表 */
		geosetAnims: GeosetAnim[];
		/** 骨骼动画列表 */
		bones: BoneObject[] = [];
		/** 骨骼轴心坐标 */
		pivotPoints: Vector3D[];

		//-------------------------------------
		//
		//	以下数据计算得出
		//
		//---------------------------------------

		/** 顶点最大关节关联数 */
		_maxJointCount: number;

		root: string = "";

		constructor()
		{
		}

		private meshs: GameObject[];

		private container: GameObject;

		getMesh(): GameObject
		{
			if (this.container)
				return this.container;

			this.meshs = [];
			this.meshs.length = this.geosets.length;

			this.container = GameObject.create();

			for (var i: number = 0; i < this.geosets.length; i++)
			{
				var geoset: Geoset = this.geosets[i];

				var geometry: Geometry = new Geometry();

				var subg = new Geometry();
				subg.positions = new Float32Array(geoset.Vertices);
				subg.uvs = new Float32Array(geoset.TVertices);
				subg.setIndices(new Uint16Array(geoset.Faces));
				var normals = GeometryUtils.createVertexNormals(subg.indices, subg.positions, true);
				subg.normals = new Float32Array(normals);

				geometry.addGeometry(subg);

				var material: Material = this.materials[geoset.MaterialID];
				var fBitmap: FBitmap = this.getFBitmap(material);

				var material1: StandardMaterial;
				var image: string = fBitmap.image;
				if (image && image.length > 0)
				{
					image = image.substring(0, image.indexOf("."));
					image += ".JPG";
					image = this.root + image;

					material1 = new StandardMaterial(image);
					material1.bothSides = true;
				}

				var mesh: GameObject = this.meshs[i] = GameObject.create();
				mesh.addComponent(MeshFilter).mesh = geometry;
				mesh.addComponent(MeshRenderer).material = material1;

				this.container.addChild(mesh);
			}

			return this.container;
		}

		/**
		 * 获取某时间的网格信息
		 * @param time
		 * @return
		 */
		updateAnim(m_animTime: number): GameObject[]
		{
			var mesh: GameObject;
			for (var i: number = 0; i < this.geosets.length; i++)
			{
				var geoset: Geoset = this.geosets[i];

				var positions = geoset.Vertices;

				this.UpdateAllNodeMatrix(m_animTime);
				positions = this.BuildAnimatedMesh(m_animTime, geoset);

				//				trace(positions);

				mesh = this.meshs[i];
				var subg: Geometry = mesh.getComponent(MeshFilter).mesh;

				subg.positions = new Float32Array(positions);
				var normals = GeometryUtils.createVertexNormals(subg.indices, subg.positions, true);
				subg.normals = new Float32Array(normals);
			}

			return this.meshs;
		}

		private getFBitmap(material: Material): FBitmap
		{
			var TextureID: number
			for (var i = 0; i < material.layers.length; i++)
			{
				var layer = material.layers[i];
				TextureID = layer.TextureID;
				break;
			}

			var fBitmap: FBitmap = this.textures[TextureID];
			return fBitmap;
		}

		private BuildAnimatedMesh(m_animTime: number, geoset: Geoset): number[]
		{
			var positions = geoset.Vertices.concat();

			var numVertexs: number = geoset.Vertices.length / 3;
			for (var i: number = 0; i < numVertexs; i++)
			{
				var animatedPos: Vector3D = new Vector3D();

				//原顶点数据
				var vPosOri: Vector3D = new Vector3D(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
				//顶点所在组索引
				var iGroupIndex: number = geoset.VertexGroup[i];
				//顶点所在组索引
				var group = geoset.Groups[iGroupIndex];
				//顶点关联骨骼数量
				var numBones: number = group.length;
				for (var j: number = 0; j < numBones; j++)
				{
					var boneIndex: number = group[j];
					var bone: BoneObject = this.bones[boneIndex];
					var transformation: Matrix3D = bone.c_globalTransformation;

					var tempPos: Vector3D = transformation.transformVector(vPosOri);
					animatedPos = animatedPos.add(tempPos);
				}

				animatedPos.scaleBy(1 / numBones);

				positions[i * 3] = animatedPos.y;
				positions[i * 3 + 1] = animatedPos.z;
				positions[i * 3 + 2] = -animatedPos.x;
			}

			return positions;
		}

		private UpdateAllNodeMatrix(m_animTime: number): void
		{
			var numNodes: number = this.bones.length;
			var i: number;
			var bone: BoneObject;

			for (i = 0; i < numNodes; i++)
			{
				bone = this.bones[i];
				bone.pivotPoint = this.pivotPoints[bone.ObjectId];
				bone.c_transformation = bone.c_globalTransformation = null;
			}

			for (i = 0; i < numNodes; i++)
			{
				bone = this.bones[i];
				this.BuildMatrix(bone, m_animTime);
			}
		}

		private BuildMatrix(bone: BoneObject, m_animTime: number): void
		{
			var globalTransformation: Matrix3D = bone.c_globalTransformation;
			if (globalTransformation == null)
			{
				bone.calculateTransformation(m_animTime);
				var localTransformation: Matrix3D = bone.c_transformation;
				if (bone.Parent == -1)
				{
					globalTransformation = localTransformation;
				}
				else
				{
					var parentBone: BoneObject = this.bones[bone.Parent];
					this.BuildMatrix(parentBone, m_animTime);
					var parentGlobalTransformation: Matrix3D = parentBone.c_globalTransformation;
					globalTransformation = parentGlobalTransformation.clone();
					globalTransformation.prepend(localTransformation);
				}
				bone.c_globalTransformation = globalTransformation;
			}
		}

	}
}
