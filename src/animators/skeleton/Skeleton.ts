namespace feng3d
{
	// /**
	//  * 骨骼数据
	//  * @author feng 2014-5-20
	//  */
    // export class Skeleton
    // {

    // }

    /**
	 * 骨骼关节数据
	 * @author feng 2014-5-20
	 */
    export class SkeletonJoint
    {
        /** 父关节索引 （-1说明本身是总父节点，这个序号其实就是行号了，譬如上面”origin“节点的序号就是0，无父节点； "body"节点序号是1，父节点序号是0，也就是说父节点是”origin“）*/
        @serialize
        parentIndex = -1;

        /** 关节名字 */
        @serialize
        name: string;

        /** 骨骼全局矩阵 */
        @serialize
        matrix3D: Matrix4x4;

        children: number[] = [];

        get invertMatrix3D()
        {
            if (!this._invertMatrix3D)
                this._invertMatrix3D = this.matrix3D.clone().invert();
            return this._invertMatrix3D;
        }
        private _invertMatrix3D: Matrix4x4;
    }
}
