namespace feng3d.war3
{
	/**
	 * 透明度动画
	 * @author warden_feng 2014-6-26
	 */
	export class AnimAlpha
	{
		constructor()
		{
		}
	}

	/**
	 * 全局动作信息
	 * @author warden_feng 2014-6-26
	 */
	export class AnimInfo
	{
		/** 动作名称 */
		name: string;
		/** 动作间隔 */
		interval: Interval;
		/** 最小范围 */
		MinimumExtent: Vector3;
		/** 最大范围 */
		MaximumExtent: Vector3;
		/** 半径范围 */
		BoundsRadius: number;
		/** 发生频率 */
		Rarity: number;
		/** 是否循环 */
		loop: boolean = true;
		/** 移动速度 */
		MoveSpeed: number;
	}

	/**
	 * 几何体动作信息
	 * @author warden_feng 2014-6-26
	 */
	export class AnimInfo1
	{
		/** 最小范围 */
		MinimumExtent: Vector3;
		/** 最大范围 */
		MaximumExtent: Vector3;
		/** 半径范围 */
		BoundsRadius: number;
	}

	/**
	 * 骨骼的角度信息
	 */
	export class BoneRotation
	{
		/** 类型 */
		type: string;
		/** */
		GlobalSeqId: number;

		rotations: Rotation[] = [];

		getRotationItem(rotation: Rotation)
		{
			var quaternion = new Quaternion();
			if (this.type == "DontInterp")
			{
				quaternion.fromEulerAngles(rotation.value.x, rotation.value.y, rotation.value.z);
			} else
			{
				quaternion.copyFrom(rotation.value);
			}
			return quaternion;
		}

		getRotation(keyFrameTime: number): Quaternion
		{
			var RotationQuaternion = new Quaternion();
			if (this.rotations.length == 0 || keyFrameTime < this.rotations[0].time || keyFrameTime > this.rotations[this.rotations.length - 1].time)
				return new Quaternion();

			var key1: Rotation = this.rotations[0];
			var key2: Rotation = this.rotations[0];

			for (var i = 0; i < this.rotations.length; i++)
			{
				key2 = this.rotations[i];
				if (key2.time > keyFrameTime)
				{
					break;
				}
				key1 = key2;
			}

			if (key1 == key2)
			{
				RotationQuaternion.copyFrom(key1.value);
				return RotationQuaternion;
			}

			var Factor = (keyFrameTime - key1.time) / (key2.time - key1.time);
			var InverseFactor = 1.0 - Factor;

			var tempVec: Quaternion;
			var Factor1: number;
			var Factor2: number;
			var Factor3: number;
			var Factor4: number;
			var FactorTimesTwo: number;
			var InverseFactorTimesTwo: number;

			var q: Quaternion;
			var q1: Quaternion;
			var q2: Quaternion;

			switch (this.type)
			{
				case "DontInterp":
					RotationQuaternion.fromEulerAngles(key1.value.x, key1.value.y, key1.value.z);
					break;
				case "Linear":
					q1 = key1.value.clone();
					q2 = key2.value.clone();

					RotationQuaternion.slerp(q1, q2, Factor);
					break;
				case "Hermite":
				case "Bezier":
					q1 = key1.value.clone();
					q2 = key2.value.clone();

					RotationQuaternion.slerp(q1, q2, Factor);
					break;
			}

			return RotationQuaternion;
		}
	}

	/**
	 * 骨骼信息(包含骨骼，helper等其他对象)
	 * @author warden_feng 2014-6-26
	 */
	export class BoneObject
	{
		/** 骨骼类型 */
		type: string;
		/** 骨骼名称 */
		name: string;
		/** 对象编号 */
		ObjectId: number;
		/** 父对象 */
		Parent = -1;
		/** 几何体编号 */
		GeosetId: string;
		/** 几何体动画 */
		GeosetAnimId: string;
		/** 是否为广告牌 */
		Billboarded: boolean;
		/** 骨骼位移动画 */
		Translation = new BoneTranslation();
		/** 骨骼缩放动画 */
		Scaling = new BoneScaling();
		/** 骨骼角度动画 */
		Rotation = new BoneRotation();
		/** 中心位置 */
		pivotPoint: Vector3;

		/** 当前对象变换矩阵 */
		c_transformation = new Matrix4x4();

		/** 当前全局变换矩阵 */
		c_globalTransformation = new Matrix4x4();

		calculateTransformation(keyFrameTime: number): void
		{
			var pScalingCenter = this.pivotPoint;
			var pScaling = this.Scaling.getScaling(keyFrameTime);
			var pRotation = this.Rotation.getRotation(keyFrameTime);
			var pTranslation = this.Translation.getTranslation(keyFrameTime);

			var matrix3D = this.c_transformation;
			matrix3D.appendScale(pScaling.x, pScaling.y, pScaling.z).append(pRotation.toMatrix3D());
			//设置旋转缩放中心
			matrix3D.prependTranslation(-this.pivotPoint.x, - this.pivotPoint.y, - this.pivotPoint.z);
			matrix3D.appendTranslation(this.pivotPoint.x, this.pivotPoint.y, this.pivotPoint.z);
			//平移
			matrix3D.appendTranslation(pTranslation.x, pTranslation.y, pTranslation.z)
			//
		}

		buildAnimationclip(animationclip: AnimationClip, __chache__: { [key: string]: PropertyClip }, start: number, end: number)
		{
			var path: PropertyClipPath = [
				[PropertyClipPathItemType.GameObject, this.name],
				[PropertyClipPathItemType.Component, "feng3d.Transform"],
			];

			if (this.Scaling.scalings.length > 0)
			{
				var scalings = this.Scaling.scalings;
				for (var i = 0, n = scalings.length; i < n; i++)
				{
					var scaling = scalings[i];
					if (start <= scaling.time && scaling.time <= end)
					{
						setPropertyClipFrame(path, "scale", scaling.time - start, scaling.value.toArray(), "Vector3");
					}
				}
			}

			if (this.Translation.translations.length > 0)
			{
				var translations = this.Translation.translations;
				for (var i = 0, n = translations.length; i < n; i++)
				{
					var translation = translations[i];
					if (start <= translation.time && translation.time <= end)
					{
						setPropertyClipFrame(path, "position", translation.time - start, translation.value.addTo(this.pivotPoint).toArray(), "Vector3");
					}
				}
			}

			if (this.Rotation.rotations.length > 0)
			{
				var rotations = this.Rotation.rotations;
				for (var i = 0, n = rotations.length; i < n; i++)
				{
					var rotation = rotations[i];
					if (start <= rotation.time && rotation.time <= end)
					{
						setPropertyClipFrame(path, "orientation", rotation.time - start, this.Rotation.getRotationItem(rotation).toArray(), "Quaternion");
					}
				}
			}

			function setPropertyClipFrame(path: PropertyClipPath, propertyName: string, time: number, propertyValue: number[], type: string)
			{
				var propertyClip = getPropertyClip(path, propertyName);
				propertyClip.type = <any>type;
				propertyClip.propertyValues.push([time, propertyValue]);
			}

			function getPropertyClip(path: PropertyClipPath, propertyName: string)
			{
				var key = path.join("-") + propertyName;
				if (__chache__[key])
					return __chache__[key];
				if (!__chache__[key])
				{
					var propertyClip = __chache__[key] = new PropertyClip();
					propertyClip.path = path;
					propertyClip.propertyName = propertyName;
					propertyClip.propertyValues = [];
					animationclip.propertyClips.push(propertyClip);
				}
				return __chache__[key];
			}

		}

		private getMatrix3D(time: number)
		{
			var pScaling = this.Scaling.getScaling(time);
			var pRotation = this.Rotation.getRotation(time);
			var pTranslation = this.Translation.getTranslation(time);

			var matrix3D = new Matrix4x4().appendScale(pScaling.x, pScaling.y, pScaling.z).append(pRotation.toMatrix3D());
			//平移
			matrix3D.appendTranslation(pTranslation.x + this.pivotPoint.x, pTranslation.y + this.pivotPoint.y, pTranslation.z + this.pivotPoint.z)
			//
			return matrix3D;
		}
	}


	/**
	 * 骨骼的位移信息
	 */
	export class BoneScaling
	{
		/** 类型 */
		type: String;
		/**  */
		GlobalSeqId: number;
		scalings: Scaling[] = [];

		getScaling(keyFrameTime: number): Vector3
		{
			var scalingVector = new Vector3();
			if (this.scalings.length == 0 || keyFrameTime < this.scalings[0].time || keyFrameTime > this.scalings[this.scalings.length - 1].time)
				return new Vector3(1, 1, 1);

			var key1: Scaling = this.scalings[0];
			var key2: Scaling = this.scalings[0];

			for (var i = 0; i < this.scalings.length; i++)
			{
				key2 = this.scalings[i];
				if (key2.time >= keyFrameTime)
				{
					break;
				}
				key1 = key2;
			}

			if (key1.time == key2.time)
			{
				scalingVector.copy(key1.value);
				return scalingVector;
			}

			var Factor: number = (keyFrameTime - key1.time) / (key2.time - key1.time);
			var InverseFactor: number = 1.0 - Factor;

			var tempVec: Vector3;
			var Factor1: number;
			var Factor2: number;
			var Factor3: number;
			var Factor4: number;
			var FactorTimesTwo: number;
			var InverseFactorTimesTwo: number;

			switch (this.type)
			{
				case "DontInterp":
					scalingVector.copy(key1.value);
					break;
				case "Linear":
					tempVec = key1.value.clone();
					tempVec.scale(InverseFactor);
					scalingVector.add(tempVec);

					tempVec = key2.value.clone();
					tempVec.scale(Factor);
					scalingVector.add(tempVec);
					break;
				case "Hermite":
					FactorTimesTwo = Factor * Factor;

					Factor1 = FactorTimesTwo * (2.0 * Factor - 3.0) + 1;
					Factor2 = FactorTimesTwo * (Factor - 2.0) + Factor;
					Factor3 = FactorTimesTwo * (Factor - 1.0);
					Factor4 = FactorTimesTwo * (3.0 - 2.0 * Factor);

					tempVec = key1.value.clone();
					tempVec.scale(Factor1);
					scalingVector.add(tempVec);

					tempVec = key1.OutTan.clone();
					tempVec.scale(Factor2);
					scalingVector.add(tempVec);

					tempVec = key2.InTan.clone();
					tempVec.scale(Factor3);
					scalingVector.add(tempVec);

					tempVec = key2.value.clone();
					tempVec.scale(Factor4);
					scalingVector.add(tempVec);
					break;

				case "Bezier":
					FactorTimesTwo = Factor * Factor;
					InverseFactorTimesTwo = InverseFactor * InverseFactor;

					Factor1 = InverseFactorTimesTwo * InverseFactor;
					Factor2 = 3.0 * Factor * InverseFactorTimesTwo;
					Factor3 = 3.0 * FactorTimesTwo * InverseFactor;
					Factor4 = FactorTimesTwo * Factor;

					tempVec = key1.value.clone();
					tempVec.scale(Factor1);
					scalingVector.add(tempVec);

					tempVec = key1.OutTan.clone();
					tempVec.scale(Factor2);
					scalingVector.add(tempVec);

					tempVec = key2.InTan.clone();
					tempVec.scale(Factor3);
					scalingVector.add(tempVec);

					tempVec = key2.value.clone();
					tempVec.scale(Factor4);
					scalingVector.add(tempVec);
					break;
			}

			return scalingVector;
		}
	}


	/**
	 * 骨骼的位移信息
	 * @author warden_feng 2014-6-26
	 */
	export class BoneTranslation
	{
		/** 类型 */
		type: string;
		/**  */
		GlobalSeqId: number;
		translations: Translation[] = [];

		getTranslation(keyFrameTime: number): Vector3
		{
			var TranslationVector = new Vector3();
			if (this.translations.length == 0)
				return new Vector3();

			var key1 = this.translations[0];
			var key2 = this.translations[0];

			for (var i: number = 0; i < this.translations.length; i++)
			{
				key2 = this.translations[i];
				if (key2.time > keyFrameTime)
				{
					break;
				}
				key1 = key2;
			}

			if (key1 == key2)
			{
				TranslationVector.copy(key1.value);
				return TranslationVector;
			}

			var Factor: number = (keyFrameTime - key1.time) / (key2.time - key1.time);
			var InverseFactor: number = 1.0 - Factor;

			var tempVec: Vector3;
			var Factor1: number;
			var Factor2: number;
			var Factor3: number;
			var Factor4: number;
			var FactorTimesTwo: number;
			var InverseFactorTimesTwo: number;

			switch (this.type)
			{
				case "DontInterp":
					TranslationVector.copy(key1.value);
					break;
				case "Linear":
					tempVec = key1.value.clone();
					tempVec.scale(InverseFactor);
					TranslationVector.add(tempVec);

					tempVec = key2.value.clone();
					tempVec.scale(Factor);
					TranslationVector.add(tempVec);
					break;
				case "Hermite":
					FactorTimesTwo = Factor * Factor;

					Factor1 = FactorTimesTwo * (2.0 * Factor - 3.0) + 1;
					Factor2 = FactorTimesTwo * (Factor - 2.0) + Factor;
					Factor3 = FactorTimesTwo * (Factor - 1.0);
					Factor4 = FactorTimesTwo * (3.0 - 2.0 * Factor);

					tempVec = key1.value.clone();
					tempVec.scale(Factor1);
					TranslationVector.add(tempVec);

					tempVec = key1.OutTan.clone();
					tempVec.scale(Factor2);
					TranslationVector.add(tempVec);

					tempVec = key2.InTan.clone();
					tempVec.scale(Factor3);
					TranslationVector.add(tempVec);

					tempVec = key2.value.clone();
					tempVec.scale(Factor4);
					TranslationVector.add(tempVec);
					break;

				case "Bezier":
					FactorTimesTwo = Factor * Factor;
					InverseFactorTimesTwo = InverseFactor * InverseFactor;

					Factor1 = InverseFactorTimesTwo * InverseFactor;
					Factor2 = 3.0 * Factor * InverseFactorTimesTwo;
					Factor3 = 3.0 * FactorTimesTwo * InverseFactor;
					Factor4 = FactorTimesTwo * Factor;

					tempVec = key1.value.clone();
					tempVec.scale(Factor1);
					TranslationVector.add(tempVec);

					tempVec = key1.OutTan.clone();
					tempVec.scale(Factor2);
					TranslationVector.add(tempVec);

					tempVec = key2.InTan.clone();
					tempVec.scale(Factor3);
					TranslationVector.add(tempVec);

					tempVec = key2.value.clone();
					tempVec.scale(Factor4);
					TranslationVector.add(tempVec);
					break;
			}

			return TranslationVector;
		}

	}

	/**
	 * 纹理
	 * @author warden_feng 2014-6-26
	 */
	export class FBitmap
	{
		/** 图片地址 */
		image: string;
		/** 可替换纹理id */
		ReplaceableId: number;
	}


	/**
	 * 几何设置
	 * @author warden_feng 2014-6-26
	 */
	export class Geoset
	{
		/** 顶点 */
		Vertices: number[];
		/** 法线 */
		Normals: number[];
		/** 纹理坐标 */
		TVertices: number[];
		/** 顶点分组 */
		VertexGroup: number[];
		/** 面（索引） */
		Faces: number[];
		/** 顶点分组 */
		Groups: number[][];
		/** 最小范围 */
		MinimumExtent: Vector3;
		/** 最大范围 */
		MaximumExtent: Vector3;
		/** 半径范围 */
		BoundsRadius: number;
		/** 动作信息 */
		Anims: AnimInfo1[] = [];
		/** 材质编号 */
		MaterialID: number;
		/**  */
		SelectionGroup: number;
		/** 是否不可选 */
		Unselectable: boolean;

		/** 顶点对应的关节索引 */
		jointIndices: number[];
		/** 顶点对应的关节权重 */
		jointWeights: number[];
	}

	/**
	 * 几何体动画
	 * @author warden_feng 2014-6-26
	 */
	export class GeosetAnim
	{
		constructor()
		{
		}
	}

	/**
	 * 全局序列
	 * @author warden_feng 2014-6-26
	 */
	export class Globalsequences
	{
		/** 全局序列编号 */
		id: number;
		/** 持续时间 */
		durations: number[] = [];
	}

	/**
	 * 动作间隔
	 * @author warden_feng 2014-6-26
	 */
	export class Interval
	{
		/** 开始时间 */
		start: number;
		/** 结束时间 */
		end: number;
	}

	/**
	 * 材质层
	 * @author warden_feng 2014-6-26
	 */
	export class Layer
	{
		/** 过滤模式 */
		FilterMode: string;
		/** 贴图ID */
		TextureID: number;
		/** 透明度 */
		Alpha: number;
		/** 是否有阴影 */
		Unshaded: boolean;
		/** 是否无雾化 */
		Unfogged: boolean;
		/** 是否双面 */
		TwoSided: boolean;
		/** 是否开启地图环境范围 */
		SphereEnvMap: boolean;
		/** 是否无深度测试 */
		NoDepthTest: boolean;
		/** 是否无深度设置 */
		NoDepthSet: boolean;
	}

	/**
	 * 材质
	 * @author warden_feng 2014-6-26
	 */
	export class Material
	{
		/** 材质层列表 */
		layers: Layer[] = [];
	}

	/**
	 * 模型信息
	 * @author warden_feng 2014-6-26
	 */
	export class Model
	{
		/** 模型名称 */
		name: string;
		/** 混合时间 */
		BlendTime: number;
		/** 最小范围 */
		MinimumExtent: Vector3;
		/** 最大范围 */
		MaximumExtent: Vector3;
	}

	/**
	 *
	 * @author warden_feng 2014-6-26
	 */
	export class Rotation
	{
		/** 时间 */
		time: number;
		/**  */
		value: Quaternion;

		InTan: Quaternion;

		OutTan: Quaternion;
	}

	/**
 *
 * @author warden_feng 2014-6-26
 */
	export class Scaling
	{
		/** 时间 */
		time: number;
		/**  */
		value: Vector3;

		InTan: Vector3;

		OutTan: Vector3;
	}

	/**
	 * 
	 * @author warden_feng 2014-6-26
	 */
	export class Translation
	{
		/** 时间 */
		time: number;
		/**  */
		value: Vector3;

		InTan: Vector3;

		OutTan: Vector3;
	}
}