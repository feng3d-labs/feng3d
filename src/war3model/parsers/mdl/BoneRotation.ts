namespace feng3d.war3
{

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

		rotationDic = {};

		getRotation(keyFrameTime: number): Quaternion
		{
			var RotationQuaternion: Quaternion;
			if (this.rotations.length == 0 || keyFrameTime < this.rotations[0].time || keyFrameTime > this.rotations[this.rotations.length - 1].time)
				return new Quaternion();

			var key1: Rotation = this.rotations[0];
			var key2: Rotation;

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
				RotationQuaternion = key1.value.clone();
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
					RotationQuaternion = key1.value.clone();
					RotationQuaternion.fromEulerAngles(key1.value.x, key1.value.y, key1.value.z);
					break;
				case "Linear":
					RotationQuaternion = new Quaternion();

					q1 = key1.value.clone();
					q2 = key2.value.clone();

					RotationQuaternion.slerp(q1, q2, Factor);
					break;
				case "Hermite":
				case "Bezier":
					RotationQuaternion = new Quaternion();

					q1 = key1.value.clone();
					q2 = key2.value.clone();

					RotationQuaternion.slerp(q1, q2, Factor);
					break;
			}

			return RotationQuaternion;
		}
	}
}


