namespace feng3d.war3
{

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

		scalingDic = {};

		getScaling(keyFrameTime: number): Vector3D
		{
			var scalingVector: Vector3D;
			if (this.scalings.length == 0 || keyFrameTime < this.scalings[0].time || keyFrameTime > this.scalings[this.scalings.length - 1].time)
				return new Vector3D(1, 1, 1);

			var key1: Scaling = this.scalings[0];
			var key2: Scaling;

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
				scalingVector = key1.value.clone();
				return scalingVector;
			}

			var Factor: number = (keyFrameTime - key1.time) / (key2.time - key1.time);
			var InverseFactor: number = 1.0 - Factor;

			var tempVec: Vector3D;
			var Factor1: number;
			var Factor2: number;
			var Factor3: number;
			var Factor4: number;
			var FactorTimesTwo: number;
			var InverseFactorTimesTwo: number;

			switch (this.type)
			{
				case "DontInterp":
					scalingVector = key1.value.clone();
					break;
				case "Linear":
					scalingVector = new Vector3D();

					tempVec = key1.value.clone();
					tempVec.scaleBy(InverseFactor);
					scalingVector = scalingVector.add(tempVec);

					tempVec = key2.value.clone();
					tempVec.scaleBy(Factor);
					scalingVector = scalingVector.add(tempVec);
					break;
				case "Hermite":
					FactorTimesTwo = Factor * Factor;

					Factor1 = FactorTimesTwo * (2.0 * Factor - 3.0) + 1;
					Factor2 = FactorTimesTwo * (Factor - 2.0) + Factor;
					Factor3 = FactorTimesTwo * (Factor - 1.0);
					Factor4 = FactorTimesTwo * (3.0 - 2.0 * Factor);

					scalingVector = new Vector3D();

					tempVec = key1.value.clone();
					tempVec.scaleBy(Factor1);
					scalingVector = scalingVector.add(tempVec);

					tempVec = key1.OutTan.clone();
					tempVec.scaleBy(Factor2);
					scalingVector = scalingVector.add(tempVec);

					tempVec = key2.InTan.clone();
					tempVec.scaleBy(Factor3);
					scalingVector = scalingVector.add(tempVec);

					tempVec = key2.value.clone();
					tempVec.scaleBy(Factor4);
					scalingVector = scalingVector.add(tempVec);
					break;

				case "Bezier":
					FactorTimesTwo = Factor * Factor;
					InverseFactorTimesTwo = InverseFactor * InverseFactor;

					Factor1 = InverseFactorTimesTwo * InverseFactor;
					Factor2 = 3.0 * Factor * InverseFactorTimesTwo;
					Factor3 = 3.0 * FactorTimesTwo * InverseFactor;
					Factor4 = FactorTimesTwo * Factor;

					scalingVector = new Vector3D();

					tempVec = key1.value.clone();
					tempVec.scaleBy(Factor1);
					scalingVector = scalingVector.add(tempVec);

					tempVec = key1.OutTan.clone();
					tempVec.scaleBy(Factor2);
					scalingVector = scalingVector.add(tempVec);

					tempVec = key2.InTan.clone();
					tempVec.scaleBy(Factor3);
					scalingVector = scalingVector.add(tempVec);

					tempVec = key2.value.clone();
					tempVec.scaleBy(Factor4);
					scalingVector = scalingVector.add(tempVec);
					break;
			}

			return scalingVector;
		}
	}
}
