namespace feng3d
{

	/**
	 * 动画状态基类
	 * @author feng 2015-9-18
	 */
    export class AnimationStateBase
    {
        protected _animationNode: AnimationNodeBase;
        protected _rootDelta: Vector3D = new Vector3D();
        protected _positionDeltaDirty = true;

        protected _time = 0;
        protected _startTime = 0;
        protected _animator: AnimatorBase;

		/**
		 * @inheritDoc
		 */
        get positionDelta(): Vector3D
        {
            if (this._positionDeltaDirty)
                this.updatePositionDelta();

            return this._rootDelta;
        }

		/**
		 * 创建动画状态基类
		 * @param animator				动画
		 * @param animationNode			动画节点
		 */
        constructor(animator: AnimatorBase, animationNode: AnimationNodeBase)
        {
            this._animator = animator;
            this._animationNode = animationNode;
        }

		/**
		 * @inheritDoc
		 */
        offset(startTime: number)
        {
            this._startTime = startTime;

            this._positionDeltaDirty = true;
        }

		/**
		 * @inheritDoc
		 */
        update(time: number)
        {
            if (this._time == time - this._startTime)
                return;

            this.updateTime(time);
        }

		/**
		 * @inheritDoc
		 */
        phase(value: number)
        {
        }

		/**
		 * 更新时间
		 * @param time		当前时间
		 */
        protected updateTime(time: number)
        {
            this._time = time - this._startTime;

            this._positionDeltaDirty = true;
        }

		/**
		 * 位置偏移
		 */
        protected updatePositionDelta()
        {
        }
    }
}
