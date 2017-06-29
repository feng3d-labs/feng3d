namespace feng3d
{

	/**
	 * 动画基类
	 * @author feng 2014-5-27
	 */
    export abstract class AnimatorBase extends Component
    {

        /** 是否正在播放动画 */
        private _isPlaying: boolean;
        private _autoUpdate: boolean = true;
        private _time: number = 0;
        /** 播放速度 */
        private _playbackSpeed: number = 1;

        protected _activeNode: AnimationNodeBase;
        protected _activeState: AnimationStateBase;
        /** 当前动画时间 */
        protected _absoluteTime: number = 0;
        private _animationStates = {};

		/**
		 * 是否更新位置
		 */
        public updatePosition: boolean = true;

		/**
		 * 创建一个动画基类
		 */
        constructor(gameObject: GameObject)
        {
            super(gameObject);
        }

		/**
		 * 获取动画状态
		 * @param node		动画节点
		 * @return			动画状态
		 */
        public getAnimationState(node: AnimationNodeBase): AnimationStateBase
        {
            var cls = node.stateClass;
            var className: string = ClassUtils.getQualifiedClassName(cls);
            if (this._animationStates[className] == null)
                this._animationStates[className] = new cls(this, node);

            return this._animationStates[className];
        }

		/**
		 * 动画时间
		 */
        public get time(): number
        {
            return this._time;
        }

        public set time(value: number)
        {
            if (this._time == value)
                return;

            this.update(value);
        }

		/**
		 * 播放速度
		 * <p>默认为1，表示正常速度</p>
		 */
        public get playbackSpeed(): number
        {
            return this._playbackSpeed;
        }

        public set playbackSpeed(value: number)
        {
            this._playbackSpeed = value;
        }

		/**
		 * 开始动画，当自动更新为true时有效
		 */
        public start()
        {
            if (this._isPlaying || !this._autoUpdate)
                return;

            this._time = this._absoluteTime = Date.now();

            this._isPlaying = true;

            Event.on(ticker, <any>"enterFrame", this.onEnterFrame, this);

            if (!Event.has(this, <any>AnimatorEvent.START))
                return;

            Event.dispatch(this, <any>AnimatorEvent.START, this);
        }

		/**
		 * 暂停播放动画
		 * @see #time
		 * @see #update()
		 */
        public stop()
        {
            if (!this._isPlaying)
                return;

            this._isPlaying = false;

            if (Event.has(ticker, <any>"enterFrame"))
                Event.off(ticker, <any>"enterFrame", this.onEnterFrame, this);

            if (!Event.has(this, <any>AnimatorEvent.STOP))
                return;

            Event.dispatch(this, <any>AnimatorEvent.STOP, this);
        }

		/**
		 * 更新动画
		 * @param time			动画时间
		 */
        public update(time: number)
        {
            var dt: number = (time - this._time) * this.playbackSpeed;

            this.updateDeltaTime(dt);

            this._time = time;
        }

		/**
		 * 更新偏移时间
		 * @private
		 */
        protected updateDeltaTime(dt: number)
        {
            this._absoluteTime += dt;

            this._activeState.update(this._absoluteTime);

            if (this.updatePosition)
                this.applyPositionDelta();
        }

		/**
		 * 自动更新动画时帧更新事件
		 */
        private onEnterFrame(event: Event = null)
        {
            this.update(Date.now());
        }

        /**
		 * 应用位置偏移量
		 */
        private applyPositionDelta()
        {
            var delta: Vector3D = this._activeState.positionDelta;
            var dist: number = delta.length;
            var len: number;
            if (dist > 0)
            {
            }
        }
    }
}
