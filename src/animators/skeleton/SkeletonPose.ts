module feng3d {

	/**
	 * 骨骼pose
	 * @author feng 2014-5-20
	 */
    export class SkeletonPose {
        /** 关节pose列表 */
        public jointPoses: JointPose[];

        public get numJointPoses(): number {
            return this.jointPoses.length;
        }

        constructor() {
            this.jointPoses = [];
        }
    }
}
