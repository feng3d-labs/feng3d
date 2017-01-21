module feng3d {

	/**
	 * 动画基类
	 * @author feng 2014-5-27
	 */
    export abstract class AnimatorBase extends Component {

        /** 是否正在播放动画 */
        private _isPlaying: boolean;
        private _autoUpdate: boolean = true;
        private _time: number;
        /** 播放速度 */
        private _playbackSpeed: number = 1;

        protected _animationSet: IAnimationSet;
        protected _activeNode: AnimationNodeBase;
        protected _activeState: IAnimationState;
        protected _activeAnimationName: string;
        /** 当前动画时间 */
        protected _absoluteTime: number;
        private _animationStates = {};

		/**
		 * 是否更新位置
		 * @see me.feng3d.animators.base.states.IAnimationState#positionDelta
		 */
        public updatePosition: boolean = true;

		/**
		 * 创建一个动画基类
		 * @param animationSet
		 */
        constructor(animationSet: IAnimationSet) {
            super();
            this._animationSet = animationSet;
            this.initBuffers();
        }

		/**
		 * 初始化Context3d缓存
		 */
        protected initBuffers() {

        }

		/**
		 * 获取动画状态
		 * @param node		动画节点
		 * @return			动画状态
		 */
        public getAnimationState(node: AnimationNodeBase): AnimationStateBase {
            var cls = node.stateClass;
            var className: string = getClassName(cls);
            if (this._animationStates[className] == null)
                this._animationStates[className] = new cls(this, node);

            return this._animationStates[className];
        }

		/**
		 * 根据名字获取动画状态
		 * @param name			动作名称
		 * @return				动画状态
		 */
        public getAnimationStateByName(name: string): AnimationStateBase {
            return this.getAnimationState(this._animationSet.getAnimation(name));
        }

		/**
		 * 绝对时间（游戏时间）
		 * @see #time
		 * @see #playbackSpeed
		 */
        public get absoluteTime(): number {
            return this._absoluteTime;
        }

		/**
		 * 动画设置
		 */
        public get animationSet(): IAnimationSet {
            return this._animationSet;
        }

		/**
		 * 活动的动画状态
		 */
        public get activeState(): IAnimationState {
            return this._activeState;
        }

		/**
		 * 活动的动画节点
		 */
        public get activeAnimation(): AnimationNodeBase {
            return this._animationSet.getAnimation(this._activeAnimationName);
        }

		/**
		 * 活动的动作名
		 */
        public get activeAnimationName(): string {
            return this._activeAnimationName;
        }

		/**
		 * 是否自动更新，当值为true时，动画将会随时间播放
		 * @see #time
		 * @see #update()
		 */
        public get autoUpdate(): boolean {
            return this._autoUpdate;
        }

        public set autoUpdate(value: boolean) {
            if (this._autoUpdate == value)
                return;

            this._autoUpdate = value;

            if (this._autoUpdate)
                this.start();
            else
                this.stop();
        }

		/**
		 * 动画时间
		 */
        public get time(): number {
            return this._time;
        }

        public set time(value: number) {
            if (this._time == value)
                return;

            this.update(value);
        }

		/**
		 * 设置当前活动状态的动画剪辑的播放进度(0,1)
		 * @param	播放进度。 0：动画起点，1：动画终点。
		 */
        public phase(value: number) {
            this._activeState.phase(value);
        }

		/**
		 * The amount by which passed time should be scaled. Used to slow down or speed up animations. Defaults to 1.
		 */
		/**
		 * 播放速度
		 * <p>默认为1，表示正常速度</p>
		 */
        public get playbackSpeed(): number {
            return this._playbackSpeed;
        }

        public set playbackSpeed(value: number) {
            this._playbackSpeed = value;
        }

		/**
		 * 开始动画，当自动更新为true时有效
		 * @see #autoUpdate
		 */
        public start() {
            if (this._isPlaying || !this._autoUpdate)
                return;

            this._time = this._absoluteTime = getTimer();

            this._isPlaying = true;

            if (!$ticker.hasEventListener(Event.ENTER_FRAME))
                $ticker.addEventListener(Event.ENTER_FRAME, this.onEnterFrame, this);

            if (!this.hasEventListener(AnimatorEvent.START))
                return;

            this.dispatchEvent(new AnimatorEvent(AnimatorEvent.START, this));
        }


		/**
		 * 暂停播放动画
		 * @see #time
		 * @see #update()
		 */
        public stop() {
            if (!this._isPlaying)
                return;

            this._isPlaying = false;

            if ($ticker.hasEventListener(Event.ENTER_FRAME))
                $ticker.removeEventListener(Event.ENTER_FRAME, this.onEnterFrame, this);

            if (!this.hasEventListener(AnimatorEvent.STOP))
                return;

            this.dispatchEvent(new AnimatorEvent(AnimatorEvent.STOP, this));
        }

		/**
		 * 更新动画
		 * @param time			动画时间
		 *
		 * @see #stop()
		 * @see #autoUpdate
		 */
        public update(time: number) {
            var dt: number = (time - this._time) * this.playbackSpeed;

            this.updateDeltaTime(dt);

            this._time = time;
        }

		/**
		 * 重置动画
		 * @param name			动画名称
		 * @param offset		动画时间偏移
		 */
        public reset(name: string, offset: number = 0) {
            this.getAnimationState(this._animationSet.getAnimation(name)).offset(offset + this._absoluteTime);
        }

		/**
		 * 更新偏移时间
		 * @private
		 */
        protected updateDeltaTime(dt: number) {
            this._absoluteTime += dt;

            this._activeState.update(this._absoluteTime);
        }

		/**
		 * 自动更新动画时帧更新事件
		 */
        private onEnterFrame(event: Event = null) {
            this.update(getTimer());
        }

		/**
		 * 派发动画播放完成一周期事件
		 * @private
		 */
        public dispatchCycleEvent() {
            if (this.hasEventListener(AnimatorEvent.CYCLE_COMPLETE))
                this.dispatchEvent(new AnimatorEvent(AnimatorEvent.CYCLE_COMPLETE, this));
        }
    }
}
