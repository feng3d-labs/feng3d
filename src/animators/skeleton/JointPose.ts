module feng3d {
	/**
	 * 关节pose
	 * @author feng 2014-5-20
	 */
    export class JointPose {
        /** 旋转信息 */
        public orientation: Quaternion = new Quaternion();

        /** 位移信息 */
        public translation: Vector3D = new Vector3D();

        constructor() {
        }

		/**
		 * Converts the transformation to a Matrix3D representation.
		 *
		 * @param target An optional target matrix to store the transformation. If not provided, it will create a new instance.
		 * @return The transformation matrix of the pose.
		 */
        public toMatrix3D(target: Matrix3D = null): Matrix3D {
            if (target == null)
                target = new Matrix3D();
            this.orientation.toMatrix3D(target);
            target.appendTranslation(this.translation.x, this.translation.y, this.translation.z);
            return target;
        }
    }
}
