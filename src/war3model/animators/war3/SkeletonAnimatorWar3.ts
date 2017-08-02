namespace feng3d.war3
{

	/**
	 * 骨骼动画
	 * @author warden_feng 2014-5-27
	 */
	export class SkeletonAnimatorWar3 extends SkeletonAnimator
	{
		/**
		 * 创建一个骨骼动画类
		 * @param animationSet 动画集合
		 * @param skeleton 骨骼
		 * @param forceCPU 是否强行使用cpu
		 */
		constructor(gameObject: GameObject)
		{
			super(gameObject);
		}

		/**
		 * 本地转换到全局姿势
		 * @param sourcePose 原姿势
		 * @param targetPose 目标姿势
		 * @param skeleton 骨骼
		 */
		protected localToGlobalPose(sourcePose: SkeletonPose, targetPose: SkeletonPose, skeleton: Skeleton): void
		{
			var globalPoses = targetPose.jointPoses;
			var globalJointPose: JointPose;
			var joints = skeleton.joints;
			var len = sourcePose.numJointPoses;
			var jointPoses = sourcePose.jointPoses;
			var parentIndex = 0;
			var joint: SkeletonJoint;
			var parentPose: JointPose;
			var pose: JointPose;
			var or: Quaternion;
			var tr: Vector3D;
			var gTra: Vector3D;
			var gOri: Quaternion;

			var x1 = 0, y1 = 0, z1 = 0, w1 = 0;
			var x2 = 0, y2 = 0, z2 = 0, w2 = 0;
			var x3 = 0, y3 = 0, z3 = 0;

			//初始化全局骨骼姿势长度
			if (globalPoses.length != len)
				globalPoses.length = len;

			for (var i = 0; i < len; ++i)
			{
				//初始化单个全局骨骼姿势
				globalJointPose = globalPoses[i] || (globalPoses[i] = new JointPose());
				joint = joints[i];
				parentIndex = joint.parentIndex;
				pose = jointPoses[i];

				//全局方向偏移
				gOri = globalJointPose.orientation;
				//全局位置偏移
				gTra = globalJointPose.translation;

				//计算全局骨骼的 方向偏移与位置偏移
				//处理跟骨骼(直接赋值)
				tr = pose.translation;
				or = pose.orientation;
				gOri.x = or.x;
				gOri.y = or.y;
				gOri.z = or.z;
				gOri.w = or.w;
				gTra.x = tr.x;
				gTra.y = tr.y;
				gTra.z = tr.z;
			}
		}
	}
}


