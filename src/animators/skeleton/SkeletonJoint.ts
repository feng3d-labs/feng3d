namespace feng3d
{

	/**
	 * 骨骼关节数据
	 * @author feng 2014-5-20
	 */
    export class SkeletonJoint
    {
        /** 父关节索引 （-1说明本身是总父节点，这个序号其实就是行号了，譬如上面”origin“节点的序号就是0，无父节点； "body"节点序号是1，父节点序号是0，也就是说父节点是”origin“）*/
        parentIndex = -1;

        /** 关节名字 */
        name: string;

        /** 位移 */
        translation: Vector3D;
        /** 旋转 */
        orientation: Quaternion;

        private _matrix3D: Matrix3D;
        private _invertMatrix3D: Matrix3D;

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

        get inverseBindPose()
        {
            return this.invertMatrix3D.rawData;
        }

        invalid()
        {
            this._matrix3D = null;
            this._invertMatrix3D = null;
        }
    }
}