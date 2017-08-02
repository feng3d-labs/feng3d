namespace feng3d.war3
{
	/**
	 * 骨骼信息(包含骨骼，helper等其他对象)
	 * @author warden_feng 2014-6-26
	 */
	export class BoneObject
	{
		/** 骨骼类型 */
		type:string;
		/** 骨骼名称 */
		name:string;
		/** 对象编号 */
		ObjectId: number;
		/** 父对象 */
		Parent = -1;
		/** 几何体编号 */
		GeosetId:string;
		/** 几何体动画 */
		GeosetAnimId:string;
		/** 是否为广告牌 */
		Billboarded:boolean;
		/** 骨骼位移动画 */
		Translation = new BoneTranslation();
		/** 骨骼缩放动画 */
		Scaling = new BoneScaling();
		/** 骨骼角度动画 */
		Rotation = new BoneRotation();
		/** 中心位置 */
		pivotPoint: Vector3D;



		/** 当前对象变换矩阵 */
		c_transformation: Matrix3D;

		/** 当前全局变换矩阵 */
		c_globalTransformation: Matrix3D;

		public calculateTransformation(keyFrameTime: number): void
		{
			var pScalingCenter = this.pivotPoint;
			var pScalingRotation: Quaternion = null;
			var pScaling = this.Scaling.getScaling(keyFrameTime);
			var pRotationCenter = this.pivotPoint;
			var pRotation = this.Rotation.getRotation(keyFrameTime);
			var pTranslation = this.Translation.getTranslation(keyFrameTime);

			this.c_transformation = War3Utils.D3DXMatrixTransformation(pScalingCenter, pScalingRotation, pScaling, pRotationCenter, pRotation, pTranslation);
		}
	}
}


