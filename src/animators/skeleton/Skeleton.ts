namespace feng3d
{
	/**
	 * 骨骼数据
	 * @author feng 2014-5-20
	 */
    export class Skeleton
    {
        /** 骨骼关节数据列表 */
        joints: SkeletonJoint[];

        constructor()
        {
            this.joints = [];
        }

        get numJoints(): number
        {
            return this.joints.length;
        }
    }
}
