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

        private _matrix3D: Matrix3D;

        public get matrix3D(): Matrix3D {

            if (this._matrix3D == null) {
                this._matrix3D = this.orientation.toMatrix3D();
                this._matrix3D.appendTranslation(this.translation.x, this.translation.y, this.translation.z);
            }
            return this._matrix3D;
        }
    }
}
