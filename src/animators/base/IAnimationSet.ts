module feng3d {

	/**
	 * 提供动画数据集合的接口
	 * @author feng 2015-9-18
	 */
	export interface IAnimationSet {
		/**
		 * 检查是否有该动作名称
		 * @param name			动作名称
		 */
		hasAnimation(name: string): boolean;

		/**
		 * 获取动画节点
		 * @param name			动作名称
		 */
		getAnimation(name: string): AnimationNodeBase;
	}
}
