namespace feng3d.war3
{

	/**
	 * war3模型数据
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
		pivotPoints: Vector3[];

		//-------------------------------------
		//
		//	以下数据计算得出
		//
		//---------------------------------------

		private meshs: GameObject[];
		private skeletonComponent: SkeletonComponent;

		getMesh(): GameObject
		{
			this.meshs = [];
			this.meshs.length = this.geosets.length;

			var container = Object.setValue(new GameObject(), { name: this.model.name });

			var skeletonjoints = createSkeleton(this);
			this.skeletonComponent = container.addComponent(SkeletonComponent);
			this.skeletonComponent.joints = skeletonjoints;

			for (var i: number = 0; i < this.geosets.length; i++)
			{
				var geoset: Geoset = this.geosets[i];

				var mesh: GameObject = this.meshs[i] = new GameObject();
				// var model = mesh.addComponent(Model);
				var model = mesh.addComponent(SkinnedModel);

				var geometry: CustomGeometry = new CustomGeometry();
				geometry.positions = geoset.Vertices;
				geometry.uvs = geoset.TVertices;
				geometry.indices = geoset.Faces;
				var normals = geometryUtils.createVertexNormals(geometry.indices, geometry.positions, true);
				geometry.normals = normals;

				var skins = BuildAnimatedMeshSkin(geoset);

				var skinSkeleton = new SkinSkeletonTemp();
				skinSkeleton.resetJointIndices(skins.jointIndices0, this.skeletonComponent);

				//更新关节索引与权重索引
				geometry.setVAData("a_jointindex0", skins.jointIndices0, 4);
				geometry.setVAData("a_jointweight0", skins.jointWeights0, 4);

				var material: Material = this.materials[geoset.MaterialID];
				if (!material.material)
				{
					var fBitmap: FBitmap = this.getFBitmap(material);
					var image: string = fBitmap.image;
					// if (image && image.length > 0)
					// {
					// image = image.substring(0, image.indexOf("."));
					// image += ".JPG";
					material.material = model.material = Object.setValue(new feng3d.Material(), { name: image, renderParams: { cullFace: CullFace.FRONT } });
					// }

					feng3dDispatcher.dispatch("assets.parsed", material.material);
				}

				feng3dDispatcher.dispatch("assets.parsed", geometry);

				model.geometry = geometry;
				model.skinSkeleton = skinSkeleton;

				container.addChild(mesh);
			}

			var animationclips = createAnimationClips(this);
			var animation = container.addComponent(Animation);
			animation.animation = animationclips[0]
			animation.animations = animationclips;

			//
			container.transform.rx = 90;
			container.transform.sx = 0.01;
			container.transform.sy = 0.01;
			container.transform.sz = -0.01;
			return container;
		}

		private getFBitmap(material: Material): FBitmap
		{
			var TextureID = 0;
			for (var i = 0; i < material.layers.length; i++)
			{
				var layer = material.layers[i];
				TextureID = layer.TextureID;
				break;
			}

			var fBitmap: FBitmap = this.textures[TextureID];
			return fBitmap;
		}
	}


	function createSkeleton(war3Model: War3Model)
	{
		var bones = war3Model.bones;

		var skeletonjoints: SkeletonJoint[] = [];
		for (var i = 0; i < bones.length; i++)
		{
			createSkeletonJoint(i);
		}
		return skeletonjoints;

		function createSkeletonJoint(index)
		{
			if (skeletonjoints[index])
				return skeletonjoints[index];

			var joint = bones[index];
			var skeletonJoint = new SkeletonJoint();
			skeletonJoint.name = joint.name;
			skeletonJoint.parentIndex = joint.Parent;

			var position = war3Model.pivotPoints[joint.ObjectId];;

			var matrix3D = new Matrix4x4().recompose([
				position,
				new Vector3(),
				new Vector3(1, 1, 1)
			]);
			if (skeletonJoint.parentIndex != -1)
			{
				var parentskeletonJoint = createSkeletonJoint(skeletonJoint.parentIndex);
				joint.pivotPoint = matrix3D.position.subTo(parentskeletonJoint.matrix3D.position);
			} else
			{
				joint.pivotPoint = position;
			}
			skeletonJoint.matrix3D = matrix3D;
			skeletonjoints[index] = skeletonJoint;
			return skeletonJoint;
		}
	}

	function BuildAnimatedMeshSkin(geoset: Geoset)
	{
		//关节索引数据
		var jointIndices0: number[] = [];
		//关节权重数据
		var jointWeights0: number[] = [];

		var numVertexs: number = geoset.Vertices.length / 3;
		for (var i: number = 0; i < numVertexs; i++)
		{
			//顶点所在组索引
			var iGroupIndex: number = geoset.VertexGroup[i];
			//顶点所在组索引
			var group = geoset.Groups[iGroupIndex];
			//顶点关联骨骼数量
			var numBones: number = group.length;
			var weightJoints = [0, 0, 0, 0];
			for (var j: number = 0; j < numBones; j++)
			{
				var boneIndex: number = group[j];
				weightJoints[j] = boneIndex;
			}
			var weightBiass = [0, 0, 0, 0];
			for (var j = 0; j < 4; j++)
			{
				if (j < numBones)
					weightBiass[j] = 1 / numBones;
			}
			//
			jointIndices0[i * 4] = weightJoints[0];
			jointIndices0[i * 4 + 1] = weightJoints[1];
			jointIndices0[i * 4 + 2] = weightJoints[2];
			jointIndices0[i * 4 + 3] = weightJoints[3];
			//
			jointWeights0[i * 4] = weightBiass[0];
			jointWeights0[i * 4 + 1] = weightBiass[1];
			jointWeights0[i * 4 + 2] = weightBiass[2];
			jointWeights0[i * 4 + 3] = weightBiass[3];
		}
		return { jointIndices0: jointIndices0, jointWeights0: jointWeights0 };
	}

	function createAnimationClips(war3Model: War3Model)
	{
		var sequences = war3Model.sequences;
		var animationclips: AnimationClip[] = [];
		for (var i = 0; i < sequences.length; i++)
		{
			var sequence = sequences[i];
			var animationclip = new AnimationClip();
			animationclip.name = sequence.name;
			animationclip.loop = sequence.loop;
			animationclip.length = sequence.interval.end - sequence.interval.start;
			animationclip.propertyClips = [];

			var __chache__: { [key: string]: PropertyClip } = {};

			war3Model.bones.forEach(bone =>
			{
				bone.buildAnimationclip(animationclip, __chache__, sequence.interval.start, sequence.interval.end);
			});

			feng3dDispatcher.dispatch("assets.parsed", animationclip);

			animationclips.push(animationclip);
		}
		return animationclips;
	}
}
