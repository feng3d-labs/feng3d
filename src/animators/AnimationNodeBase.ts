namespace feng3d
{
	/**
	 * 动画节点基类
	 * @author feng 2014-5-20
	 */
	export class AnimationNodeBase extends Event
	{
		protected _stateClass;

		/**
		 * 状态类
		 */
		get stateClass()
		{
			return this._stateClass;
		}
	}
}
