module feng3d {
	/**
	 * 骨骼动画状态接口
	 * @author feng 2015-9-18
	 */
    export interface ISkeletonAnimationState extends IAnimationState {
		/**
		 * 获取骨骼姿势
		 * @param skeleton		骨骼
		 */
        getSkeletonPose(skeleton: Skeleton): SkeletonPose;
    }
}
