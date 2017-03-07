module feng3d
{
	/**
	 * 骨骼数据
	 * @author feng 2014-5-20
	 */
    export class Skeleton extends Component
    {
        /** 骨骼关节数据列表 */
        public joints: SkeletonJoint[];

        constructor()
        {
            super();
            this.joints = [];
        }

        public get numJoints(): number
        {
            return this.joints.length;
        }
    }
}
