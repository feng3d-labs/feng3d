namespace feng3d
{
	// /**
	//  * 骨骼数据
	//
	//  */
    // export class Skeleton
    // {

    // }

    /**
	 * 骨骼关节数据

	 */
    export class SkeletonJoint
    {
        /** 父关节索引 （-1说明本身是总父结点，这个序号其实就是行号了，譬如上面”origin“结点的序号就是0，无父结点； "body"结点序号是1，父结点序号是0，也就是说父结点是”origin“）*/
        @serialize
        parentIndex = -1;

        /** 关节名字 */
        @serialize
        name: string;

        /** 骨骼全局矩阵 */
        @serialize
        matrix: Matrix4x4;

        children: number[] = [];

        get invertMatrix()
        {
            if (!this._invertMatrix)
                this._invertMatrix = this.matrix.clone().invert();
            return this._invertMatrix;
        }
        private _invertMatrix: Matrix4x4;
    }
}
