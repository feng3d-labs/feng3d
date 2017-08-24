declare namespace feng3d {
    /**
     * 骨骼数据
     * @author feng 2014-5-20
     */
    class Skeleton {
        /** 骨骼关节数据列表 */
        joints: SkeletonJoint[];
        constructor();
        readonly numJoints: number;
    }
}
