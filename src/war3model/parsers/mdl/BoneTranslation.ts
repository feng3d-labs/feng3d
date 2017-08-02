namespace feng3d.war3
{

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

		translationDic = {};

		getTranslation(keyFrameTime: number): Vector3D
		{
			var TranslationVector: Vector3D;
			if (this.translations.length == 0)
				return new Vector3D();

			var key1: Translation = this.translations[0];
			var key2: Translation;

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
				TranslationVector = key1.value.clone();
				return TranslationVector;
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
					TranslationVector = key1.value.clone();
					break;
				case "Linear":
					TranslationVector = new Vector3D();

					tempVec = key1.value.clone();
					tempVec.scaleBy(InverseFactor);
					TranslationVector = TranslationVector.add(tempVec);

					tempVec = key2.value.clone();
					tempVec.scaleBy(Factor);
					TranslationVector = TranslationVector.add(tempVec);
					break;
				case "Hermite":
					FactorTimesTwo = Factor * Factor;

					Factor1 = FactorTimesTwo * (2.0 * Factor - 3.0) + 1;
					Factor2 = FactorTimesTwo * (Factor - 2.0) + Factor;
					Factor3 = FactorTimesTwo * (Factor - 1.0);
					Factor4 = FactorTimesTwo * (3.0 - 2.0 * Factor);

					TranslationVector = new Vector3D();

					tempVec = key1.value.clone();
					tempVec.scaleBy(Factor1);
					TranslationVector = TranslationVector.add(tempVec);

					tempVec = key1.OutTan.clone();
					tempVec.scaleBy(Factor2);
					TranslationVector = TranslationVector.add(tempVec);

					tempVec = key2.InTan.clone();
					tempVec.scaleBy(Factor3);
					TranslationVector = TranslationVector.add(tempVec);

					tempVec = key2.value.clone();
					tempVec.scaleBy(Factor4);
					TranslationVector = TranslationVector.add(tempVec);
					break;

				case "Bezier":
					FactorTimesTwo = Factor * Factor;
					InverseFactorTimesTwo = InverseFactor * InverseFactor;

					Factor1 = InverseFactorTimesTwo * InverseFactor;
					Factor2 = 3.0 * Factor * InverseFactorTimesTwo;
					Factor3 = 3.0 * FactorTimesTwo * InverseFactor;
					Factor4 = FactorTimesTwo * Factor;

					TranslationVector = new Vector3D();

					tempVec = key1.value.clone();
					tempVec.scaleBy(Factor1);
					TranslationVector = TranslationVector.add(tempVec);

					tempVec = key1.OutTan.clone();
					tempVec.scaleBy(Factor2);
					TranslationVector = TranslationVector.add(tempVec);

					tempVec = key2.InTan.clone();
					tempVec.scaleBy(Factor3);
					TranslationVector = TranslationVector.add(tempVec);

					tempVec = key2.value.clone();
					tempVec.scaleBy(Factor4);
					TranslationVector = TranslationVector.add(tempVec);
					break;
			}

			return TranslationVector;
		}

	}
}
