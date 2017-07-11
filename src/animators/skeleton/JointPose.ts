namespace feng3d
{
	/**
	 * 关节pose
	 * @author feng 2014-5-20
	 */
    export class JointPose
    {
        /** Joint 名字 */
        name: string;
        /** 父节点序号 */
        parentIndex: number;
        /** 旋转信息 */
        orientation: Quaternion = new Quaternion();

        /** 位移信息 */
        translation: Vector3D = new Vector3D();

        private _matrix3D: Matrix3D;
        private _invertMatrix3D: Matrix3D;

        set matrix3D(value: Matrix3D)
        {
            this._matrix3D = value;
        }

        get matrix3D()
        {
            if (!this._matrix3D)
            {
                this._matrix3D = this.orientation.toMatrix3D();
                this._matrix3D.appendTranslation(this.translation.x, this.translation.y, this.translation.z);
            }
            return this._matrix3D;
        }

        get invertMatrix3D()
        {
            if (!this._invertMatrix3D)
            {
                this._invertMatrix3D = this.matrix3D.clone();
                this._invertMatrix3D.invert();
            }
            return this._invertMatrix3D;
        }

        invalid()
        {
            this._matrix3D = null;
            this._invertMatrix3D = null;
        }
    }
}
