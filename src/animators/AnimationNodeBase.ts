module feng3d
{
	/**
	 * 动画节点基类
	 * @author feng 2014-5-20
	 */
	export class AnimationNodeBase extends Component
	{
		protected _stateClass;

		/**
		 * 状态类
		 */
		public get stateClass()
		{
			return this._stateClass;
		}

		/**
		 * 创建一个动画节点基类
		 */
		constructor()
		{
			super();
		}
	}
}
