module feng3d {

	/**
	 * 骨骼关节数据
	 * @author feng 2014-5-20
	 */
    export class SkeletonJoint {
        /** 父关节索引 （-1说明本身是总父节点，这个序号其实就是行号了，譬如上面”origin“节点的序号就是0，无父节点； "body"节点序号是1，父节点序号是0，也就是说父节点是”origin“）*/
        public parentIndex: number = -1;

        /** 关节名字 */
        public name: string;

        /** 位移 */
        public position: Vector3D;
        /** 旋转 */
        public rotation: Quaternion;

        private _matrix: Matrix3D;
        private _invertMatrix: Matrix3D;

        public get matrix() {

            if (!this._matrix) {

                this._matrix = this.rotation.toMatrix3D();
                this._matrix.appendTranslation(this.position.x, this.position.y, this.position.z);
            }
            return this._matrix;
        }

        public get invertMatrix() {
            if (!this._invertMatrix) {
                this._invertMatrix = this.matrix.clone();
                this._invertMatrix.invert();
            }
            return this._invertMatrix;
        }

        public get inverseBindPose() {
            return this.invertMatrix.rawData;
        }
    }
}