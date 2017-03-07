module feng3d
{

	/**
	 * 骨骼pose
	 * @author feng 2014-5-20
	 */
    export class SkeletonPose
    {
        /** 关节pose列表 */
        public jointPoses: JointPose[];

        private _globalMatrix3Ds: Matrix3D[];

        public get numJointPoses(): number
        {
            return this.jointPoses.length;
        }

        constructor()
        {
            this.jointPoses = [];
        }

        public get globalMatrix3Ds()
        {
            if (!this._globalMatrix3Ds)
            {
                var matrix3Ds: Matrix3D[] = this._globalMatrix3Ds = [];
                for (var i = 0; i < this.jointPoses.length; i++)
                {
                    var jointPose = this.jointPoses[i];
                    matrix3Ds[i] = jointPose.matrix3D.clone();
                    if (jointPose.parentIndex >= 0)
                    {
                        matrix3Ds[i].append(matrix3Ds[jointPose.parentIndex]);
                    }
                }
            }

            return this._globalMatrix3Ds;
        }

        public invalid()
        {
            this._globalMatrix3Ds = null;
        }
    }
}
