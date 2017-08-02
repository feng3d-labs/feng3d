namespace feng3d
{
    export interface AnimatorBaseEventMap extends ComponentEventMap
    {
        /** 开始播放动画 */
        start

        /** 继续播放动画 */
        play

        /** 停止播放动画 */
        stop
    }

    export interface AnimatorBase
    {
        once<K extends keyof AnimatorBaseEventMap>(type: K, listener: (event: AnimatorBaseEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof AnimatorBaseEventMap>(type: K, data?: AnimatorBaseEventMap[K], bubbles?: boolean);
        has<K extends keyof AnimatorBaseEventMap>(type: K): boolean;
        on<K extends keyof AnimatorBaseEventMap>(type: K, listener: (event: AnimatorBaseEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof AnimatorBaseEventMap>(type?: K, listener?: (event: AnimatorBaseEventMap[K]) => any, thisObject?: any);
    }

	/**
	 * 动画基类
	 * @author feng 2014-5-27
	 */
    export abstract class AnimatorBase extends Component
    {

        /** 是否正在播放动画 */
        private _isPlaying: boolean;
        private _autoUpdate = true;
        private _time = 0;
        /** 播放速度 */
        private _playbackSpeed = 1;

        protected _activeNode: AnimationNodeBase;
        protected _activeState: AnimationStateBase;
        /** 当前动画时间 */
        protected _absoluteTime = 0;
        private _animationStates = {};

		/**
		 * 是否更新位置
		 */
        updatePosition = true;

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
        getAnimationState(node: AnimationNodeBase): AnimationStateBase
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
        get time(): number
        {
            return this._time;
        }

        set time(value: number)
        {
            if (this._time == value)
                return;

            this.update(value);
        }

		/**
		 * 播放速度
		 * <p>默认为1，表示正常速度</p>
		 */
        get playbackSpeed(): number
        {
            return this._playbackSpeed;
        }

        set playbackSpeed(value: number)
        {
            this._playbackSpeed = value;
        }

		/**
		 * 开始动画，当自动更新为true时有效
		 */
        start()
        {
            if (this._isPlaying || !this._autoUpdate)
                return;

            this._time = this._absoluteTime = Date.now();

            this._isPlaying = true;

            ticker.on("enterFrame", this.onEnterFrame, this);

            if (!this.has("start"))
                return;

            this.dispatch("start", this);
        }

		/**
		 * 暂停播放动画
		 * @see #time
		 * @see #update()
		 */
        stop()
        {
            if (!this._isPlaying)
                return;

            this._isPlaying = false;

            if (ticker.has("enterFrame"))
                ticker.off("enterFrame", this.onEnterFrame, this);

            if (!this.has("stop"))
                return;
            this.dispatch("stop", this);
        }

		/**
		 * 更新动画
		 * @param time			动画时间
		 */
        update(time: number)
        {
            var dt = (time - this._time) * this.playbackSpeed;

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
        private onEnterFrame(event: EventVO = null)
        {
            this.update(Date.now());
        }

        /**
		 * 应用位置偏移量
		 */
        private applyPositionDelta()
        {
            var delta: Vector3D = this._activeState.positionDelta;
            var dist = delta.length;
            var len: number;
            if (dist > 0)
            {
            }
        }
    }
}
