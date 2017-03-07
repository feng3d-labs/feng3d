module feng3d
{

	/**
	 * 骨骼关节数据
	 * @author feng 2014-5-20
	 */
    export class SkeletonJoint
    {
        /** 父关节索引 （-1说明本身是总父节点，这个序号其实就是行号了，譬如上面”origin“节点的序号就是0，无父节点； "body"节点序号是1，父节点序号是0，也就是说父节点是”origin“）*/
        public parentIndex: number = -1;

        /** 关节名字 */
        public name: string;

        /** 位移 */
        public translation: Vector3D;
        /** 旋转 */
        public orientation: Quaternion;

        private _matrix3D: Matrix3D;
        private _invertMatrix3D: Matrix3D;

        public get matrix3D()
        {
            if (!this._matrix3D)
            {
                this._matrix3D = this.orientation.toMatrix3D();
                this._matrix3D.appendTranslation(this.translation.x, this.translation.y, this.translation.z);
            }
            return this._matrix3D;
        }

        public get invertMatrix3D()
        {
            if (!this._invertMatrix3D)
            {
                this._invertMatrix3D = this.matrix3D.clone();
                this._invertMatrix3D.invert();
            }
            return this._invertMatrix3D;
        }

        public get inverseBindPose()
        {
            return this.invertMatrix3D.rawData;
        }

        public invalid()
        {
            this._matrix3D = null;
            this._invertMatrix3D = null;
        }
    }
}