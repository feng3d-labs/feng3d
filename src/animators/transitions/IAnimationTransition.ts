module feng3d {

	/**
	 * 淡入淡出变换接口
	 * @author feng 2015-9-18
	 */
    export interface IAnimationTransition {
		/**
		 * 获取动画变换节点
		 * @param animator				动画
		 * @param startNode				开始节点
		 * @param endNode				结束节点
		 * @param startTime				开始时间
		 * @return						动画变换节点
		 */
        getAnimationNode(animator: AnimatorBase, startNode: AnimationNodeBase, endNode: AnimationNodeBase, startTime: number): AnimationNodeBase
    }
}
